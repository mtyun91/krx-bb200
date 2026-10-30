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

운용(스퀴즈): 5일선 PF 1.04 · **10일선 1.18** · 20일선 1.12 · 돌파봉 저가 손절+10일선 1.17 · 절반 익절 20%+20일선 1.15 → 매도선은 10일선, 손절은 성과를 크게 바꾸지 않지만 최대 손실을 정해 줌.

## 사용자의 매매 생각 (요청 이력 요약)

- 장기 추세 신호 = 200일 밴드가 하락 뒤 횡보하며 최대로 좁아진 상태에서 상단 돌파(몇 년 매집의 흔적). 다만 절대적이지 않다.
- 장대양봉 돌파는 바로 따라가지 말고 눌림·안정 뒤 매수(N자). 대기 뒤 그 고점을 강하게 넘는 봉에서는 산다.
- 돌파 뒤 5일선 안착이 중요하다고 본다(옵션으로 넣고 비교 중).
- 수익률 글자: 이익 빨강, 손실 파랑(한국식).
- 계좌는 포트폴리오 복리 운용. 최종 매수·매도 결정은 항상 본인(결재제).


---

# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,399줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.30 · 2026-10-30 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**345** · 1. 설정 · 상태
- `tfInfo` 440
- `applySynced` 474
- `loadStore` 489
- `loadToken` 506
- `saveToken` 507
- `saveStore` 508
- `bgRun` 521
- `bgWorker` 522
- `bgEvery` 523

**526** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 528
- `hmToMin` 539
- `marketOpenNow` 540
- `tickSize` 545
- `tickFloor` 554
- `tickCeil` 555
- `won` 556
- `pct` 557
- `fmtDate` 558
- `nameOf` 559
- `esc` 560
- `toast` 561

**570** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 573
- `db` 585
- `cacheGet` 596
- `cachePut` 602
- `cacheAllDaily` 609
- `modeKey` 626
- `lastFinalClose` 629
- `isStale` 641
- `weekdaysSince` 647
- `fetchDaily` 657
- `isCore` 687
- `applyDaily` 691
- `bucketOf` 698
- `aggregateDaily` 704
- `chartWant` 718
- `fetchChart` 719

**748** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 750
- `priceBroken` 782
- `baseBreakout` 787
- `squeezeCore` 799
- `sqKey` 817
- `isSqueeze` 819
- `squeezeSetup` 827
- `isLongCandle` 835
- `waitOk` 846
- `waitBase` 853
- `waitFrom` 854
- `above5` 866
- `isBreakout` 867
- `reBreakFrom` 873
- `sqFollowFrom` 890
- `rawSignal` 904
- `entryLabel` 913
- `rawLabel` 917

**924** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 929
- `costBuy` 930
- `costSell` 931
- `newSeq` 933
- `seqBuy` 946
- `seqSellAll` 959
- `maN` 968
- `stepSeq` 974
- `seqResult` 1005
- `rankScore` 1013

**1019** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1021

**1106** · 7. 종목 목록
- `marketCodes` 1109
- `screenPass` 1116
- `universeCodes` 1125
- `rowInfo` 1137
- `renderSymbols` 1153
- `renderScrBar` 1194

**1203** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1208
- `chartBars` 1211
- `setChart` 1217
- `loadChart` 1225
- `chartGeom` 1277
- `axisTag` 1286
- `drawChart` 1295
- `drawChartNow` 1300
- `renderTfBar` 1492
- `updateBarCount` 1497
- `renderChartHeader` 1501
- `selectCode` 1522
- `setTf` 1535
- `rightPad` 1543
- `setViewEnd` 1544
- `curEnd` 1554
- `stopGlide` 1555
- `zoom` 1621
- `pan` 1632

**1641** · 9. 백테스트 패널
- `recomputeAll` 1643
- `runBt` 1649
- `renderBt` 1656
- `drawEquity` 1689

**1712** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1714
- `plog` 1718
- `lastPrice` 1723

