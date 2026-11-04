"""
나무 PLUG 중계기 실행기 — 키는 처음 한 번만 입력하고, 중계기 본체(nh_bridge_core.py)가 바뀌면 본체만 자동으로 다시 띄운다.

- 앱키·시크릿은 이 실행기의 메모리에만 두고, 본체에는 환경변수로만 넘긴다 (파일에 저장하지 않음).
- 본체 코드를 고치면 1초 안에 알아채서 문법을 먼저 확인하고, 문제없을 때만 본체를 다시 시작한다.
  문법 오류가 있으면 지금 돌던 본체를 그대로 둔다.
- 본체가 갑자기 죽으면 3초 뒤 다시 띄운다.

    python nh_bridge.py --ask           (실제 시세 — 앱키·시크릿 입력)
    python nh_bridge.py --ask --trade   (+ 실계좌 주문 — 계좌번호·환경·한도 입력)
    python nh_bridge.py --demo          (가짜 시세)
    python nh_bridge.py --ask --background   (키를 입력한 뒤 창 없이 뒤에서 돎 — 창을 닫아도 계속, 끄기는 윈도우_중계기_끄기.bat)
종료: Ctrl+C
"""
import os
import py_compile
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
CORE = os.path.join(HERE, "nh_bridge_core.py")


def hidden_input(prompt):
    """콘솔 에코를 끈 채 한 줄 입력 — 내장 터미널(ConPTY)에서도 동작하도록 표준입력으로 읽음"""
    print(prompt, end="", flush=True)
    if os.name == "nt":
        import ctypes
        import ctypes.wintypes
        k32 = ctypes.windll.kernel32
        handle = k32.GetStdHandle(-10)
        mode = ctypes.wintypes.DWORD()
        if k32.GetConsoleMode(handle, ctypes.byref(mode)):
            k32.SetConsoleMode(handle, mode.value & ~0x0004)  # ENABLE_ECHO_INPUT 끔
            try:
                line = sys.stdin.readline()
            finally:
                k32.SetConsoleMode(handle, mode.value)
                print()
            return line.strip()
    import getpass
    return getpass.getpass("").strip()


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] [실행기] {msg}", flush=True)


def ask_money(prompt, default):
    while True:
        s = input(f"{prompt} [기본 {default:,}원]: ").strip().replace(",", "").replace("원", "")
        if not s:
            return default
        if s.isdigit() and int(s) > 0:
            return int(s)
        print("  숫자로 입력하세요 (예: 1000000)")


def ask_trade(env):
    """실계좌 주문 설정 — 계좌번호는 메모리·환경변수에만, 한도는 화면(브라우저)에서 못 바꾸도록 여기서만 정함"""
    print("\n── 실계좌 주문 설정 ── (주문은 화면에서 매번 직접 눌러 확인해야 나가고, 중계기를 켤 때마다 '정지' 상태로 시작합니다)", flush=True)
    acct = hidden_input("계좌번호 11자리 붙여넣고 Enter (화면에 안 보임 · '-' 있어도 됨): ").replace("-", "").replace(" ", "")
    if not (acct.isdigit() and len(acct) == 11):
        print("  → 계좌번호가 11자리 숫자가 아니라서 실계좌 주문 없이 실행합니다.", flush=True)
        return
    print(f"  → 계좌번호 입력됨 (끝 4자리 {acct[-4:]})", flush=True)
    mode = input("어느 서버로 주문할까요? 모의투자=m · 실전=live [기본 m]: ").strip().lower() or "m"
    if mode == "live":
        if input("실전은 실제 돈으로 체결됩니다. 계속하려면 '실전' 이라고 입력: ").strip() != "실전":
            print("  → 확인 문구가 달라서 모의투자로 실행합니다.", flush=True)
            mode = "m"
    env["NH_ACCT_NO"] = acct
    env["NH_TRADE_ENV"] = "live" if mode == "live" else "mock"
    env["NH_MAX_ORDER"] = str(ask_money("1회 주문 한도", 1_000_000))
    env["NH_MAX_DAY"] = str(ask_money("하루 주문 한도 (매수·매도 합계)", 3_000_000))
    print(f"  → {'실전' if mode == 'live' else '모의투자'} · 1회 {int(env['NH_MAX_ORDER']):,}원 · 하루 {int(env['NH_MAX_DAY']):,}원\n", flush=True)


LOG_DIR = os.path.join(HERE, "logs")
PID_FILE = os.path.join(LOG_DIR, "bridge.pid")


