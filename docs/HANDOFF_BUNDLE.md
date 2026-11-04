# 파르티잔 인베스트먼트 — 작업 안내 (Gemini용)

이 파일은 이 폴더에서 일하는 AI(Gemini·Antigravity)가 처음에 읽는 안내서다. 작업 전에 끝까지 읽고, 아래 **지켜야 할 규칙**은 사용자가 따로 풀어 주지 않는 한 항상 지킨다.
더 자세한 자료: `docs/CODE_MAP.md`(함수·줄 번호 지도 — `python tools/make_handoff.py`로 다시 만듦), `docs/STRATEGY.md`(매매 전략과 검증 결과).

## 1. 무엇인가

한국 주식(코스피·코스닥)을 HTS처럼 보는 **개인용 웹 앱** + 나무증권(NH투자증권) PLUG OpenAPI **로컬 중계기**.

- 볼린저밴드 200일(BB200) 상단 돌파 전략을 일봉으로 백테스트·모의투자·실계좌(선택)로 운용
- 차트(분·일·주·월봉, 보조지표 17종, 그물망, 사용자 그림), 실시간 체결·호가(중계기 스트림)
- AI 비서(Claude 또는 Gemini — 키는 브라우저에만): 대화·음성, 화면 조작 명령, 조건 비교, 규칙 만들기, 리스크 브리핑
- **결재제 모의투자**: 신호 → 안건 → 리스크 점검표 + AI 리스크 브리핑(읽어야 결재 가능) → 사용자 승인·거절 → 실행 → 사후 평가
- 사용자: 한국어 사용자 1명(개발자 아님). 모든 화면 글자·답변은 **한국어, 짧고 쉽게**.

## 2. 파일

| 파일 | 역할 |
|---|---|
| `partisan_investment.html` | 앱 전체 (HTML+CSS+JS 한 파일, 약 6,500줄, 빌드 없음 · Tailwind CDN) |
| `krx_bb200_daily.html` | 옛 주소 → `partisan_investment.html` 로 넘기는 껍데기 (지우지 말 것) |
| `nh_bridge.py` | 실행기. 키를 입력받아 메모리에만 두고 `nh_bridge_core.py`를 자식 프로세스로 띄움. 본체 파일이 바뀌면 문법 확인 후 **자동 재시작** |
| `nh_bridge_core.py` | 중계기 본체 (HTTP 서버, 기본 127.0.0.1:8766). 시세·실시간·뉴스·AI 프록시·동기화·실계좌 주문 |
| `krx_state.json` | 동기화 파일(설정·관심·모의 계좌·결재·일지·차트 설정). **git 제외 · 사용자 데이터 — 함부로 고치지 말 것** |
| `~/Documents/KRX_백업/` | 중계기가 하루 한 번 `krx_state` 백업 (60일 보관) |
| `research/` | 실제 일봉으로 전략 가설을 검증한 파이썬 스크립트 (데이터는 git 제외) |
| `tools/` | `make_handoff.py`(문서 다시 만들기), `install_hooks.py`(버전 자동 올림 훅 설치) |
| `bitget_*`, `bb200-pro/` | 예전 별도 프로젝트 (비트겟 코인). 이 앱과 무관 — 요청 없으면 건드리지 않음 |
| `*.backup-*` | 예전 수동 백업 (git 제외). 무시 |

## 3. 실행·시험

```bash
python nh_bridge.py --demo            # 가짜 시세 (키 없이 시험) — krx_state.demo.json 을 따로 씀
python nh_bridge.py --ask             # 실제 시세 (앱키·시크릿을 사용자가 직접 입력)
python nh_bridge.py --ask --trade     # + 실계좌 주문 (계좌번호·서버·한도도 사용자가 입력)
```

- 윈도우는 `윈도우에서_실행.bat`, 맥은 `맥에서_실행.command`를 더블클릭하면 화면 서버(8792)·브라우저·중계기(`--ask`)가 한 번에 켜진다 (`.bat --demo` / `.bat --trade`도 됨). 창을 닫아도 계속 돌게 하려면 `윈도우_뒤에서_켜기.bat`, 끄기는 `윈도우_중계기_끄기.bat`.
- 화면은 `partisan_investment.html`을 브라우저로 연다. "새 버전" 알림 띠는 http로 열었을 때만 동작하므로 보통 `python -m http.server 8792 --bind 127.0.0.1`로 연다.
- 화면 → 중계기 연결: 연결 창에서 주소(`http://127.0.0.1:8766`)와 실행기가 보여 준 토큰.
- **사용자가 실제로 쓰는 중계기(8766)는 끄거나 재시작하지 말 것.** 본체 파일만 고치면 실행기가 알아서 다시 띄운다(문법 오류면 기존 본체 유지).
- AI가 시험할 때: 다른 포트로 데모 중계기를 띄운다 → `BRIDGE_PORT=8767 BRIDGE_TOKEN=아무값 python nh_bridge.py --demo`. 시험이 끝나면 끈다.
- 시험은 별도 출처(예: `http://127.0.0.1:8792`)의 브라우저 탭에서 하고, 시험으로 생긴 모의 거래·안건·대화·일지는 원래대로 되돌린다. 사용자의 설정·모의 계좌를 시험으로 덮어쓰지 않는다.
- 검사: JS는 `<script>` 안을 잘라 `node --check`, 파이썬은 `python -c "import ast; ast.parse(open('nh_bridge_core.py', encoding='utf-8').read())"`.

## 4. 지켜야 할 규칙 (안전)

1. **나무 앱키·시크릿·계좌번호**는 사용자만 실행기에 직접 입력한다. 파일·로그·git·동기화·백업 어디에도 저장하거나 출력하지 않는다. 대신 입력해 주지도 않는다.
2. **실계좌 주문**: 화면의 `realSubmit` 하나로만 나가고, 매번 확인 창에서 사용자가 직접 눌러야 한다(버튼 1.5초 지연). 1회·하루 한도와 비상 정지는 실행기·중계기가 정하고 지킨다 — 화면에서 바꿀 수 없게 유지.
3. **AI가 실제 주문을 넣지 않는다.** 시험은 데모 중계기·모의 계좌에서만.
4. AI 키(Claude·Gemini)는 브라우저(localStorage, '기억'을 켤 때만)에만. 중계기는 요청마다 받아서 쓰고 저장하지 않는다.
5. **종목 추천은 해도 된다** (사용자가 원함, 2026-10-28). 다만 ① 사용자의 전략·신호·화면 데이터에 근거하고 그 수치를 함께 보여 줄 것 ② 위험(틀릴 수 있는 이유, 매도선까지 예상 손실)을 같이 말할 것 ③ "반드시 오른다" 같은 보장·확정 표현은 쓰지 않을 것 ④ 데이터에 없는 정보(소문·지어낸 실적)로 추천하지 않을 것 ⑤ 최종 결정은 사용자 — 추천은 결재제를 건너뛰지 못한다. 앱 비서도 같은 기준(`nh_bridge_core.py`의 `ASK_COMMON`). 단, 리스크 브리핑(`ASK_PURPOSE["risk"]`)은 반대 의견 담당이라 추천하지 않는다. 비서는 추천을 말로만 하고, 주문 명령은 사용자가 종목·방향·수량을 직접 말했을 때만 만든다.
6. 비서가 만드는 **위젯**(sandbox iframe)은 실계좌 주문·매매 규칙 변경·차트 그리기를 할 수 없다. 비서·위젯은 **결재를 대신할 수 없다**.
7. 결재제: 결재제가 켜져 있으면 모의 자동매매는 매수·매도 모두 사용자 결재 없이 실행하지 않는다. 리스크 브리핑 '읽음' 체크와 결정 이유 없이는 결재 버튼이 켜지지 않는다.
8. 백업·내보내기·동기화 파일에 키·토큰·계좌번호를 넣지 않는다.
9. GitHub 저장소(`mtyun91/krx-bb200`)는 **비공개 유지**. 커밋 작성자 이메일은 GitHub noreply.
10. 화면·음성에 프로그램 용어(JSON, 명령 글자, 함수명)가 보이거나 읽히지 않게 한다.

