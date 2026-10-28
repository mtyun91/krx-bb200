"""
Gemini 대화창의 답을 코드에 적용한다 — 답을 복사(Ctrl+C)한 뒤 실행하면 클립보드에서 읽음.

    python tools/apply_gemini.py            # 클립보드의 답을 적용
    python tools/apply_gemini.py 답.txt     # 파일에 저장한 답을 적용
    python tools/apply_gemini.py --check    # 적용하지 않고 맞는지만 확인

답 형식 (tools/make_pack.py 가 Gemini에게 알려 줌)
    커밋: 한 줄 설명
    <<<<<<< 파일: partisan_investment.html
    지금 코드
    =======
    바꿀 코드
    >>>>>>>

전부 맞아야 적용한다 — 한 블록이라도 못 찾거나 문법 검사에 걸리면 아무 파일도 바꾸지 않고, Gemini에게 그대로 붙여 넣을 오류 설명을 보여 준다.
통과하면 커밋하고 GitHub에 올린다 (화면 버전은 pre-commit 훅이 올림).
"""
import ast
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOWED = {"partisan_investment.html", "nh_bridge_core.py", "nh_bridge.py"}
REPORT = os.path.join(ROOT, "gemini_pack", "적용_결과.txt")
BLOCK = re.compile(r"^<{7} ?파일:\s*(\S+)[ \t]*\r?\n(.*?)^={7}[ \t]*\r?\n(.*?)^>{7}[ \t]*$", re.S | re.M)


def clipboard():
    try:
        import tkinter
        r = tkinter.Tk()
        r.withdraw()
        t = r.clipboard_get()
        r.destroy()
        return t
    except Exception:
        pass
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-Command", "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard -Raw"],
                             capture_output=True, timeout=10)
        return out.stdout.decode("utf-8", "replace")
    except Exception:
        return ""


def strip_nl(s):
    return s[:-1] if s.endswith("\n") else s


FENCE = re.compile(r"^\s*(`{3,}|~{3,})[\w-]*\s*$")


def unfence(s):
    """블록 안 코드를 ```로 감싼 답도 받아 줌 — 맨 앞·맨 뒤의 코드 상자 줄만 뗌"""
    lines = s.split("\n")
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    if len(lines) >= 2 and FENCE.match(lines[0]) and FENCE.match(lines[-1]):
        lines = lines[1:-1]
    return "\n".join(lines)


def find_span(text, old):
    """정확히 한 곳 → (시작, 끝). 없으면 줄 끝 공백·줄바꿈 차이를 무시하고 줄 단위로 다시 찾음"""
    n = text.count(old)
    if n == 1:
        i = text.index(old)
        return i, i + len(old), None
    if n > 1:
        return None, None, f"{n}곳에서 찾아짐 — 앞뒤 줄을 더 넣어 한 곳만 찾아지게 해야 함"
    lines = text.split("\n")
    want = [x.rstrip() for x in old.replace("\r\n", "\n").split("\n")]
    while want and not want[-1]:
        want.pop()
    if not want:
        return None, None, "지금 코드가 비어 있음"
    hits = [k for k in range(len(lines) - len(want) + 1) if all(lines[k + j].rstrip() == want[j] for j in range(len(want)))]
    if len(hits) == 1:
        k = hits[0]
        start = sum(len(x) + 1 for x in lines[:k])
        end = start + sum(len(x) + 1 for x in lines[k:k + len(want)]) - 1
        return start, end, None
    if len(hits) > 1:
        return None, None, f"{len(hits)}곳에서 찾아짐 — 앞뒤 줄을 더 넣어 한 곳만 찾아지게 해야 함"
    first = want[0].strip()
    near = [i + 1 for i, x in enumerate(lines) if first and first in x][:5]
    return None, None, "파일에서 찾지 못함" + (f" (첫 줄은 {near}번째 줄 근처에 있음 — 그 아래 줄이 다름)" if near else " (첫 줄도 없음)")


def check_syntax(name, text):
    if name.endswith(".py"):
        try:
            ast.parse(text)
            return None
        except SyntaxError as e:
            return f"파이썬 문법 오류 {e.lineno}번째 줄: {e.msg}"
    i = text.find("<script>\n")
    j = text.rfind("</script>")
    if i < 0 or j < 0:
        return "<script> 부분을 찾지 못함"
    js = text[i + 9:j]
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(js)
        tmp = f.name
    try:
        r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True, encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return None  # node 가 없으면 건너뜀
    finally:
        os.unlink(tmp)
    if r.returncode != 0:
        line0 = text[:i + 9].count("\n")
        msg = r.stderr.strip().split("\n")
        m = re.search(r":(\d+)\s*$", msg[0]) if msg else None
        where = f"html {int(m.group(1)) + line0}번째 줄 근처 · " if m else ""
        return f"자바스크립트 문법 오류 {where}" + " / ".join(x.strip() for x in msg[1:5] if x.strip())
    return None