**1730** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1734
- `sessionDate` 1743
- `buyRate` 1750
- `sellRate` 1751
- `manualValue` 1752
- `reservedCash` 1753
- `reservedQty` 1754
- `strategyReserve` 1756
- `buyingPower` 1757
- `sellable` 1758
- `liveQuote` 1760
- `fillBuy` 1767
- `fillSell` 1784
- `submitOrder` 1807
- `cancelOrder` 1843
- `matchOrders` 1851
- `expireOrders` 1867
- `orderWatchTick` 1876

**1890** · ---- 주문창
- `ticketSync` 1893
- `renderTicket` 1903
- `ticketPct` 1929
- `stepPrice` 1937
- `withTodayBar` 1946
- `refreshQuotes` 1957
- `paperExit` 1972
- `paperDecide` 1986
- `renderPaper` 2072
- `scheduler` 2134

**2158** · 11. 설정 패널
- `renderSettings` 2160
- `readSettings` 2174

**2199** · 12. 이벤트 · 초기화
- `setTab` 2201
- `applyPanes` 2211
- `bindResizer` 2223
- `openHolding` 2270
- `sellNow` 2278
- `renderHoldInfo` 2298
- `toggleWatch` 2354
- `setMaster` 2366
- `loadMaster` 2374
- `searchMatches` 2384
- `renderSearch` 2412
- `openFromSearch` 2420
- `connectBridge` 2452
- `loadSaved` 2496
- `syncData` 2514
- `liveTick` 2568

**2609** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2614
- `rtStop` 2620
- `rtLoop` 2625
- `rtWanted` 2653
- `rtSubscribe` 2661
- `rtMsg` 2674
- `applyTick` 2682
- `updateMinuteBar` 2715
- `renderRtBadge` 2729
- `prevClose` 2741
- `chgTag` 2747
- `renderBook` 2748

**2801** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2806
- `sync` 2813
- `saveSync` 2820
- `syncPayload` 2823
- `hasActivity` 2826
- `syncHash` 2831
- `syncMark` 2838
- `applyRemote` 2845
- `syncPush` 2857
- `syncPull` 2879
- `renderSync` 2903

**2935** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2944
- `sgn` 2968
- `pctTxt` 2969
- `evidenceAt` 2972
- `computeResearch` 3027
- `refreshResearch` 3058
- `regimeChip` 3067
- `researchChart` 3072
- `renderResearch0` 3083
- `renderResearch` 3131

**3139** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3182
- `setSectors` 3189
- `loadSectors` 3194
- `sectorOf` 3202
- `scenarioCodes` 3264

**3266** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3267
- `aboveMa` 3273
- `median` 3281
- `avg` 3282
- `sectorStats` 3284

**3302** · ---- 뉴스
- `getNews` 3304
- `agoTxt` 3311
- `newsList` 3312

**3316** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3318
- `loadScenarioNews` 3328

**3338** · ---- 화면
- `chg` 3340
- `heat` 3341
- `stockLink` 3342
- `renderSectorTab` 3344
- `renderSectorDetail` 3366
- `renderScenarioTab` 3382
- `renderNewsTab` 3409
- `renderCenter` 3417
- `openCenter` 3431
- `runNews` 3440
- `fetchSector` 3448

**3505** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3516
- `liveBar` 3528
- `winRange` 3534
- `winLog` 3537
- `winScan` 3542
- `winEvaluate` 3559
- `winStep` 3582
- `winFinish` 3646
- `windowTick` 3667
- `renderWindow` 3688
- `loadMoreBars` 3696

**3702** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3708
- `briefFacts` 3726
- `loadAi` 3747
- `renderBriefTab` 3761

**3805** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3809
- `saveAiCfg` 3815
- `aiReady` 3819
- `aiPayload` 3822
- `renderAiBox` 3825
- `modelKind` 3840
- `readAiBox` 3846

**3905** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3910
- `pushFeed` 3911
- `aiAuto` 3916
- `askAi` 3917

**3923** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3924
- `entryCtx` 3939

**3944** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3954
- `btTrades` 3984
- `myTrades` 3997
- `journal` 4000
- `statLine` 4007

**4017** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4018
- `showGuard` 4062
- `guardedSubmit` 4078

**4084** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4085
- `briefLines` 4112
- `assistOnSelect` 4125

**4142** · ---- 체결 직후 코멘트
- `assistOnTrade` 4143