## 5. 일하는 방식

- **작업을 마칠 때마다 커밋하고 `git push`** (브랜치 main). 커밋 메시지는 한국어로 무엇이 바뀌었는지.
- 화면 버전(`const APP_VERSION = '1.N', APP_DATE = '...'`)은 **pre-commit 훅이 자동으로** 올린다 — 손으로 고치지 말 것. 새 컴퓨터면 `python tools/install_hooks.py`.
- 화면 글자·버튼·안내는 한국어로 짧게. 사용자에게 보고할 때도 한국어, 전문 용어는 풀어서.
- 사용자가 "제안해 줘"라고 하면 먼저 설계를 보여 주고 확인을 받은 뒤 만든다. 전략을 바꾸는 큰 변경은 데이터로 먼저 확인하고(research/ 참고), 앱에는 설정 옵션(기본값은 지금과 같게) + 비교 버튼으로 넣어 사용자가 백테스트로 비교하게 한다.
- 새 설정값은 `DEFAULTS`와 `SETTING_DEFS`에 같이 넣는다(타입이 맞아야 동기화됨). 비서가 바꿀 수 있게 하려면 `nh_bridge_core.py`의 `CHAT_ACTIONS` 안내에도 키를 적는다.
- 백테스트·모의투자·차트 표시·알림은 **같은 신호 함수**(`isBreakout` → `rawSignal` → `baseBreakout`/`isSqueeze`/`isLongCandle`/`waitFrom`/`reBreakFrom`)를 쓴다. 한 곳만 고치지 말 것.
- 동기화되는 상태: `syncPayload()` · `applySynced()` · `saveStore()` 세 곳에 함께 추가.
- 코드 스타일: 주변 코드처럼 짧은 화살표 함수, 한국어 주석 한 줄, 새 기능은 `// ---- 기능 이름: 설명 ----` 머리 주석으로 묶음.
- 화면이 1초마다 다시 그려지는 칸(모의투자 탭 등)에 입력칸을 넣을 때는 입력 중인 값이 지워지지 않게(내용이 바뀔 때만 다시 그리기 — `renderAgenda` 참고).

## 5-1. Gemini 대화창(웹·앱)으로 작업할 때

사용자는 Gemini 대화창에서 바로 작업한다 (파일을 직접 고치는 도구 없음).
1. `제미나이_자료_만들기.bat` → `gemini_pack/파르티잔_전체자료.md`(안내 + 답 형식 + 전략 + 코드 지도 + 소스 전체)와 `첫_메시지.txt`가 생김 → 대화창에 올림.
2. Gemini는 코드를 바꿀 때 `<<<<<<< 파일: 이름` / 지금 코드 / `=======` / 바꿀 코드 / `>>>>>>>` 블록과 `커밋: 한 줄` 로만 답한다.
3. 사용자가 답 전체를 복사하고 `제미나이_답_적용.bat` 실행 → 모든 블록이 정확히 한 곳에 맞고 문법 검사(node·python)를 통과할 때만 적용·커밋·푸시. 아니면 아무것도 안 바꾸고 Gemini에게 붙여 넣을 오류 설명을 보여 줌(`gemini_pack/적용_결과.txt`).
4. 고칠 수 있는 파일은 `partisan_investment.html`, `nh_bridge_core.py`, `nh_bridge.py`뿐. 큰 변경 뒤에는 자료를 다시 만들어 새 대화에 올리는 게 정확하다.

## 6. 지금 상태 (2026-10-28 기준, v1.17)

- 전략 기본값(2026-10-29 개편): 저가권(3년 범위 아래 절반) 200일 스퀴즈 돌파(1차 50%·2차 50%), 돌파봉 저가 손절, 종가 10일선 이탈 매도, 복리 배분(평가자산 ÷ 최대 5종목), 결재제 켜짐, 일봉 3000개 저장.
- 옵션(기본 꺼짐): 200일 스퀴즈 돌파만, 장대양봉 대기(눌림 반등·전고점 돌파 때 매수), 5일선 2일 확인 매수. 백테스트 탭 '내 매매 규칙' 칸의 비교 버튼으로 나란히 비교.
- 아직 실제로 확인 못 한 것: 장중 15:00~15:20 결재→체결 흐름, 실제 AI 리스크 브리핑, 나무 모의서버 주문 시험(`--ask --trade`로 모의서버 선택 후 사용자와 함께).
- 사용자 요청 이력과 전략 검증 수치는 `docs/STRATEGY.md`.

### 2026-11-04 편의·안정성 업데이트 (Claude Code)
- **휴장일**: `KRX_HOLIDAYS`(2026~2027) + 설정 `holidays`(직접 더하기). `marketOpenNow`·`lastFinalClose`가 휴장일을 건너뜀. 해마다 목록 확인 필요.
- **중계기 연결 감시**(`connWatch`, 20초): 두 번 연속 응답이 없으면 '연결 끊김'으로 표시, 다시 켜지면 저절로 재연결. `bridge()`에 응답 시간 한도(`bridgeTimeout` — 기본 90초, AI 180초, `/trade/`는 한도 없음).
- **설정 탭**: 찾기 칸, '바꾼 것만' 보기, 기본값과 다른 항목 ● 표시, 적용하면 바뀐 항목을 알려 줌. '기본값' 버튼은 입력칸만 채우고 '적용'을 눌러야 바뀜(예전에는 누르자마자 전략 값이 바뀌던 버그).
- **단축키**(`?`로 안내): `/` 검색 · `1~4` 탭 · `[ ]` 패널 · `S` 관심 · `D W M` 주기 · `+ −` 확대 · `End` 최신 · `R` 리서치 센터.
- **엑셀로 저장**(CSV): 백테스트 거래 목록, 매매 일지.
- 알림 글(`toast`)이 겹치지 않게 쌓임(최대 4개, 같은 글은 하나로, 눌러서 닫기).
- `docs/CODE_MAP.md`는 다시 만들었음 (`python tools/make_handoff.py`).

