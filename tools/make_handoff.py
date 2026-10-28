"""
작업 넘겨받기 문서를 다시 만든다 — 코드가 바뀐 뒤 실행하면 줄 번호가 맞춰짐.

    python tools/make_handoff.py

- docs/CODE_MAP.md       : 앱·중계기의 구역 · 함수 · 설정 키 · 비서 명령 · 중계기 주소를 줄 번호와 함께
- docs/HANDOFF_BUNDLE.md : GEMINI.md + STRATEGY.md + CODE_MAP.md 를 한 파일로 (Gemini 웹 대화창에 올릴 때)
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "partisan_investment.html")
CORE = os.path.join(ROOT, "nh_bridge_core.py")
DOCS = os.path.join(ROOT, "docs")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def app_map(src):
    lines = src.split("\n")
    out = ["## partisan_investment.html", "", f"총 {len(lines):,}줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).", ""]
    # 버전
    m = re.search(r"const APP_VERSION = '([^']+)', APP_DATE = '([^']+)'", src)
    if m:
        out += [f"화면 버전: v{m.group(1)} · {m.group(2)} (pre-commit 훅이 자동으로 올림)", ""]
    # 구역 머리 주석 + 그 아래 최상위 함수
    out += ["### 구역과 함수 (줄 번호)", ""]
    sec = re.compile(r"^    // (\d+(?:-\d+)?\. .+|---- .+?)(?: ----)?$")
    fn = re.compile(r"^    (?:async )?function ([A-Za-z0-9_$]+)\s*\(|^    const ([A-Za-z0-9_$]+) = (?:async )?(?:\([^)]*\)|[A-Za-z0-9_$]+) =>")
    cur = None
    for i, ln in enumerate(lines, 1):
        s = sec.match(ln)
        if s and not ln.strip().startswith("// ====="):
            title = s.group(1).strip().rstrip("-").strip()
            out.append(f"\n**{i}** · {title}")
            cur = title
            continue
        f = fn.match(ln)
        if f:
            out.append(f"- `{f.group(1) or f.group(2)}` {i}")
    # 설정 기본값
    m = re.search(r"const DEFAULTS = \{(.*?)\n    \};", src, re.S)
    if m:
        keys = re.findall(r"(?:^|[\s,{])([A-Za-z_][A-Za-z0-9_]*):", m.group(1))
        out += ["", "### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)", "", ", ".join(f"`{k}`" for k in keys)]
    # 상태
    m = re.search(r"const state = \{(.*?)\n    \};", src, re.S)
    if m:
        keys = re.findall(r"^      ([A-Za-z0-9_]+):", m.group(1), re.M)
        out += ["", "### `state` 키", "", ", ".join(f"`{k}`" for k in keys),
                "", "동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것)."]
    # 비서 명령
    m = re.search(r"async function runAction\(a, src[^)]*\) \{(.*?)\n    \}\n", src, re.S)
    if m:
        cases = re.findall(r"case '([^']+)'", m.group(1))
        out += ["", "### 비서 화면 명령 (`runAction`의 `do` 값)", "", ", ".join(f"`{c}`" for c in dict.fromkeys(cases))]
    # 보조지표
    inds = re.findall(r"\{ k: '([a-z]+)', name: '([^']+)', pane: '(price|sub)'", src)
    if inds:
        out += ["", "### 보조지표 (`IND_LIB`)", "", ", ".join(f"`{k}` {n}({'위' if p == 'price' else '아래'})" for k, n, p in inds)]
    return out


def core_map(src):
    lines = src.split("\n")
    out = ["", "## nh_bridge_core.py", "", f"총 {len(lines):,}줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.", ""]
    eps = sorted(set(re.findall(r'self\.path == "([^"]+)"', src)))
    out += ["### 주소 (POST JSON, 헤더에 토큰)", "", ", ".join(f"`{e}`" for e in eps) + ", `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)", ""]
    m = re.search(r"ASK_PURPOSE = \{(.*?)\n\}", src, re.S)
    if m:
        out += ["### AI 요청 종류 (`ASK_PURPOSE`)", "", ", ".join(f"`{k}`" for k in re.findall(r'^    "([a-z]+)":', m.group(1), re.M)),
                "", "비서 대화 규칙·명령 설명은 `CHAT_STYLE`, `CHAT_ACTIONS` 문자열.", ""]
    out += ["### 함수·클래스 (줄 번호)", ""]
    for i, ln in enumerate(lines, 1):
        m = re.match(r"^(def|class) ([A-Za-z0-9_]+)", ln)
        if m:
            out.append(f"- `{m.group(2)}` {i}")
    return out


def main():
    os.makedirs(DOCS, exist_ok=True)
    body = ["# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)", ""]
    body += app_map(read(APP))
    body += core_map(read(CORE))
    cm = "\n".join(body) + "\n"
    with open(os.path.join(DOCS, "CODE_MAP.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(cm)
    parts = [read(os.path.join(ROOT, "GEMINI.md")), read(os.path.join(DOCS, "STRATEGY.md")), cm]
    with open(os.path.join(DOCS, "HANDOFF_BUNDLE.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n\n---\n\n".join(parts))
    print("docs/CODE_MAP.md · docs/HANDOFF_BUNDLE.md 를 만들었어요")


if __name__ == "__main__":
    main()