def go_background(env, args):
    """키 입력이 끝난 실행기를 창 없는 새 프로세스로 다시 띄우고 이 창은 끝냄 — 키는 그 프로세스의 메모리(환경변수)에만"""
    os.makedirs(LOG_DIR, exist_ok=True)
    log_path = os.path.join(LOG_DIR, "bridge.log")
    try:   # 기록이 5MB를 넘으면 한 번 밀어 둠
        if os.path.getsize(log_path) > 5_000_000:
            os.replace(log_path, log_path + ".old")
    except OSError:
        pass
    env = dict(env)
    env["NH_BG"] = "1"
    logf = open(log_path, "a", encoding="utf-8")
    logf.write(f"\n===== {time.strftime('%Y-%m-%d %H:%M:%S')} 뒤에서 켜기 =====\n")
    logf.flush()
    cmd = [sys.executable, "-u", os.path.abspath(__file__)] + args
    kw = dict(env=env, stdin=subprocess.DEVNULL, stdout=logf, stderr=subprocess.STDOUT, cwd=HERE, close_fds=True)
    if os.name == "nt":
        w = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
        if os.path.exists(w):
            cmd[0] = w
        kw["creationflags"] = 0x00000008 | 0x00000200 | 0x08000000   # DETACHED_PROCESS · 새 프로세스 그룹 · 창 없음
    else:
        kw["start_new_session"] = True
    p = subprocess.Popen(cmd, **kw)
    with open(PID_FILE, "w", encoding="utf-8") as f:
        f.write(str(p.pid))
    time.sleep(5)
    if p.poll() is not None:
        print(f"\n중계기가 켜지자마자 멈췄어요 (코드 {p.returncode}). 기록: {log_path}", flush=True)
        return 1
    print("\n중계기를 뒤에서 켰어요. 이제 이 창을 닫아도 계속 돌아요.", flush=True)
    print(f"  · 기록: {log_path}", flush=True)
    print("  · 끄기: 윈도우_중계기_끄기.bat 더블클릭 (또는 컴퓨터를 끄면 꺼짐)", flush=True)
    print("  · 컴퓨터를 다시 켜면 키를 다시 넣어야 해요 (키는 어디에도 저장하지 않음)", flush=True)
    return 0


def main():
    args = [a for a in sys.argv[1:] if a not in ("--ask", "--trade", "--background")]
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    if "--demo" not in args and not (env.get("NH_APPKEY") and env.get("NH_APPSECRET")):
        env["NH_APPKEY"] = env.get("NH_APPKEY") or hidden_input("나무 PLUG 앱키 붙여넣고 Enter (화면에 안 보임): ")
        print(f"  → 앱키 입력됨 ({len(env['NH_APPKEY'])}자)", flush=True)
        env["NH_APPSECRET"] = env.get("NH_APPSECRET") or hidden_input("나무 PLUG 앱시크릿 붙여넣고 Enter (화면에 안 보임): ")
        print(f"  → 앱시크릿 입력됨 ({len(env['NH_APPSECRET'])}자)", flush=True)
        if not (env["NH_APPKEY"] and env["NH_APPSECRET"]):
            print("앱키·시크릿이 비어 있습니다. 다시 실행하세요.")
            sys.exit(1)
    if "--ask" in sys.argv and not env.get("ANTHROPIC_API_KEY"):
        k = hidden_input("(선택) Claude API 키 — 리서치 센터 AI 코멘트용, 없으면 그냥 Enter (화면에 안 보임): ")
        if k:
            env["ANTHROPIC_API_KEY"] = k
            print(f"  → Claude API 키 입력됨 ({len(k)}자)", flush=True)
        else:
            print("  → AI 코멘트 없이 실행", flush=True)
    if "--trade" in sys.argv and "--demo" not in args and not env.get("NH_ACCT_NO"):
        ask_trade(env)
    if "--background" in sys.argv and not env.get("NH_BG"):
        sys.exit(go_background(env, args))

    child = None

    def start():
        nonlocal child
        child = subprocess.Popen([sys.executable, "-u", CORE] + args, env=env, stdin=subprocess.DEVNULL)
        return time.time()

    def stop():
        if child and child.poll() is None:
            child.terminate()
            try:
                child.wait(5)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait(5)

    log("키는 이 창의 메모리에만 있습니다. nh_bridge_core.py 를 고치면 중계기만 자동으로 다시 시작합니다 (키 재입력 불필요).")
    mtime = os.path.getmtime(CORE)
    started = start()
    broken_mtime = None   # 시작하자마자 죽은 버전 — 파일이 다시 바뀔 때까지 재시작하지 않음
    quick = 0             # 시작 직후 연속 종료 횟수
    try:
        while True:
            time.sleep(1)
            try:
                m = os.path.getmtime(CORE)
            except OSError:
                continue
            if m != mtime:
                time.sleep(0.5)   # 저장이 끝날 때까지 잠깐 대기
                m = os.path.getmtime(CORE)
                mtime = m
                try:
                    py_compile.compile(CORE, doraise=True)
                except py_compile.PyCompileError as err:
                    log(f"코드에 문법 오류가 있어 지금 중계기를 그대로 둡니다: {str(err).splitlines()[-1]}")
                    continue
                log("코드 변경 감지 → 중계기 다시 시작")
                stop()
                started, broken_mtime, quick = start(), None, 0
                continue
            if child.poll() is not None and broken_mtime != mtime:
                code = child.returncode
                if time.time() - started < 5:
                    quick += 1
                    if quick < 3:   # 포트가 아직 안 풀렸을 수 있음 → 잠깐 뒤 다시
                        time.sleep(2)
                        started = start()
                        continue
                    broken_mtime, quick = mtime, 0
                    log(f"중계기가 시작하자마자 종료됐습니다 (코드 {code}). 코드를 고치면 다시 시작합니다.")
                else:
                    quick = 0
                    log(f"중계기가 종료됐습니다 (코드 {code}) → 3초 뒤 다시 시작")
                    time.sleep(3)
                    started = start()
    except KeyboardInterrupt:
        pass
    finally:
        stop()
        log("종료")


if __name__ == "__main__":
    main()