### 2026-11-04 전략 2판 (Claude Code, 사용자 요청 "전부 바꾸고 성공률을 높여 줘")
- **위 6장 첫 줄의 전략 기본값은 2판으로 바뀜**: 한 번에 100% 매수 · 매집 경로 켬 · 시장 체력(200일선 위 종목 비율) 40% 이상 `brOn`·`brMin` · 시가총액 2천억 이상 `sigCap` · 매집 확인(OBV 120일 신고가) `obvNeed` · 매도 20일선 · 평단 +10% 절반 익절 뒤 본전 손절 `tpPct` · 전체 시장(`universe 'ALL'`, `mktBars` 760). 검증 수치는 `docs/STRATEGY.md` 맨 위.
- 예전 판으로 저장된 설정은 화면을 열 때 한 번 옮기고 알림(`applySynced`의 `stratV` < 2). 사용자가 설정 탭에서 다시 바꿀 수 있음.
- 새 함수: `breadthAt`(시장 체력, 받아 둔 일봉으로 계산·캐시), `tpTarget`·`seqSellHalf`·`paperSellHalf`(절반 익절), `stratText`(AI에 넘기는 전략 한 줄). `structWhy`에 시장 체력·시총·OBV 확인. 손절선 `stopPrice`는 익절 뒤 본전(`seq.beStop`).
- 절반 익절은 백테스트·완전 자동은 장중 고가로, 매매 시간대(결재제)에서는 현재가가 목표 위일 때 '절반 익절' 결재 안건(`agenda.half`)으로 처리. 실제 계좌에서는 지정가를 미리 거는 것이 검증과 같음 — 점검표·운용 현황에 안내.
- 돌파 직전 선취매는 검증에서 나빠(PF 0.87) 넣지 않음. 전체 시장 첫 일봉 받기는 오래 걸릴 수 있음(매매 시간대 밖에서만 받음).
- 맥: `맥에서_실행.command`가 이미 켜진 화면 서버를 다시 쓰고 `--demo`·`--trade`를 넘기며 `caffeinate`로 잠들지 않게 함. 여행용 안내는 `맥북_사용_안내.md`.
- 중계기 AI 설명(`ASK_PURPOSE.stock`, `CHAT_ACTIONS`)에 새 설정 키 추가 — 중계기를 다시 켜야 반영.

### 2026-11-05 전략 3판 (Claude Code, "조금 더 확률을 높여 줘")
- `structWhy`에 강한 마감 `closeTop`(기본 80 — 종가가 봉의 위쪽 80% 안)과 OBV 신고가 기간 `obvDays`(기본 250, 예전 120 고정) 추가. `stratV` 3 — 2판 이하 설정은 화면을 열 때 한 번 옮김.
- 검증: `research/v3_report.py`(조건 하나씩, 앞·뒤 기간 모두 나아지면 ★) · `v3_combo.py`. 승률 48% → 53%, PF 1.52 → 1.73. 수치는 `docs/STRATEGY.md` 맨 위.
- 최대 보유는 사용자 결정으로 5종목 유지.

### 2026-11-05 뒤에서 켜기 · 밖에서 접속 (Claude Code)
- `nh_bridge.py --background`: 키를 입력받은 뒤 창 없는 프로세스(pythonw, DETACHED)로 자기 자신을 다시 띄우고 끝남. 키는 그 프로세스의 환경변수(메모리)에만 — 저장하지 않는 규칙 그대로. 기록 `logs/bridge.log`(git 제외, 5MB 넘으면 .old), 프로세스 번호 `logs/bridge.pid`. 뒤에서 돌 때(`NH_BG`)는 토큰을 끝 4자리만 출력.
- `윈도우_뒤에서_켜기.bat`(화면 서버도 창 없이) · `윈도우_중계기_끄기.bat`(pid 묶음 + 8766·8792 포트 주인 종료). PC를 다시 켜면 키를 다시 넣어야 함 — 자동 시작은 키 저장이 필요해서 하지 않음(사용자 결정 사항).
- `origin_allowed`가 `https://기기.tailnet.ts.net(:포트)` 도 허용 — Tailscale `serve`로 집 PC의 8792·8766을 내 기기에만 HTTPS로 엶. 안내는 `맥북_사용_안내.md` A.


---

# 매매 전략과 검증 결과

## 2026-11-05 대응 중심 개선

새 선택 옵션·오류 수정·검증 범위는 [대응 중심 개선 안내](RESPONSE_UPGRADE.md)를 참조한다. 아래 기존 성과 표는 과거 전략 결과이며 이번 변경의 성과가 아니다. 새 분봉 필터는 일봉 백테스트에 포함되지 않는다.


## 전략 3판 (2026-11-05) — 지금 기본값

2판에 **강한 마감**(`closeTop` 80: 돌파한 날 종가가 그날 봉 저가~고가의 위쪽 80% 안, 윗꼬리 짧게)과 **1년 매집**(`obvDays` 250: OBV 250일 신고가)을 더함. research/v3_report.py에서 23가지 조건을 하나씩 더해 **앞(2020까지)·뒤(2021부터) 기간 모두 PF와 승률이 나아진 것은 이 둘뿐**이었음.

| 신호 (매도: 평단 +10% 절반·본전·20일선) | 거래 | 주당 신호 | 승률 | 거래당 | PF (앞 / 뒤) |
|---|---|---|---|---|---|
| 2판 | 1,270 | 2.4 | 48.0% | +2.05% | 1.52 (1.38/1.56) |
| + 강한 마감 | 768 | 1.5 | 50.9% | +2.34% | 1.61 (1.50/1.64) |
| + OBV 250일 신고가 | 1,152 | 2.2 | 49.8% | +2.41% | 1.61 (1.43/1.68) |
| **+ 둘 다 (3판)** | 694 | 1.3 | **53.0%** | +2.77% | **1.73** (1.58/1.78) |
| 3판 · +8% 절반 익절 | 694 | 1.3 | 56.2% | +2.50% | 1.73 (1.66/1.75) |
| 3판 · 익절 없이 20일선 | 694 | 1.3 | 39.0% | +4.65% | 1.95 (1.57/2.09) |

- 나빴던 것: 당일 상승 15% 이하만(PF 1.38), 손절폭 8% 이내만(1.19), 거래량 3배 이하만(1.34), 20일 변동성 낮은 것만(1.42) — 조용한 돌파가 오히려 나쁨. 시장 체력 60% 미만만은 뒤 기간만 좋아(1.14/2.03) 넣지 않음.
- 포트폴리오(5종목): 연 약 +17.6%, 최대낙폭 약 −21% (2판 +16.3% / −16.3%) — 거래당 승률은 오르지만 거래가 줄어 계좌 기준 이득은 작음. 실제 매수 주 0.6건.
- 약한 해(2019·2022·2024)는 신호가 5~15건으로 적고 손실. 61%의 주는 신호 0개.

## 전략 2판 (2026-11-04)

**바꾼 것**: 한 번에 100% 매수(2차 눌림 매수 없앰) · 매집 경로 켬 · **시장 체력 40% 이상**(`brOn`·`brMin`) · **시가총액 2천억 이상**(`sigCap`) · **매집 확인 OBV 120일 신고가**(`obvNeed`) · 매도 **20일선** · **평단 +10% 절반 익절 뒤 본전 손절**(`tpPct`) · 보는 종목 전체 시장(`universe: 'ALL'`, 지수 밖 종목 일봉 `mktBars` 760). 예전 설정은 화면을 열 때 한 번 옮김(`stratV`).

검증: research/v2_scan.py · v2_report.py · v2_combo.py · v2_port.py — 2,476종목 일봉 2014~2026, 거래대금 30억 이상, 비용 포함. 시장 체력 = 그날 200일선 위 종목 비율(자료 전체 종목). 앱은 받아 둔 일봉(지수 구성종목·전체 시장)으로 같은 비율을 계산.

