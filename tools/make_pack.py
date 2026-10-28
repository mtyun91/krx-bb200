"""
Gemini 대화창(웹·앱)에 올릴 자료를 만든다 — 파일 하나만 올리면 Gemini가 프로젝트 전체를 알고 작업할 수 있게.

    python tools/make_pack.py

만들어지는 것 (gemini_pack/ 폴더, git에는 안 올라감)
- 파르티잔_전체자료.md : 작업 안내 + 답하는 형식 + 전략 + 코드 지도 + 소스 파일 전체  ← 이 파일 하나를 Gemini에 올림
- 첫_메시지.txt        : 자료를 올릴 때 같이 붙여 넣을 첫 메시지
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "gemini_pack")
SOURCES = ["partisan_investment.html", "nh_bridge_core.py", "nh_bridge.py"]

ANSWER_RULES = """# Gemini에게 — 답하는 형식 (꼭 지킬 것)

너는 웹 대화창에 있어서 파일을 직접 고칠 수 없다. 사용자는 네 답을 복사해서 `제미나이_답_적용.bat`으로 코드에 적용한다.
그 도구가 알아들을 수 있게 **코드를 바꿀 때는 반드시 아래 형식만** 쓴다.

**가장 중요: 커밋 줄과 모든 수정 블록을 통째로 `text` 코드 상자 하나(```text … ```) 안에 넣는다.** 코드 상자 밖에 두면 대화창이 HTML을 그려 버리고 `=======`·`>>>>>>>` 줄이 사라져서 적용이 안 된다. 사용자는 그 코드 상자의 '복사' 버튼으로 복사한다.

````text
```text
커밋: 무엇을 바꿨는지 한국어 한 줄

<<<<<<< 파일: partisan_investment.html
지금 파일에 있는 코드 그대로 (공백·들여쓰기까지 정확히, 파일 안에서 딱 한 곳만 찾아지도록 앞뒤 몇 줄 포함)
=======
바꿀 코드
>>>>>>>

<<<<<<< 파일: nh_bridge_core.py
...
=======
...
>>>>>>>
```
````

- 코드 상자 안에 또 ``` 를 넣지 않는다 (블록 안의 코드도 그냥 그대로).
- 한 답에 블록 여러 개 가능.
- '지금 코드'는 반드시 아래 소스 파일에 **실제로 있는** 코드다. 아직 없는 요소·함수(예: 네가 새로 만들 id)를 지금 코드로 쓰지 않는다. 새 코드를 넣을 때는 바로 앞의 실제 코드 몇 줄을 지금 코드로 잡고, 바꿀 코드에 그 줄 + 새 코드를 쓴다.
- 새로 쓰는 함수·변수가 소스에 이미 있는지 확인한다(없는 함수를 부르지 말 것). 한 번에 너무 많이 바꾸지 말고 기능 하나씩. 파일 이름은 `partisan_investment.html`, `nh_bridge_core.py`, `nh_bridge.py` 중 하나(새 파일이면 `=======` 위를 비움).
- 위쪽(지금 코드)은 아래 '소스 파일'에 실제로 있는 글자를 그대로 복사한다. 줄 번호·말줄임(...)·요약 금지. 너무 길게 잡지 말고 바꿀 곳 주변 3~15줄.
- 지우기만 할 때는 `=======` 아래를 비운다.
- 블록 밖에는 사용자에게 하는 설명을 한국어로 짧게(무엇이 바뀌는지, 무엇을 확인해야 하는지).
- 적용 도구가 문법 검사(node --check, python ast)를 하고 통과하면 커밋·푸시한다. 실패하면 아무것도 바뀌지 않으니, 사용자가 오류를 붙여 넣으면 고친 블록을 다시 준다.
- 코드를 다 받은 뒤에는(다음 대화) 파일이 바뀌어 있으므로, 이어서 고칠 때는 사용자가 새로 만든 자료를 올리거나 바뀐 부분을 알려 준다고 생각한다.
"""

FIRST_MSG = """첨부한 '파르티잔_전체자료.md'는 내 주식 앱 프로젝트 전체야. 맨 앞의 '답하는 형식'과 '작업 안내(GEMINI.md)'를 먼저 읽고, 앞으로 코드를 바꿀 때는 꼭 그 형식(<<<<<<< 파일: … ======= … >>>>>>>)으로만, 그리고 커밋 줄과 모든 블록을 text 코드 상자 하나 안에 넣어서 답해 줘. 나는 그 코드 상자의 복사 버튼으로 복사해서 적용할 거야. 안전 규칙(키·계좌번호 저장 금지, 실제 주문 금지, 결재제 유지)은 항상 지켜 줘.
읽었으면 프로젝트를 세 줄로 요약하고, 지금 상태에서 내가 무엇을 하면 좋을지 물어봐 줘.
"""


def read(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def main():
    # 코드 지도부터 최신으로
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "make_handoff.py")], check=True)
    os.makedirs(OUT, exist_ok=True)
    parts = [ANSWER_RULES, read("GEMINI.md"), read(os.path.join("docs", "STRATEGY.md")), read(os.path.join("docs", "CODE_MAP.md"))]
    src = ["# 소스 파일 (전체)", ""]
    for f in SOURCES:
        lang = "html" if f.endswith(".html") else "python"
        body = read(f)
        fence = "````" if "```" in body else "```"
        src += [f"## 파일: {f}", "", f"{fence}{lang}", body.rstrip("\n"), fence, ""]
    parts.append("\n".join(src))
    text = "\n\n---\n\n".join(parts)
    with open(os.path.join(OUT, "파르티잔_전체자료.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    with open(os.path.join(OUT, "첫_메시지.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(FIRST_MSG)
    kb = len(text.encode("utf-8")) // 1024
    print(f"만들었어요: {OUT}")
    print(f"  · 파르티잔_전체자료.md ({kb:,}KB) — Gemini 대화창에 이 파일을 올리세요")
    print("  · 첫_메시지.txt — 올릴 때 같이 붙여 넣을 첫 메시지")


if __name__ == "__main__":
    main()
