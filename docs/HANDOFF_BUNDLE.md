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
- `docs/CODE_MAP.md`는 아직 다시 만들지 않음 — 파이썬이 있는 컴퓨터에서 `python tools/make_handoff.py`.


---

# 매매 전략과 검증 결과

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

총 7,751줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.35 · 2026-11-01 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**366** · 1. 설정 · 상태
- `tfInfo` 473
- `applySynced` 507
- `loadStore` 522
- `loadToken` 539
- `saveToken` 540
- `saveStore` 541
- `bgRun` 554
- `bgWorker` 555
- `bgEvery` 556

**559** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 561
- `hmToMin` 572

**573** · ---- 휴장일: 한국거래소 공휴일·연말 휴장 (2026~2027) + 설정 '휴장일 더하기' — 휴장일에는 장중 판단·시세 재조회를 하지 않음
- `userHolidays` 576
- `isHoliday` 577
- `isTradingDay` 578
- `marketOpenNow` 579
- `tickSize` 584
- `tickFloor` 593
- `tickCeil` 594
- `won` 595
- `pct` 596
- `fmtDate` 597
- `nameOf` 598
- `esc` 599
- `toast` 601

**616** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridgeTimeout` 620
- `bridge` 621
- `db` 641
- `cacheGet` 652
- `cachePut` 658
- `cacheAllDaily` 665
- `modeKey` 682
- `lastFinalClose` 685
- `isStale` 697
- `weekdaysSince` 703
- `fetchDaily` 713
- `isCore` 743
- `applyDaily` 747
- `bucketOf` 754
- `aggregateDaily` 760
- `chartWant` 774
- `fetchChart` 775

**804** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 806
- `priceBroken` 843

**848** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 850
- `loadCaps` 851
- `codeOfBars` 859
- `capOf` 865
- `bbCross` 867
- `structWhy` 878
- `baseBreakout` 891
- `widthLow` 898
- `isAccum` 906
- `accSqueeze` 914
- `squeezeCore` 924
- `sqKey` 939
- `isSqueeze` 941
- `squeezeSetup` 949
- `isLongCandle` 957
- `waitOk` 968
- `phInfo` 977
- `waitBase` 989
- `waitFrom` 990
- `above5` 1002
- `isBreakout` 1003
- `reBreakFrom` 1009
- `sqFollowFrom` 1026
- `rawSignal` 1040
- `entryLabel` 1049
- `rawLabel` 1053

**1060** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1065
- `costBuy` 1066
- `costSell` 1067
- `newSeq` 1069
- `seqBuy` 1082
- `seqSellAll` 1095
- `maN` 1104
- `stepSeq` 1110
- `seqResult` 1141
- `rankScore` 1149

**1155** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1157

**1242** · 7. 종목 목록
- `marketCodes` 1245
- `screenPass` 1252
- `universeCodes` 1261
- `rowInfo` 1273
- `renderSymbols` 1289
- `renderScrBar` 1330

**1339** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1344
- `chartBars` 1347
- `setChart` 1353
- `loadChart` 1361
- `chartGeom` 1413
- `axisTag` 1422
- `drawChart` 1431
- `drawChartNow` 1436
- `renderTfBar` 1628
- `updateBarCount` 1633
- `renderChartHeader` 1637
- `selectCode` 1658
- `setTf` 1671
- `rightPad` 1679
- `setViewEnd` 1680
- `curEnd` 1690
- `stopGlide` 1691
- `zoom` 1757
- `pan` 1768

**1777** · 9. 백테스트 패널
- `recomputeAll` 1779
- `runBt` 1785
- `renderBt` 1792
- `drawEquity` 1825

**1848** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1850
- `plog` 1854
- `lastPrice` 1859

**1866** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1870
- `sessionDate` 1879
- `buyRate` 1886
- `sellRate` 1887
- `manualValue` 1888
- `reservedCash` 1889
- `reservedQty` 1890
- `strategyReserve` 1892
- `buyingPower` 1893
- `sellable` 1894
- `liveQuote` 1896
- `fillBuy` 1903
- `fillSell` 1920
- `submitOrder` 1943
- `cancelOrder` 1979
- `matchOrders` 1987
- `expireOrders` 2003
- `orderWatchTick` 2012

**2026** · ---- 주문창
- `ticketSync` 2029
- `renderTicket` 2039
- `ticketPct` 2065
- `stepPrice` 2073
- `withTodayBar` 2082
- `refreshQuotes` 2093
- `paperExit` 2108
- `paperDecide` 2122
- `renderPaper` 2208
- `scheduler` 2270

**2294** · 11. 설정 패널

**2296** · ---- 설정 찾기 · 바뀐 값 표시: 위 검색칸에 낱말을 넣으면 그 항목만, '바꾼 것만'을 켜면 기본값과 다른 항목만 보임 (● = 기본값과 다름)
- `sameVal` 2298
- `renderSettings` 2300
- `readSettings` 2339
- `setLabelOf` 2353

**2372** · 12. 이벤트 · 초기화
- `setTab` 2374
- `applyPanes` 2384
- `bindResizer` 2396
- `openHolding` 2443
- `sellNow` 2451
- `renderHoldInfo` 2471
- `toggleWatch` 2527
- `setMaster` 2539
- `loadMaster` 2547
- `searchMatches` 2557
- `renderSearch` 2585
- `openFromSearch` 2593

**2609** · ---- 단축키 (? 로 안내): / 검색 · 1~4 오른쪽 탭 · [ ] 패널 · S 관심 · D W M 주기 · + − 확대 · End 최신 · R 리서치 센터
- `showKeys` 2611
- `popOpen` 2614
- `connectBridge` 2647

**2689** · ---- 중계기 연결 감시: 20초마다 확인 → 두 번 연속 응답이 없으면 '끊김'으로 표시하고, 다시 켜지면 저절로 이어 붙음
- `connWatch` 2691
- `loadSaved` 2720
- `syncData` 2738
- `liveTick` 2792

**2833** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2838
- `rtStop` 2844
- `rtLoop` 2849
- `rtWanted` 2877
- `rtSubscribe` 2885
- `rtMsg` 2898
- `applyTick` 2906
- `updateMinuteBar` 2939
- `renderRtBadge` 2953
- `prevClose` 2965
- `chgTag` 2971
- `renderBook` 2972

**3025** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 3030
- `sync` 3037
- `saveSync` 3044
- `syncPayload` 3047
- `hasActivity` 3050
- `syncHash` 3055
- `syncMark` 3062
- `applyRemote` 3069
- `syncPush` 3081
- `syncPull` 3103
- `renderSync` 3127

**3159** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3168
- `sgn` 3192
- `pctTxt` 3193
- `evidenceAt` 3196
- `computeResearch` 3251
- `refreshResearch` 3282
- `regimeChip` 3291
- `researchChart` 3296
- `renderResearch0` 3307
- `renderResearch` 3355

**3363** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3406
- `setSectors` 3413
- `loadSectors` 3418
- `sectorOf` 3426
- `scenarioCodes` 3488

**3490** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3491
- `aboveMa` 3497
- `median` 3505
- `avg` 3506
- `sectorStats` 3508

**3526** · ---- 뉴스
- `getNews` 3528
- `agoTxt` 3535
- `newsList` 3536

**3540** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3542
- `loadScenarioNews` 3552

**3562** · ---- 화면
- `chg` 3564
- `heat` 3565
- `stockLink` 3566
- `renderSectorTab` 3568
- `renderSectorDetail` 3590
- `renderScenarioTab` 3606
- `renderNewsTab` 3633
- `renderCenter` 3641
- `openCenter` 3655
- `runNews` 3664
- `fetchSector` 3672

**3729** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3740
- `liveBar` 3752
- `winRange` 3758
- `winLog` 3761
- `winScan` 3766
- `winEvaluate` 3783
- `winStep` 3806
- `winFinish` 3870
- `windowTick` 3891
- `renderWindow` 3912
- `loadMoreBars` 3920

**3926** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3932
- `briefFacts` 3950
- `loadAi` 3971
- `renderBriefTab` 3985

**4029** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 4033
- `saveAiCfg` 4039
- `aiReady` 4043
- `aiPayload` 4046
- `renderAiBox` 4049
- `modelKind` 4064
- `readAiBox` 4070

**4129** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 4134
- `pushFeed` 4135
- `aiAuto` 4140
- `askAi` 4141

**4147** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 4148
- `entryCtx` 4163

**4168** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4178
- `btTrades` 4208
- `myTrades` 4221
- `journal` 4224
- `statLine` 4231

**4241** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4242
- `showGuard` 4286
- `guardedSubmit` 4302

**4308** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4309
- `briefLines` 4336
- `assistOnSelect` 4349

**4366** · ---- 체결 직후 코멘트
- `assistOnTrade` 4367

**4382** · ---- 화면
- `renderAssistStrip` 4383
- `tableOf` 4390
- `renderAssist` 4402
- `foldOpen` 4433
- `fold` 4434
- `runAsk` 4467
- `calDays` 4485

**4491** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4496
- `marketRadarFacts` 4498
- `assistFacts` 4515
- `renderChat` 4533

**4547** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4548
- `grabActs` 4559
- `splitActions` 4574
- `plainSay` 4592
- `describeAct` 4596
- `findCode` 4618
- `confirmAct` 4627
- `runAction` 4642
- `settingAct` 4787
- `orderAct` 4811
- `runActions` 4825

**4835** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4839
- `saveCustom` 4843
- `safeId` 4846
- `attr` 4847
- `splitBlocks` 4849
- `applyBlocks` 4857
- `applyCss` 4885
- `calcInd` 4898
- `drawCustomInd` 4907
- `jsonSafe` 4952
- `widgetData` 4953
- `renderWidgets` 4984
- `renderCustomBox` 5023
- `customFacts` 5045

**5053** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 5056
- `realConfirm` 5065
- `realSubmit` 5083
- `realCancel` 5114
- `realArm` 5120
- `realKill` 5130
- `renderReal` 5135
- `realFacts` 5171

**5177** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5180
- `setRangeMode` 5185
- `analyzeRange` 5193
- `similarSpots` 5222
- `startRange` 5247
- `endRange` 5254
- `openRangeCard` 5264
- `renderRangeCard` 5270
- `rangeFacts` 5293
- `saveMark` 5299
- `drawRanges` 5333
- `openMark` 5372
- `marksFacts` 5379
- `marksFold` 5384
- `verTxt` 5399
- `checkPageVersion` 5403

**5423** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5442
- `runRule` 5445
- `computeRules` 5455
- `dataSig` 5470
- `ruleTick` 5472
- `stopPrice` 5479
- `exitOrStop` 5483
- `exitSignal` 5488
- `btBrief` 5495
- `btDiff` 5496
- `selSignals` 5502
- `setRule` 5509
- `renderRules` 5519
- `rulesFacts` 5553
- `drawStrategyMarks` 5558

**5595** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5598
- `saveAlertCfg` 5599
- `alertSeen` 5600
- `alertOnce` 5601
- `raiseAlert` 5608
- `flushSay` 5618
- `showAlertCard` 5625
- `hm2min` 5637
- `alertTick` 5639
- `realFillCheck` 5678
- `renderAlertBtn` 5687

**5700** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5701
- `backtestWithRule` 5714
- `halfStats` 5731
- `setLabel` 5776
- `compareVariants` 5778
- `variantsFrom` 5808
- `runCompare` 5813
- `tableHtml` 5823

**5824** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5838
- `markIndex` 5839
- `roundT` 5848
- `extractRule` 5849
- `runExtract` 5898
- `extractFacts` 5928

**5929** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5931

**5941** · ---- 엑셀로 저장: 백테스트 거래 · 매매 일지 · 모의 매매 기록을 CSV로 (엑셀에서 한글이 깨지지 않게 BOM 포함)
- `downloadCsv` 5942
- `ymdDot` 5958
- `kstTime` 5959
- `exportBtCsv` 5960
- `exportJournalCsv` 5967
- `importRecords` 5972

**5993** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5994

**6031** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 6033
- `drawAct` 6034
- `drawClearAct` 6053
- `drawUserDraw` 6060
- `drawLegend` 6088
- `drawFacts` 6093

**6095** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 6097
- `journalAdd` 6098
- `journalWhyAct` 6112
- `journalFold` 6120
- `journalFacts` 6148

**6160** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 6163
- `cl` 6174
- `indDef` 6237
- `indLabel` 6238
- `clone` 6241
- `normalizeLook` 6242
- `lookSubs` 6260
- `lookSeries` 6263
- `strokeSeries` 6271
- `fillBetween` 6278

**6288** · ---- 매물대: 가격대별 거래량 — 봉마다 거래량을 저가~고가에 고르게 나눠 칸에 쌓음 (양봉 거래량 · 음봉 거래량 따로)
- `vpBins` 6289
- `drawVP` 6304
- `vpFacts` 6328
- `drawLookOverlays` 6337
- `drawLookSubs` 6350
- `numShort` 6389
- `lookLegend` 6390
- `renderLookCard` 6398
- `lookChanged` 6418
- `openLook` 6423
- `lkSet` 6429
- `lookAct` 6460
- `lookFacts` 6503

**6505** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6508
- `agendaKey` 6509
- `agendaFind` 6510
- `equityNow` 6511
- `freeCash` 6512
- `planBuyQty` 6513
- `agendaChecks` 6518
- `agendaCreate` 6547
- `agendaBrief` 6561
- `agendaGate` 6576
- `agendaDone` 6584
- `winActiveFor` 6585
- `paperBuyNow` 6587
- `agendaExecNow` 6605
- `agendaDecide` 6629
- `agendaExpire` 6643
- `agendaOutcome` 6650
- `agendaHistLine` 6655
- `renderAgenda` 6660
- `agendaFacts` 6731

**6741** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6742
- `applyExternalReply` 6752

**6783** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6789
- `idxPct` 6790
- `loadMarketQuotes` 6791
- `renderIdxBar` 6798
- `renderIndexTab` 6809
- `renderIndexToolbar` 6818
- `idxEnter` 6827
- `idxExit` 6848
- `marketFacts` 6859

**6863** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6866
- `invLevOf` 6867
- `invHeld` 6868
- `invDecision` 6870
- `invEvaluate` 6888
- `invExec` 6902
- `invBacktest` 6916
- `invBtLine` 6951
- `renderInv` 6953
- `invFacts` 6997
- `invChecks` 7010

**7029** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 7030
- `renderManage` 7041
- `manageFacts` 7058

**7062** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 7064
- `newsAgo` 7070
- `renderNewsTicker` 7071
- `topNewsFacts` 7091

**7094** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 7095

**7102** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 7105
- `waitCodes` 7121
- `renderWait` 7122
- `waitAlerts` 7135

**7141** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 7144

**7175** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 7178
- `savePhone` 7179
- `phoneNotify` 7181
- `renderPhone` 7189

**7221** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 7225
- `tgReply` 7230
- `agShort` 7234
- `agByShort` 7235
- `tgHandle` 7238
- `tgStart` 7309
- `savePin` 7317
- `chatSend` 7322
- `convoNext` 7348
- `convoToggle` 7354
- `voiceSel` 7370
- `stopSpeaking` 7372
- `speechChunks` 7379
- `pcmToWavBlob` 7386
- `audioBlob` 7394
- `speakText` 7399
- `browserSpeak` 7433
- `micToggle` 7447
- `silenceMs` 7456
- `endWait` 7461
- `startSR` 7469
- `startRecorder` 7520

**7592** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7600
- `mlpForward` 7605
- `aucOf` 7610
- `trainStyle` 7618
- `retrainStyle` 7669
- `predictWin` 7682
- `predictBin` 7689
- `styleProfile` 7696
- `renderStyle` 7705

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `phOn`, `phCap`, `phDays`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`, `holidays`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `vp` 매물대(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `cmf` CMF(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 2,035줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/caps`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/market/index`, `/market/quotes`, `/news`, `/news/top`, `/notify/telegram`, `/notify/telegram_chat`, `/notify/tg_start`, `/notify/tg_stop`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

### AI 요청 종류 (`ASK_PURPOSE`)

`stock`, `trade`, `order`, `journal`, `risk`, `ask`, `chat`, `range`

비서 대화 규칙·명령 설명은 `CHAT_STYLE`, `CHAT_ACTIONS` 문자열.

### 함수·클래스 (줄 번호)

- `_load_token` 39
- `origin_allowed` 72
- `_throttle` 79
- `access_token` 88
- `token_invalidate` 112
- `nh_post` 126
- `_num` 151
- `_period_rows` 162
- `_bars` 176
- `nh_chart` 188
- `nh_daily` 198
- `nh_components` 216
- `_krx_finder` 246
- `krx_master` 255
- `krx_caps` 306
- `krx_sectors` 362
- `_yahoo_chart` 417
- `market_index` 424
- `market_quotes` 457
- `news_search` 482
- `news_top` 517
- `_tg_token_ok` 547
- `_tg_call` 552
- `telegram_send` 570
- `telegram_chat` 578
- `_tg_poll` 594
- `tg_start` 623
- `tg_stop` 637
- `ai_available` 665
- `_ask_claude` 674
- `_ask_gemini` 708
- `gemini_tts` 788
- `gemini_models` 839
- `_clean_history` 855
- `_claude_msgs` 872
- `_ask` 876
- `ai_brief` 884
- `ai_test` 897
- `ai_ask` 1038
- `demo_daily` 1064
- `_hash01` 1096
- `demo_chart` 1104
- `Hub` 1159
- `_tick_size` 1198
- `_tick_msg` 1205
- `_book_msg` 1215
- `Realtime` 1224
- `DemoRealtime` 1405
- `_state_path` 1458
- `state_read` 1472
- `state_write` 1481
- `state_backup` 1502
- `trade_available` 1534
- `acct_mask` 1538
- `_day_used` 1542
- `_day_add` 1551
- `nh_trade_post` 1568
- `_msg` 1588
- `_block` 1595
- `trade_check_acct` 1600
- `trade_status` 1622
- `trade_log` 1631
- `trade_order` 1637
- `trade_cancel` 1693
- `trade_balance` 1709
- `trade_orders` 1730
- `Handler` 1749
- `ExclusiveServer` 1968
- `hidden_input` 1979
- `main` 2000