| 조건 (지금 규칙 + 매집 경로가 기본) | 거래 | 주당 신호 | 승률 | 거래당 | PF (2020까지 / 2021부터) |
|---|---|---|---|---|---|
| 1판 규칙 · 10일선 | 2,594 | 5.0 | 33.2% | +0.91% | 1.24 (1.21/1.25) |
| 기본 + 체력40 + 시총2천억 + OBV · 10일선 | 1,270 | 2.4 | 36.0% | +2.01% | 1.52 (1.23/1.62) |
| 같은 신호 · 20일선 | 1,270 | 2.4 | 35.0% | +3.57% | **1.73** (1.45/1.82) |
| **같은 신호 · 절반 +10% 익절·본전·20일선 (2판)** | 1,270 | 2.4 | **48.0%** | +2.05% | 1.52 (1.38/1.56) |

- 시장 체력 구간별(20일선): 30% 미만 PF 1.01 · 30~40% 0.96 · **40~50% 1.74 · 50~60% 1.79** · 60% 이상 1.50 → 약한 시장의 돌파는 본전.
- **돌파 직전 선취매(상단 아래 5% · 수축 · OBV 신고가 · CMF≥0.1)는 나쁨**: 645건 PF 0.87, 20일 안에 실제 돌파는 61%뿐 → 사지 않고 '돌파 대기' 목록·알림으로만 씀.
- 신호는 몰려서 나옴: 위 2판 조건도 **58%의 주는 신호 0개**, 39%의 주에 2개 이상. 약한 해(2017~2019, 2022, 2024)는 신호가 적거나 나빴음.
- 포트폴리오(최대 5종목, 복리, 같은 날 거래대금 순): 2판 조건 + 절반 익절·20일선 → 연 약 +16%, 최대낙폭 약 −16% (보유분을 원가로 평가한 단순 계산이라 실제 낙폭은 더 큼). 1판 규칙 · 10일선은 같은 계산에서 연 −3.5%, 낙폭 −77%. 실제 매수는 주 0.7건쯤 — 자리가 차면 신호를 건너뜀.
- 한계: 지금 상장된 종목만(상장폐지 종목 빠짐 → 성과가 좋게 나옴), 시가총액은 지금 주식 수 × 그날 종가, 절반 익절은 장중 고가가 닿으면 목표가에 체결된다고 가정(실제로는 지정가를 걸어야 같음).

## 핵심 개념 (2026-10-29 개편)

**저가권에서 큰 하락 → 오랜 횡보 → 200일 볼린저밴드가 최대로 좁아진 뒤 상단 돌파를 사고, 산 뒤의 운용(손절·추가 매수·매도선)으로 대응한다.** 고가권 돌파는 이 매매가 아니다.

## 기본 전략 (BB200 일봉)

- **진입 (기본 `entryMode: 'SQ'`)**: 종가가 볼린저밴드(200일, 2σ) 상단을 처음 넘은 양봉(`baseBreakout`) 중 200일 스퀴즈(`isSqueeze`) + **저가권**(돌파 가격이 3년 가격 범위의 아래 `sqZone`=33% 안). 선택: 거래량·ADX·사용자 매수 규칙(`rE`), 장대양봉 대기, 5일선 2일 확인.
- **분할**: 1차 w1% · 2차 w2%(눌림 뒤 반등) · 3차 w3%(전고점 돌파). 사용자 현재값 50/50/0.
- **운용·청산**: 손절선 `stopMode`(기본 'BREAK' = 종가가 돌파봉 저가 아래, 'BOX' = 60일 박스 저가, 'NONE') + 매수 다음 날부터 종가가 N일선(기본 10일선) 아래면 매도 (`exitOrStop`). 선택: 사용자 매도 규칙(`rX`). 모의투자 탭 '운용 현황'에 종목별 단계·손절선·매도선·다음 할 일.
- **자금**: 복리 배분 — 새로 살 때마다 그 시점 평가자산 ÷ 최대 보유 종목(기본 5).
- **실행 시각**: 15:00~15:20(종가 동시호가 전). 14:50부터 상단 근접 종목 시세를 받아 두고, 시간대 안에서 2분 이상 지켜본 평균가 이하로 눌릴 때 매수 / 매도는 평균가 이상 반등 때, 끝나기 1분 전이면 그때. 매수한 날은 팔지 않음.
- **비용**(백테스트): 매수 0.01% + 매도 0.01% + 거래세 0.20% + 체결 손실 0.05%×2, 종가 체결.

## 선택 옵션 (설정 탭 '진입 방식', 기본 꺼짐)

| 옵션 | 내용 | 함수 |
|---|---|---|
| `entryMode: 'SQ'` | 200일 스퀴즈 돌파만: 돌파 전날 밴드 폭이 최근 750일 중 하위 `sqPct`%(15) + 1년 저점 ≤ 2년 고점 × (1−`sqDrop`%)(30) + 120일 고저 폭 ≤ `sqRange`%(60) | `isSqueeze` |
| `lcWait` | 장대양봉(몸통 ≥ 20일 평균 변동폭×`lcAtr`(2) 또는 상승률 ≥ `lcChg`%(7), 몸통 비율 ≥ 60%) 돌파는 바로 사지 않고 ① 눌림 끝 첫 반등(몸통 절반 유지·장대양봉 종가 아래로 한 번 눌림·거래량 60% 미만·전날 고가 위 양봉, `lcDays`(15)일 안) 또는 ② 60일 안에 그 뒤 최고가(전고점)를 처음 넘는 양봉에 매수 | `waitFrom`, `reBreakFrom` |
| `ma5Confirm` | 신호 뒤 2일 연속 종가가 5일선 위면 둘째 날 매수 | `isBreakout` |

차트 표시: △ 매수 신호, ◆ 스퀴즈 돌파, □ 장대양봉 대기.

## 실제 데이터 검증 (research/, 2026-10-28)

자료: 코스피·코스닥 보통주 2,476종목 일봉 2014~2026 (FinanceDataReader). 그때 기준 60일 평균 거래대금 30억 이상, 종목당 한 번에 한 포지션, 비용 포함, 10일선 이탈 매도. 앱(코스피200·코스닥150 안, 거래대금 순, 자금 한도)과 조건이 달라 앱 백테스트 숫자와 직접 비교하지 말 것.

**돌파 유형별** (돌파 당일 종가 매수)

| 유형 | 거래 | 승률 | 거래당 평균 | PF |
|---|---|---|---|---|
| 모든 돌파 | 16,940 | 28.8% | −0.26% | 0.94 |
| 200일 스퀴즈 돌파 | 1,453 | 31.8% | **+0.59%** | **1.18** (2020년까지 1.16 / 2021년부터 1.18) |
| └ 그중 장대양봉 돌파 | 409 | | +1.24% | 1.28 |
| 밴드 중간 상태 돌파 | 5,160 | 28.4% | −0.48% | 0.89 |
| 밴드 벌어진 상태 재돌파 | 10,327 | 28.6% | −0.28% | 0.94 |

- 밴드 폭만 좁고 하락 흔적·횡보가 없으면 오히려 나쁨(120일 뒤 평균 −3.5%).
- 장대양봉 돌파는 20일 뒤 중앙값이 −4.8%(일반 −3.1%), 69%가 15일 안에 몸통 절반 반납, 그중 52%가 고가 재돌파(N자). 그러나 기다렸다 사는 방식(눌림 반등·고가 재돌파·건너뛰기)은 모두 지금보다 약간 나빴다(거래당 −0.34~−0.37%).
- 유형별 매도선(스퀴즈 20일·확장 5일)은 개선 없음.