def say(lines):
    text = "\n".join(lines)
    print(text)
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(text + "\n")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    only_check = "--check" in sys.argv
    if args:
        with open(args[0], encoding="utf-8") as f:
            answer = f.read()
    else:
        answer = clipboard()
    answer = answer.replace("\r\n", "\n")
    blocks = BLOCK.findall(answer)
    if not blocks:
        if "<<<<<<<" in answer and not re.search(r"^={7}\s*$", answer, re.M):
            say(["✖ 적용할 수 없어요 — 화면에 보이는 글자를 그대로 복사해서 '=======' 같은 구분 줄이 사라졌어요.",
                 "Gemini 화면은 코드 상자 밖의 HTML을 그려 버리고 구분 줄을 지워요. 아래를 Gemini에게 붙여 넣고, 다시 받은 답에서 코드 상자의 '복사' 버튼으로 복사하세요:", "",
                 "방금 답을 적용할 수 없었어. 커밋 줄과 모든 수정 블록(<<<<<<< 파일: … ======= … >>>>>>>)을 ```text 코드 상자 하나 안에 통째로 넣어서 다시 줘. "
                 "'지금 코드'는 첨부한 소스에 실제로 있는 코드 그대로 쓰고, 아직 없는 요소·함수는 지금 코드로 쓰지 마. 한 번에 기능 하나씩 줘."])
        else:
            say(["✖ 적용할 코드 블록이 없어요.", "Gemini 답의 코드 상자 '복사' 버튼으로 복사했는지 확인하세요. 블록은 '<<<<<<< 파일: 이름' ~ '=======' ~ '>>>>>>>' 형식이어야 해요."])
        return 1
    m = re.search(r"^커밋:\s*(.+)$", answer, re.M)
    msg = m.group(1).strip() if m else "Gemini 수정"

    files, eol, errors = {}, {}, []
    for k, (name, old, new) in enumerate(blocks, 1):
        name = name.strip().strip("`")
        if name not in ALLOWED:
            errors.append(f"블록 {k}: '{name}'은(는) 고칠 수 있는 파일이 아니에요 (가능: {', '.join(sorted(ALLOWED))})")
            continue
        path = os.path.join(ROOT, name)
        if name not in files:
            if os.path.exists(path):
                with open(path, encoding="utf-8", newline="") as f:
                    raw = f.read()
                eol[name] = "\r\n" if "\r\n" in raw else "\n"
                files[name] = raw.replace("\r\n", "\n")
            else:
                eol[name], files[name] = "\n", None
        old, new = unfence(strip_nl(old)), unfence(strip_nl(new))
        if files[name] is None:
            if old.strip():
                errors.append(f"블록 {k} ({name}): 파일이 없어요")
            else:
                files[name] = new + "\n"
            continue
        if not old.strip():
            errors.append(f"블록 {k} ({name}): '지금 코드'가 비어 있어요 — 어디를 바꿀지 알 수 없음")
            continue
        s, e, why = find_span(files[name], old)
        if why:
            errors.append(f"블록 {k} ({name}): {why}\n    지금 코드 첫 줄: {old.strip().splitlines()[0][:120]}")
            continue
        files[name] = files[name][:s] + new + files[name][e:]

    if not errors:
        for name, text in files.items():
            err = check_syntax(name, text)
            if err:
                errors.append(f"{name}: {err}")
    if errors:
        say(["✖ 적용하지 않았어요 (아무 파일도 바뀌지 않음). 아래를 Gemini에게 그대로 붙여 넣으세요:", "",
             "답을 적용하려 했는데 다음 문제가 있었어. 지금 파일 내용에 맞게 고친 블록을 다시 줘.", *[f"- {x}" for x in errors]])
        return 1
    if only_check:
        say([f"✔ 블록 {len(blocks)}개 모두 적용할 수 있어요 (확인만 함, 파일은 그대로)."])
        return 0

    for name, text in files.items():
        with open(os.path.join(ROOT, name), "w", encoding="utf-8", newline="") as f:
            f.write(text.replace("\n", eol[name]))
    out = [f"✔ 블록 {len(blocks)}개를 적용했어요: {', '.join(files)}", f"  커밋: {msg}"]
    try:
        subprocess.run(["git", "add", *files], cwd=ROOT, check=True)
        subprocess.run(["git", "commit", "-q", "-m", msg], cwd=ROOT, check=True)
        p = subprocess.run(["git", "push", "-q"], cwd=ROOT)
        ver = re.search(r"APP_VERSION = '([^']+)'", open(os.path.join(ROOT, "partisan_investment.html"), encoding="utf-8").read())
        out.append(f"✔ 커밋{'·GitHub 올리기' if p.returncode == 0 else ' 완료 (GitHub 올리기는 실패 — 인터넷·로그인 확인)'} · 화면 버전 v{ver.group(1) if ver else '?'}")
    except subprocess.CalledProcessError:
        out.append("⚠ 파일은 바뀌었지만 커밋하지 못했어요 (git 상태를 확인하세요)")
    out.append("화면에 '새 버전' 띠가 뜨면 새로고침하세요. 중계기 파일을 고쳤다면 실행기가 알아서 다시 띄워요.")
    say(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