**4158** · ---- 화면
- `renderAssistStrip` 4159
- `tableOf` 4166
- `renderAssist` 4178
- `foldOpen` 4209
- `fold` 4210
- `runAsk` 4243
- `calDays` 4261

**4267** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4272
- `marketRadarFacts` 4274
- `assistFacts` 4291
- `renderChat` 4309

**4323** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4324
- `grabActs` 4335
- `splitActions` 4350
- `plainSay` 4368
- `describeAct` 4372
- `findCode` 4394
- `confirmAct` 4403
- `runAction` 4418
- `settingAct` 4563
- `orderAct` 4587
- `runActions` 4601

**4611** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4615
- `saveCustom` 4619
- `safeId` 4622
- `attr` 4623
- `splitBlocks` 4625
- `applyBlocks` 4633
- `applyCss` 4661
- `calcInd` 4674
- `drawCustomInd` 4683
- `jsonSafe` 4728
- `widgetData` 4729
- `renderWidgets` 4760
- `renderCustomBox` 4799
- `customFacts` 4821

**4829** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4832
- `realConfirm` 4841
- `realSubmit` 4859
- `realCancel` 4890
- `realArm` 4896
- `realKill` 4906
- `renderReal` 4911
- `realFacts` 4947

**4953** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4956
- `setRangeMode` 4961
- `analyzeRange` 4969
- `similarSpots` 4998
- `startRange` 5023
- `endRange` 5030
- `openRangeCard` 5040
- `renderRangeCard` 5046
- `rangeFacts` 5069
- `saveMark` 5075
- `drawRanges` 5109
- `openMark` 5148
- `marksFacts` 5155
- `marksFold` 5160
- `verTxt` 5175
- `checkPageVersion` 5179

**5199** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5218
- `runRule` 5221
- `computeRules` 5231
- `dataSig` 5246
- `ruleTick` 5248
- `stopPrice` 5255
- `exitOrStop` 5259
- `exitSignal` 5264
- `btBrief` 5271
- `btDiff` 5272
- `selSignals` 5278
- `setRule` 5285
- `renderRules` 5295
- `rulesFacts` 5326
- `drawStrategyMarks` 5331

**5359** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5362
- `saveAlertCfg` 5363
- `alertSeen` 5364
- `alertOnce` 5365
- `raiseAlert` 5372
- `flushSay` 5382
- `showAlertCard` 5389
- `hm2min` 5401
- `alertTick` 5403
- `realFillCheck` 5442
- `renderAlertBtn` 5451

**5464** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5465
- `backtestWithRule` 5478
- `halfStats` 5495
- `setLabel` 5516
- `compareVariants` 5518
- `variantsFrom` 5548
- `runCompare` 5553
- `tableHtml` 5563

**5564** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5578
- `markIndex` 5579
- `roundT` 5588
- `extractRule` 5589
- `runExtract` 5638
- `extractFacts` 5668

**5669** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5671
- `importRecords` 5681

**5702** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5703

**5740** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5742
- `drawAct` 5743
- `drawClearAct` 5762
- `drawUserDraw` 5769
- `drawLegend` 5797
- `drawFacts` 5802

**5804** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5806
- `journalAdd` 5807
- `journalWhyAct` 5821
- `journalFold` 5829
- `journalFacts` 5856

**5868** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5871
- `cl` 5882
- `indDef` 5941
- `indLabel` 5942
- `clone` 5945
- `normalizeLook` 5946
- `lookSubs` 5960
- `lookSeries` 5963
- `strokeSeries` 5971
- `fillBetween` 5978
- `drawLookOverlays` 5988
- `drawLookSubs` 6000
- `numShort` 6039
- `lookLegend` 6040
- `renderLookCard` 6048
- `lookChanged` 6067
- `openLook` 6072
- `lkSet` 6078
- `lookAct` 6109
- `lookFacts` 6152