**매수 시점** (매도 10일선)

| 매수 시점 | 모든 돌파 PF | 스퀴즈 PF | 스퀴즈 승률 |
|---|---|---|---|
| 돌파 당일 종가 | 0.94 | 1.18 | 31.8% |
| 5일선까지 눌린 뒤 종가 안착 | 0.88 | 0.90 | 27.5% |
| 장중 5일선 닿고 반등 | 0.70 | 0.71 | 25.3% |
| 다음 2일 연속 5일선 위 (= `ma5Confirm`) | 0.90 | 1.13 | 33.2% |

**저가권 · 운용 검증** (research/lowzone.py, 매도 10일선 기준)

| 조건 | 거래 | 승률 | 거래당 평균 | PF (2020까지 / 2021부터) |
|---|---|---|---|---|
| 모든 돌파 | 16,939 | 28.8% | −0.26% | 0.94 (1.00 / 0.91) |
| 스퀴즈 | 1,453 | 31.8% | +0.59% | 1.18 (1.16 / 1.18) |
| **스퀴즈 + 3년 범위 아래 1/3** | 323 | 34.4% | **+1.01%** | **1.30** (1.37 / 1.28) |
| 스퀴즈 + 2년 고점보다 30%↓ | 475 | 29.9% | +0.52% | 1.15 (1.07 / 1.18) |
| 모든 돌파 중 고가권(2년 고점 10% 안) | 5,834 | 32.7% | +0.98% | 1.24 — 고가권 돌파도 평균은 나쁘지 않음 |

**신호 늘리기 검증** (research/followup.py · followup_tightstop.py, 매도 10일선 + 손절) — 2026-10-29 기본값을 저가권 50%(아래 절반)로 완화

| 조건 | 거래 | PF (2020까지 / 2021부터) |
|---|---|---|
| 스퀴즈 15% · 아래 1/3 · 첫 봉 | 335 | 1.26 (1.39 / 1.22) |
| **스퀴즈 15% · 아래 절반 · 첫 봉 (기본)** | 689 | 1.16 (1.43 / 1.09) |
| 폭 25% · 아래 절반 · 첫 봉 | 923 | 1.09 |
| + 스퀴즈 돌파 뒤 20일 안 전고점 돌파 매수 (`sqFollow`, 기본 꺼짐) | 727 | 1.06 — 전고점 매수분만 PF 0.92~0.97 (손절을 그날 저가로 좁혀도 0.97) |

**매집 경로 검증** (research/accum.py, 2,476종목 200일 상단 돌파 22,269건, 매도 10일선 + 돌파봉 저가 손절) — 2026-10-31 `accOn` 옵션(기본 꺼짐)으로 추가

매집 = OBV(누적 거래량) 120일 신고가 + 120일 가격 변화 15% 안 + CMF(20) ≥ 0.1. 하락 흔적 없이 좁게 쌓는 종목(예: KT&G 2022-09-22)을 잡기 위함.

| 조건 | 거래 | PF |
|---|---|---|
| 모든 돌파 | 22,269 | 0.91 |
| OBV 120일 신고가만 | 11,022 | 0.92 — 혼자서는 효과 없음 |
| 매집 | 658 | 1.20 |
| 지금 스퀴즈(폭 15·하락 30·횡보 60) | 2,371 | 0.96 |
| 스퀴즈 + 매집 | 254 | 1.40 |
| **폭 25% + 120일 횡보 + 매집 (하락 조건 없음 = 매집 경로)** | 360 | **1.31** |

이 표는 돌파봉 저가 손절을 넣어 위 표와 수치 기준이 다르다 — 같은 표 안에서만 비교. 건수가 적어 모의투자로 확인 필요.

**돌파 모양 검증** (research/dev3.py · dev3_report.py · dev3_combo.py, 200일 상단 돌파 22,269건, 매도 10일선 + 돌파봉 저가 손절, 시가총액 = 그날 종가 × 지금 상장주식수) — 2026-11-01

1. 돌파 뒤 '매수 대기' → 5일선 지지 때 매수: **적용 안 함** — 모든 묶음에서 나빠짐. 스퀴즈: 돌파 종가 PF 0.84 → 5일선 지지 종가 0.64 · 장중 5일선 지정가 0.74. 장대양봉(7%+) 돌파만 봐도 0.66 → 0.48 / 0.62. 5일선까지 눌린 돌파는 그대로 손절까지 밀리는 경우가 많음.
2. 중심선 아래에서 짧게 상단까지 뚫은 돌파 빼기 (`midSettleDays`, 기본 5): 돌파 전 5일 안에 종가가 중심선 아래였으면 제외.

| 묶음 | 그대로 | 5일 안 중심선 아래 제외 | 그 제외된 돌파 |
|---|---|---|---|
| 모든 돌파 | 0.91 | 0.96 (2020까지 0.99 / 2021부터 0.94) | 0.58 |
| 수축(폭 25·횡보 60) | 0.93 | 0.96 | 0.82 |
| 지금 스퀴즈 | 0.84 | 0.92 (0.95 / 0.91) | 0.68 |

3. 시가총액 × 전고점(직전 120일 안에 상단을 찔렀다가 음봉으로 밀린 봉): 대형주(2조+)는 전고점 없이도 PF 1.19(스퀴즈 1.27), 소형주(5천억 미만)는 전고점이 없으면 0.64(스퀴즈 0.53, 두 기간 모두 나쁨) → 소형주는 전고점이 있어야 매수 (`smallPH`, `smallCap` 5000억). 소형주 스퀴즈에서 '전고점을 뚫음'은 0.41로 오히려 나빠 — 조건은 '전고점이 있을 것'까지만.

| 묶음 | 그대로 | 소형주 전고점 없음 제외 | 2 + 3 같이 (남는 비율) |
|---|---|---|---|
| 모든 돌파 | 0.91 | 0.95 | 0.97 (88%) |
| 수축 | 0.93 | 1.01 | 1.01 (75%) |
| 지금 스퀴즈 | 0.84 | 0.99 (1.19 / 0.95) | **1.02** (1.10 / 1.00, 68%) |

**전고점 돌파 경로** (`phOn`, 기본 켬 — 2026-11-01, 계기: 피에스케이홀딩스 2026-01-16 돌파가 스퀴즈 조건(폭 19.5%·120일 고저폭 92%·3년 위치 65%)에 걸려 신호 없음)

시가총액 `phCap`(5000억) 이상이면 스퀴즈가 아니어도, 직전 `phDays`(120)일 안에 상단을 찌르고 음봉으로 밀린 봉이 있고 그 뒤 최고가(전고점)를 상단 돌파 종가가 넘으면 매수. 중심선 안착 5일 + 소형주 전고점 조건을 켠 상태의 검증:

| 조건 | 거래 | PF (2020까지 / 2021부터) |
|---|---|---|
| 지금 스퀴즈 | 862 | 1.02 (1.10 / 1.00) |
| 스퀴즈 기준 풀기(폭 25·횡보 100·저가권 끔) | 3,569 | 0.99 — 풀면 나빠짐 |
| 전고점 뚫은 상단 돌파 (전체) | 3,212 | 1.16 (1.11 / 1.17) |
| **전고점 뚫음 + 시가총액 5천억 이상** | 1,811 | **1.33** (1.22 / 1.37) |
| 스퀴즈 또는 위 경로 | 2,596 | 1.24 (1.20 / 1.25) |