**6154** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6157
- `agendaKey` 6158
- `agendaFind` 6159
- `equityNow` 6160
- `freeCash` 6161
- `planBuyQty` 6162
- `agendaChecks` 6167
- `agendaCreate` 6195
- `agendaBrief` 6209
- `agendaGate` 6224
- `agendaDone` 6232
- `winActiveFor` 6233
- `paperBuyNow` 6235
- `agendaExecNow` 6253
- `agendaDecide` 6277
- `agendaExpire` 6291
- `agendaOutcome` 6298
- `agendaHistLine` 6303
- `renderAgenda` 6308
- `agendaFacts` 6379

**6389** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6390
- `applyExternalReply` 6400

**6431** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6437
- `idxPct` 6438
- `loadMarketQuotes` 6439
- `renderIdxBar` 6446
- `renderIndexTab` 6457
- `renderIndexToolbar` 6466
- `idxEnter` 6475
- `idxExit` 6496
- `marketFacts` 6507

**6511** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6514
- `invLevOf` 6515
- `invHeld` 6516
- `invDecision` 6518
- `invEvaluate` 6536
- `invExec` 6550
- `invBacktest` 6564
- `invBtLine` 6599
- `renderInv` 6601
- `invFacts` 6645
- `invChecks` 6658

**6677** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6678
- `renderManage` 6689
- `manageFacts` 6706

**6710** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 6712
- `newsAgo` 6718
- `renderNewsTicker` 6719
- `topNewsFacts` 6739

**6742** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 6743

**6750** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 6753
- `waitCodes` 6769
- `renderWait` 6770
- `waitAlerts` 6783

**6789** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 6792

**6823** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 6826
- `savePhone` 6827
- `phoneNotify` 6829
- `renderPhone` 6837

**6869** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 6873
- `tgReply` 6878
- `agShort` 6882
- `agByShort` 6883
- `tgHandle` 6886
- `tgStart` 6957
- `savePin` 6965
- `chatSend` 6970
- `convoNext` 6996
- `convoToggle` 7002
- `voiceSel` 7018
- `stopSpeaking` 7020
- `speechChunks` 7027
- `pcmToWavBlob` 7034
- `audioBlob` 7042
- `speakText` 7047
- `browserSpeak` 7081
- `micToggle` 7095
- `silenceMs` 7104
- `endWait` 7109
- `startSR` 7117
- `startRecorder` 7168

**7240** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7248
- `mlpForward` 7253
- `aucOf` 7258
- `trainStyle` 7266
- `retrainStyle` 7317
- `predictWin` 7330
- `predictBin` 7337
- `styleProfile` 7344
- `renderStyle` 7353

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,976줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/market/index`, `/market/quotes`, `/news`, `/news/top`, `/notify/telegram`, `/notify/telegram_chat`, `/notify/tg_start`, `/notify/tg_stop`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

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
- `krx_sectors` 305
- `_yahoo_chart` 360
- `market_index` 367
- `market_quotes` 400
- `news_search` 425
- `news_top` 460
- `_tg_token_ok` 490
- `_tg_call` 495
- `telegram_send` 513
- `telegram_chat` 521
- `_tg_poll` 537
- `tg_start` 566
- `tg_stop` 580
- `ai_available` 608
- `_ask_claude` 617
- `_ask_gemini` 651
- `gemini_tts` 731
- `gemini_models` 782
- `_clean_history` 798
- `_claude_msgs` 815
- `_ask` 819
- `ai_brief` 827
- `ai_test` 840
- `ai_ask` 981
- `demo_daily` 1007
- `_hash01` 1039
- `demo_chart` 1047
- `Hub` 1102
- `_tick_size` 1141
- `_tick_msg` 1148
- `_book_msg` 1158
- `Realtime` 1167
- `DemoRealtime` 1348
- `_state_path` 1401
- `state_read` 1415
- `state_write` 1424
- `state_backup` 1445
- `trade_available` 1477
- `acct_mask` 1481
- `_day_used` 1485
- `_day_add` 1494
- `nh_trade_post` 1511
- `_msg` 1531
- `_block` 1538
- `trade_check_acct` 1543
- `trade_status` 1565
- `trade_log` 1574
- `trade_order` 1580
- `trade_cancel` 1636
- `trade_balance` 1652
- `trade_orders` 1673
- `Handler` 1692
- `ExclusiveServer` 1909
- `hidden_input` 1920
- `main` 1941