운용(스퀴즈): 5일선 PF 1.04 · **10일선 1.18** · 20일선 1.12 · 돌파봉 저가 손절+10일선 1.17 · 절반 익절 20%+20일선 1.15 → 매도선은 10일선, 손절은 성과를 크게 바꾸지 않지만 최대 손실을 정해 줌.

## 사용자의 매매 생각 (요청 이력 요약)

- 장기 추세 신호 = 200일 밴드가 하락 뒤 횡보하며 최대로 좁아진 상태에서 상단 돌파(몇 년 매집의 흔적). 다만 절대적이지 않다.
- 장대양봉 돌파는 바로 따라가지 말고 눌림·안정 뒤 매수(N자). 대기 뒤 그 고점을 강하게 넘는 봉에서는 산다.
- 돌파 뒤 5일선 안착이 중요하다고 본다(옵션으로 넣고 비교 중).
- 중심선에 안착하고 밴드가 수축된 상태에서 상단을 뚫는 모양을 선호. 중심선 밑에서 짧게 뚫는 돌파는 피함 → `midSettleDays`.
- 우량주는 전고점 없이도 추세로 오르지만 중소형주는 전고점이 있어야 뚫고 오른다고 봄 → 소형주만 `smallPH` (중형주는 데이터상 차이가 작음).
- 상단을 찌르고 음봉으로 밀린 전고점을 뚫는 돌파는 스퀴즈가 아니어도 산다(시가총액 큰 종목) → `phOn`.
- 돌파 뒤 5일선 지지 때 사는 방식도 생각함 — 검증에서 나빠 넣지 않음.
- 큰 하락이 없어도 가격은 제자리인데 거래량이 쌓이면(매집) 돌파할 힘이 있다고 본다 → 매집 경로(`accOn`)·CMF 보조지표·차트 매집 표시.
- 수익률 글자: 이익 빨강, 손실 파랑(한국식).
- 계좌는 포트폴리오 복리 운용. 최종 매수·매도 결정은 항상 본인(결재제).


---

# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 8,104줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.40 · 2026-11-05 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**366** · 1. 설정 · 상태
- `tfInfo` 491
- `applySynced` 526
- `loadStore` 557
- `loadToken` 574
- `saveToken` 575
- `saveStore` 576
- `bgRun` 589
- `bgWorker` 590
- `bgEvery` 591

**594** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 596
- `hmToMin` 607

**608** · ---- 휴장일: 한국거래소 공휴일·연말 휴장 (2026~2027) + 설정 '휴장일 더하기' — 휴장일에는 장중 판단·시세 재조회를 하지 않음
- `userHolidays` 611
- `isHoliday` 612
- `isTradingDay` 613
- `marketOpenNow` 614
- `tickSize` 619
- `tickFloor` 628
- `tickCeil` 629
- `won` 630
- `pct` 631
- `fmtDate` 632
- `nameOf` 633
- `esc` 634
- `toast` 636

**651** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridgeTimeout` 655
- `bridge` 656
- `db` 676
- `cacheGet` 687
- `cachePut` 693
- `cacheAllDaily` 700
- `modeKey` 717
- `lastFinalClose` 720
- `isStale` 732
- `weekdaysSince` 738
- `fetchDaily` 748
- `isCore` 778
- `applyDaily` 782
- `bucketOf` 789
- `aggregateDaily` 795
- `chartWant` 809
- `fetchChart` 810

**839** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 841
- `priceBroken` 878

**883** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 885
- `loadCaps` 886
- `codeOfBars` 894
- `capOf` 900
- `breadthAt` 904
- `bbCross` 930
- `structWhy` 943
- `baseBreakout` 960
- `widthLow` 967
- `isAccum` 975
- `accSqueeze` 983
- `squeezeCore` 993
- `sqKey` 1017
- `isSqueeze` 1019
- `squeezeSetup` 1027
- `isLongCandle` 1035
- `waitOk` 1046
- `phInfo` 1055
- `waitBase` 1067
- `waitFrom` 1068
- `above5` 1080
- `coreBreakout` 1081

**1085** · ---- 일봉 후보와 매수 가격 분리: 돌파 당일 또는 다음 며칠의 5일선 지지
- `pullbackSignal` 1086
- `isBreakout` 1097
- `reBreakFrom` 1104
- `sqFollowFrom` 1121
- `rawSignal` 1135
- `entryLabel` 1144
- `rawLabel` 1150

**1157** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1162
- `stratText` 1164
- `costBuy` 1168
- `costSell` 1169
- `newSeq` 1171

**1183** · ---- 계획 손실: 구조적 손절선까지 비용 포함 손실로 수량 제한 (갭·체결 지연은 별도)
- `plannedRisk` 1184
- `entryRiskBudget` 1188
- `seqBuy` 1198
- `tpTarget` 1218
- `seqSellHalf` 1219
- `seqSellAll` 1230
- `maN` 1239
- `stepSeq` 1245
- `seqResult` 1282
- `rankScore` 1290

**1296** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1298

**1383** · 7. 종목 목록
- `marketCodes` 1386
- `screenPass` 1393
- `universeCodes` 1402
- `rowInfo` 1414
- `renderSymbols` 1430
- `renderScrBar` 1471

**1480** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1485
- `chartBars` 1488
- `setChart` 1494
- `loadChart` 1502
- `chartGeom` 1554
- `axisTag` 1563
- `drawChart` 1572
- `drawChartNow` 1577
- `renderTfBar` 1769
- `updateBarCount` 1774
- `renderChartHeader` 1778
- `selectCode` 1799
- `setTf` 1812
- `rightPad` 1820
- `setViewEnd` 1821
- `curEnd` 1831
- `stopGlide` 1832
- `zoom` 1898
- `pan` 1909

**1918** · 9. 백테스트 패널
- `recomputeAll` 1920
- `runBt` 1926
- `renderBt` 1933
- `drawEquity` 1966

**1989** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1991
- `plog` 1995
- `lastPrice` 2000

**2007** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 2011
- `sessionDate` 2020
- `buyRate` 2027
- `sellRate` 2028
- `manualValue` 2029
- `reservedCash` 2030
- `reservedQty` 2031
- `strategyReserve` 2033
- `buyingPower` 2034
- `sellable` 2035
- `liveQuote` 2037
- `fillBuy` 2044
- `fillSell` 2061
- `submitOrder` 2084
- `cancelOrder` 2120
- `matchOrders` 2128
- `expireOrders` 2144
- `orderWatchTick` 2153

**2167** · ---- 주문창
- `ticketSync` 2170
- `renderTicket` 2180
- `ticketPct` 2206
- `stepPrice` 2214
- `withTodayBar` 2223
- `refreshQuotes` 2234
- `paperSellHalf` 2249
- `paperExit` 2260
- `paperDecide` 2274
- `renderPaper` 2363
- `scheduler` 2425

**2449** · 11. 설정 패널

**2451** · ---- 설정 찾기 · 바뀐 값 표시: 위 검색칸에 낱말을 넣으면 그 항목만, '바꾼 것만'을 켜면 기본값과 다른 항목만 보임 (● = 기본값과 다름)
- `sameVal` 2453
- `renderSettings` 2455
- `readSettings` 2494
- `setLabelOf` 2508

**2527** · 12. 이벤트 · 초기화
- `setTab` 2529
- `applyPanes` 2539
- `bindResizer` 2551
- `openHolding` 2598
- `sellNow` 2606
- `renderHoldInfo` 2626
- `toggleWatch` 2682
- `setMaster` 2694
- `loadMaster` 2702
- `searchMatches` 2712
- `renderSearch` 2740
- `openFromSearch` 2748

**2764** · ---- 단축키 (? 로 안내): / 검색 · 1~4 오른쪽 탭 · [ ] 패널 · S 관심 · D W M 주기 · + − 확대 · End 최신 · R 리서치 센터
- `showKeys` 2766
- `popOpen` 2769
- `connectBridge` 2802

**2844** · ---- 중계기 연결 감시: 20초마다 확인 → 두 번 연속 응답이 없으면 '끊김'으로 표시하고, 다시 켜지면 저절로 이어 붙음
- `connWatch` 2846
- `loadSaved` 2875
- `syncData` 2893
- `liveTick` 2947

**2988** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2993
- `rtStop` 2999
- `rtLoop` 3004
- `rtWanted` 3032
- `rtSubscribe` 3040
- `rtMsg` 3053
- `applyTick` 3061
- `updateMinuteBar` 3094
- `renderRtBadge` 3108
- `prevClose` 3120
- `chgTag` 3126
- `renderBook` 3127

**3180** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 3185
- `sync` 3192
- `saveSync` 3199
- `syncPayload` 3202
- `hasActivity` 3205
- `syncHash` 3210
- `syncMark` 3217
- `applyRemote` 3224
- `syncPush` 3236
- `syncPull` 3258
- `renderSync` 3282

**3314** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3323
- `sgn` 3347
- `pctTxt` 3348
- `evidenceAt` 3351
- `computeResearch` 3406
- `refreshResearch` 3437
- `regimeChip` 3446
- `researchChart` 3451
- `renderResearch0` 3462
- `renderResearch` 3510

**3518** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3561
- `setSectors` 3568
- `loadSectors` 3573
- `sectorOf` 3581
- `scenarioCodes` 3643

**3645** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3646
- `aboveMa` 3652
- `median` 3660
- `avg` 3661
- `sectorStats` 3663

**3681** · ---- 뉴스
- `getNews` 3683
- `agoTxt` 3690
- `newsList` 3691

**3695** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3697
- `loadScenarioNews` 3707

**3717** · ---- 화면
- `chg` 3719
- `heat` 3720
- `stockLink` 3721
- `renderSectorTab` 3723
- `renderSectorDetail` 3745
- `renderScenarioTab` 3761
- `renderNewsTab` 3788
- `renderCenter` 3796
- `openCenter` 3810
- `runNews` 3819
- `fetchSector` 3827

**3883** · ---- 진입 대응표: 가격 위험·수급 근거·분봉 실행을 구분 (점수는 확률이 아님)
- `refreshExecutionMinutes` 3885
- `minuteEvidence` 3894
- `executionPlan` 3909
- `executionPlanHtml` 3931
- `executionGate` 3943

**3949** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3960
- `liveBar` 3973
- `winRange` 3979
- `winLog` 3982
- `winScan` 3987
- `winEvaluate` 4005
- `winStep` 4034
- `winFinish` 4113
- `windowTick` 4134
- `renderWindow` 4155
- `loadMoreBars` 4163

**4169** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 4175
- `briefFacts` 4193
- `loadAi` 4214
- `renderBriefTab` 4228

**4272** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 4276
- `saveAiCfg` 4282
- `aiReady` 4286
- `aiPayload` 4289
- `renderAiBox` 4292
- `modelKind` 4307
- `readAiBox` 4313

**4372** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 4377
- `pushFeed` 4378
- `aiAuto` 4383
- `askAi` 4384

**4390** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 4391
- `entryCtx` 4414

**4419** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4429
- `btTrades` 4459
- `myTrades` 4472
- `journal` 4475
- `statLine` 4482

**4492** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4493
- `showGuard` 4537
- `guardedSubmit` 4553

**4559** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4560
- `briefLines` 4587
- `assistOnSelect` 4600

**4617** · ---- 체결 직후 코멘트
- `assistOnTrade` 4618

**4633** · ---- 화면
- `renderAssistStrip` 4634
- `tableOf` 4641
- `renderAssist` 4653
- `foldOpen` 4684
- `fold` 4685
- `runAsk` 4719
- `calDays` 4738

**4744** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4749
- `marketRadarFacts` 4751
- `assistFacts` 4768
- `renderChat` 4787

**4801** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4802
- `grabActs` 4813
- `splitActions` 4828
- `plainSay` 4846
- `describeAct` 4850
- `findCode` 4872
- `confirmAct` 4881
- `runAction` 4896
- `settingAct` 5041
- `orderAct` 5065
- `runActions` 5079

**5089** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 5093
- `saveCustom` 5097
- `safeId` 5100
- `attr` 5101
- `splitBlocks` 5103
- `applyBlocks` 5111
- `applyCss` 5139
- `calcInd` 5152
- `drawCustomInd` 5161
- `jsonSafe` 5206
- `widgetData` 5207
- `renderWidgets` 5238
- `renderCustomBox` 5277
- `customFacts` 5299

**5307** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 5310
- `realConfirm` 5319
- `realSubmit` 5337
- `realCancel` 5368
- `realArm` 5374
- `realKill` 5384
- `renderReal` 5389
- `realFacts` 5425

**5431** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5434
- `setRangeMode` 5439
- `analyzeRange` 5447
- `similarSpots` 5481
- `startRange` 5506
- `endRange` 5513
- `openRangeCard` 5523
- `renderRangeCard` 5529
- `rangeFacts` 5552
- `saveMark` 5558
- `drawRanges` 5592
- `openMark` 5631
- `marksFacts` 5638
- `marksFold` 5643
- `verTxt` 5658
- `checkPageVersion` 5662

**5682** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5701
- `runRule` 5704
- `computeRules` 5714
- `dataSig` 5729
- `ruleTick` 5731
- `stopPrice` 5738
- `exitOrStop` 5743
- `exitSignal` 5758
- `btBrief` 5769
- `btDiff` 5770
- `selSignals` 5776
- `setRule` 5783
- `renderRules` 5793
- `rulesFacts` 5828
- `drawStrategyMarks` 5833

**5870** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5873
- `saveAlertCfg` 5874
- `alertSeen` 5875
- `alertOnce` 5876
- `raiseAlert` 5883
- `flushSay` 5893
- `showAlertCard` 5900
- `hm2min` 5912
- `alertTick` 5914
- `realFillCheck` 5953
- `renderAlertBtn` 5962

**5975** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5976
- `backtestWithRule` 5989
- `halfStats` 6006
- `setLabel` 6058
- `compareVariants` 6060
- `variantsFrom` 6091
- `runCompare` 6096
- `tableHtml` 6106

**6107** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 6124
- `markIndex` 6125
- `roundT` 6134
- `extractRule` 6135
- `runExtract` 6184
- `extractFacts` 6215

**6216** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 6218

**6228** · ---- 엑셀로 저장: 백테스트 거래 · 매매 일지 · 모의 매매 기록을 CSV로 (엑셀에서 한글이 깨지지 않게 BOM 포함)
- `downloadCsv` 6229
- `ymdDot` 6245
- `kstTime` 6246
- `exportBtCsv` 6247
- `exportJournalCsv` 6254
- `importRecords` 6259

**6280** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 6281

**6318** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 6320
- `drawAct` 6321
- `drawClearAct` 6340
- `drawUserDraw` 6347
- `drawLegend` 6375
- `drawFacts` 6380

**6382** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 6384
- `journalAdd` 6385
- `journalWhyAct` 6399
- `journalFold` 6407
- `journalFacts` 6435

**6447** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 6450
- `cl` 6461
- `indDef` 6524
- `indLabel` 6525
- `clone` 6528
- `normalizeLook` 6529
- `lookSubs` 6547
- `lookSeries` 6550
- `strokeSeries` 6558
- `fillBetween` 6565

**6575** · ---- 매물대: 가격대별 거래량 — 봉마다 거래량을 저가~고가에 고르게 나눠 칸에 쌓음 (양봉 거래량 · 음봉 거래량 따로)
- `vpBins` 6576
- `drawVP` 6591
- `vpFacts` 6615
- `drawLookOverlays` 6624
- `drawLookSubs` 6637
- `numShort` 6676
- `lookLegend` 6677
- `renderLookCard` 6685
- `lookChanged` 6705
- `openLook` 6710
- `lkSet` 6716
- `lookAct` 6747
- `lookFacts` 6790

**6792** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6795
- `agendaKey` 6796
- `agendaFind` 6797
- `equityNow` 6798
- `freeCash` 6799
- `planBuyQty` 6800
- `agendaChecks` 6809
- `agendaCreate` 6859
- `agendaBrief` 6874
- `agendaGate` 6889
- `agendaDone` 6897
- `winActiveFor` 6898
- `paperBuyNow` 6900
- `agendaExecNow` 6920
- `agendaDecide` 6946
- `agendaExpire` 6960
- `agendaOutcome` 6967
- `agendaHistLine` 6972
- `renderAgenda` 6977
- `agendaFacts` 7048

**7058** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 7059
- `applyExternalReply` 7069

**7100** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 7106
- `idxPct` 7107
- `loadMarketQuotes` 7108
- `renderIdxBar` 7115
- `renderIndexTab` 7126
- `renderIndexToolbar` 7135
- `idxEnter` 7144
- `idxExit` 7165
- `marketFacts` 7176

**7180** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 7183
- `invLevOf` 7184
- `invHeld` 7185
- `invDecision` 7187
- `invEvaluate` 7205
- `invExec` 7219
- `invBacktest` 7233
- `invBtLine` 7268
- `renderInv` 7270
- `invFacts` 7314
- `invChecks` 7327

**7346** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 7347
- `renderManage` 7360
- `manageFacts` 7378

**7382** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 7384
- `newsAgo` 7390
- `renderNewsTicker` 7391
- `topNewsFacts` 7411

**7414** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 7415

**7422** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 7425
- `waitCodes` 7441
- `renderWait` 7442
- `waitAlerts` 7455

**7461** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 7464

**7495** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 7498
- `savePhone` 7499
- `phoneNotify` 7501
- `renderPhone` 7509

**7541** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 7545
- `tgReply` 7550
- `agShort` 7554
- `agByShort` 7555
- `tgHandle` 7558
- `tgStart` 7629
- `savePin` 7637
- `chatSend` 7642
- `convoNext` 7668
- `convoToggle` 7674
- `voiceSel` 7690
- `stopSpeaking` 7692
- `speechChunks` 7699
- `pcmToWavBlob` 7706
- `audioBlob` 7714
- `speakText` 7719
- `browserSpeak` 7753
- `micToggle` 7767
- `silenceMs` 7776
- `endWait` 7781
- `startSR` 7789
- `startRecorder` 7840

**7912** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7920
- `mlpForward` 7925
- `aucOf` 7930
- `trainStyle` 7938
- `retrainStyle` 7997
- `predictWin` 8010
- `predictBin` 8017
- `styleProfile` 8024

**8033** · ---- 드래그 선호: 수익률과 분리해 진입·청산 때의 모양을 각각 비교
- `preferenceMatch` 8034
- `preferenceText` 8050
- `renderStyle` 8056

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `riskPct`, `totalRiskPct`, `sqOrdered`, `sqConverge`, `pullbackDays`, `entryRiskMax`, `minuteGate`, `exitConfirm`, `exitGrace`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `phOn`, `phCap`, `phDays`, `brOn`, `brMin`, `sigCap`, `obvNeed`, `obvDays`, `closeTop`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `tpPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`, `holidays`, `stratV`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `vp` 매물대(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `cmf` CMF(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 2,043줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/caps`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/market/index`, `/market/quotes`, `/news`, `/news/top`, `/notify/telegram`, `/notify/telegram_chat`, `/notify/tg_start`, `/notify/tg_stop`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

### AI 요청 종류 (`ASK_PURPOSE`)

`stock`, `trade`, `order`, `journal`, `risk`, `ask`, `chat`, `range`

비서 대화 규칙·명령 설명은 `CHAT_STYLE`, `CHAT_ACTIONS` 문자열.

### 함수·클래스 (줄 번호)

- `_load_token` 40
- `origin_allowed` 73
- `_throttle` 84
- `access_token` 93
- `token_invalidate` 117
- `nh_post` 131
- `_num` 156
- `_period_rows` 167
- `_bars` 181
- `nh_chart` 193
- `nh_daily` 203
- `nh_components` 221
- `_krx_finder` 251
- `krx_master` 260
- `krx_caps` 311
- `krx_sectors` 367
- `_yahoo_chart` 422
- `market_index` 429
- `market_quotes` 462
- `news_search` 487
- `news_top` 522
- `_tg_token_ok` 552
- `_tg_call` 557
- `telegram_send` 575
- `telegram_chat` 583
- `_tg_poll` 599
- `tg_start` 628
- `tg_stop` 642
- `ai_available` 670
- `_ask_claude` 679
- `_ask_gemini` 713
- `gemini_tts` 793
- `gemini_models` 844
- `_clean_history` 860
- `_claude_msgs` 877
- `_ask` 881
- `ai_brief` 889
- `ai_test` 902
- `ai_ask` 1043
- `demo_daily` 1069
- `_hash01` 1101
- `demo_chart` 1109
- `Hub` 1164
- `_tick_size` 1203
- `_tick_msg` 1210
- `_book_msg` 1220
- `Realtime` 1229
- `DemoRealtime` 1410
- `_state_path` 1463
- `state_read` 1477
- `state_write` 1486
- `state_backup` 1507
- `trade_available` 1539
- `acct_mask` 1543
- `_day_used` 1547
- `_day_add` 1556
- `nh_trade_post` 1573
- `_msg` 1593
- `_block` 1600
- `trade_check_acct` 1605
- `trade_status` 1627
- `trade_log` 1636
- `trade_order` 1642
- `trade_cancel` 1698
- `trade_balance` 1714
- `trade_orders` 1735
- `Handler` 1754
- `ExclusiveServer` 1973
- `hidden_input` 1984
- `main` 2005
