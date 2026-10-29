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

총 7,061줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.26 · 2026-10-29 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**342** · 1. 설정 · 상태
- `tfInfo` 435
- `applySynced` 469
- `loadStore` 484
- `loadToken` 501
- `saveToken` 502
- `saveStore` 503
- `bgRun` 516
- `bgWorker` 517
- `bgEvery` 518

**521** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 523
- `hmToMin` 534
- `marketOpenNow` 535
- `tickSize` 540
- `tickFloor` 549
- `tickCeil` 550
- `won` 551
- `pct` 552
- `fmtDate` 553
- `nameOf` 554
- `esc` 555
- `toast` 556

**565** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 568
- `db` 580
- `cacheGet` 591
- `cachePut` 597
- `cacheAllDaily` 604
- `modeKey` 621
- `lastFinalClose` 624
- `isStale` 636
- `weekdaysSince` 642
- `fetchDaily` 652
- `isCore` 682
- `applyDaily` 686
- `bucketOf` 693
- `aggregateDaily` 699
- `chartWant` 713
- `fetchChart` 714

**743** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 745
- `priceBroken` 777
- `baseBreakout` 782
- `isSqueeze` 793
- `isLongCandle` 818
- `waitOk` 829
- `waitBase` 836
- `waitFrom` 837
- `above5` 849
- `isBreakout` 850
- `reBreakFrom` 856
- `sqFollowFrom` 873
- `rawSignal` 887
- `entryLabel` 896
- `rawLabel` 900

**907** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 912
- `costBuy` 913
- `costSell` 914
- `newSeq` 916
- `seqBuy` 929
- `seqSellAll` 942
- `maN` 951
- `stepSeq` 957
- `seqResult` 988
- `rankScore` 996

**1002** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1004

**1089** · 7. 종목 목록
- `marketCodes` 1092
- `screenPass` 1099
- `universeCodes` 1108
- `rowInfo` 1120
- `renderSymbols` 1135
- `renderScrBar` 1175

**1184** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1189
- `chartBars` 1192
- `setChart` 1198
- `loadChart` 1206
- `chartGeom` 1258
- `axisTag` 1267
- `drawChart` 1276
- `drawChartNow` 1281
- `renderTfBar` 1473
- `updateBarCount` 1478
- `renderChartHeader` 1482
- `selectCode` 1503
- `setTf` 1516
- `rightPad` 1524
- `setViewEnd` 1525
- `curEnd` 1535
- `stopGlide` 1536
- `zoom` 1602
- `pan` 1613

**1622** · 9. 백테스트 패널
- `recomputeAll` 1624
- `runBt` 1630
- `renderBt` 1637
- `drawEquity` 1670

**1693** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1695
- `plog` 1699
- `lastPrice` 1704

**1711** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1715
- `sessionDate` 1724
- `buyRate` 1731
- `sellRate` 1732
- `manualValue` 1733
- `reservedCash` 1734
- `reservedQty` 1735
- `strategyReserve` 1737
- `buyingPower` 1738
- `sellable` 1739
- `liveQuote` 1741
- `fillBuy` 1748
- `fillSell` 1765
- `submitOrder` 1788
- `cancelOrder` 1824
- `matchOrders` 1832
- `expireOrders` 1848
- `orderWatchTick` 1857

**1871** · ---- 주문창
- `ticketSync` 1874
- `renderTicket` 1884
- `ticketPct` 1910
- `stepPrice` 1918
- `withTodayBar` 1927
- `refreshQuotes` 1938
- `paperExit` 1953
- `paperDecide` 1967
- `renderPaper` 2053
- `scheduler` 2115

**2139** · 11. 설정 패널
- `renderSettings` 2141
- `readSettings` 2155

**2180** · 12. 이벤트 · 초기화
- `setTab` 2182
- `applyPanes` 2192
- `bindResizer` 2204
- `openHolding` 2251
- `sellNow` 2259
- `renderHoldInfo` 2279
- `toggleWatch` 2335
- `setMaster` 2347
- `loadMaster` 2355
- `searchMatches` 2365
- `renderSearch` 2393
- `openFromSearch` 2401
- `connectBridge` 2433
- `loadSaved` 2477
- `syncData` 2495
- `liveTick` 2549

**2590** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2595
- `rtStop` 2601
- `rtLoop` 2606
- `rtWanted` 2634
- `rtSubscribe` 2641
- `rtMsg` 2654
- `applyTick` 2661
- `updateMinuteBar` 2694
- `renderRtBadge` 2708
- `prevClose` 2720
- `chgTag` 2726
- `renderBook` 2727

**2780** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2785
- `sync` 2792
- `saveSync` 2799
- `syncPayload` 2802
- `hasActivity` 2805
- `syncHash` 2810
- `syncMark` 2817
- `applyRemote` 2824
- `syncPush` 2836
- `syncPull` 2858
- `renderSync` 2882

**2914** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2923
- `sgn` 2947
- `pctTxt` 2948
- `evidenceAt` 2951
- `computeResearch` 3006
- `refreshResearch` 3037
- `regimeChip` 3046
- `researchChart` 3051
- `renderResearch0` 3062
- `renderResearch` 3110

**3118** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3161
- `setSectors` 3168
- `loadSectors` 3173
- `sectorOf` 3181
- `scenarioCodes` 3243

**3245** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3246
- `aboveMa` 3252
- `median` 3260
- `avg` 3261
- `sectorStats` 3263

**3281** · ---- 뉴스
- `getNews` 3283
- `agoTxt` 3290
- `newsList` 3291

**3295** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3297
- `loadScenarioNews` 3307

**3317** · ---- 화면
- `chg` 3319
- `heat` 3320
- `stockLink` 3321
- `renderSectorTab` 3323
- `renderSectorDetail` 3345
- `renderScenarioTab` 3361
- `renderNewsTab` 3388
- `renderCenter` 3396
- `openCenter` 3410
- `runNews` 3419
- `fetchSector` 3427

**3484** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3495
- `liveBar` 3507
- `winRange` 3513
- `winLog` 3516
- `winScan` 3521
- `winEvaluate` 3538
- `winStep` 3561
- `winFinish` 3625
- `windowTick` 3646
- `renderWindow` 3667
- `loadMoreBars` 3675

**3681** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3687
- `briefFacts` 3705
- `loadAi` 3726
- `renderBriefTab` 3740

**3784** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3788
- `saveAiCfg` 3794
- `aiReady` 3798
- `aiPayload` 3801
- `renderAiBox` 3804
- `modelKind` 3819
- `readAiBox` 3825

**3884** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3889
- `pushFeed` 3890
- `aiAuto` 3895
- `askAi` 3896

**3902** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3903
- `entryCtx` 3918

**3923** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3933
- `btTrades` 3963
- `myTrades` 3976
- `journal` 3979
- `statLine` 3986

**3996** · ---- 주문 전 실수 방지 점검
- `guardCheck` 3997
- `showGuard` 4041
- `guardedSubmit` 4057

**4063** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4064
- `briefLines` 4091
- `assistOnSelect` 4104

**4121** · ---- 체결 직후 코멘트
- `assistOnTrade` 4122

**4137** · ---- 화면
- `renderAssistStrip` 4138
- `tableOf` 4145
- `renderAssist` 4157
- `foldOpen` 4188
- `fold` 4189
- `runAsk` 4222
- `calDays` 4240

**4246** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4251
- `marketRadarFacts` 4253
- `assistFacts` 4270
- `renderChat` 4288

**4302** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4303
- `grabActs` 4314
- `splitActions` 4329
- `plainSay` 4347
- `describeAct` 4351
- `findCode` 4373
- `confirmAct` 4382
- `runAction` 4397
- `settingAct` 4489
- `orderAct` 4513
- `runActions` 4527

**4537** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4541
- `saveCustom` 4545
- `safeId` 4548
- `attr` 4549
- `splitBlocks` 4551
- `applyBlocks` 4559
- `applyCss` 4587
- `calcInd` 4600
- `drawCustomInd` 4609
- `jsonSafe` 4654
- `widgetData` 4655
- `renderWidgets` 4686
- `renderCustomBox` 4725
- `customFacts` 4747

**4755** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4758
- `realConfirm` 4767
- `realSubmit` 4785
- `realCancel` 4816
- `realArm` 4822
- `realKill` 4832
- `renderReal` 4837
- `realFacts` 4873

**4879** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4882
- `setRangeMode` 4887
- `analyzeRange` 4895
- `similarSpots` 4924
- `startRange` 4949
- `endRange` 4956
- `openRangeCard` 4966
- `renderRangeCard` 4972
- `rangeFacts` 4995
- `saveMark` 5001
- `drawRanges` 5035
- `openMark` 5074
- `marksFacts` 5081
- `marksFold` 5086
- `verTxt` 5101
- `checkPageVersion` 5105

**5125** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5144
- `runRule` 5147
- `computeRules` 5157
- `dataSig` 5172
- `ruleTick` 5174
- `stopPrice` 5181
- `exitOrStop` 5185
- `exitSignal` 5190
- `btBrief` 5197
- `btDiff` 5198
- `selSignals` 5204
- `setRule` 5211
- `renderRules` 5221
- `rulesFacts` 5252
- `drawStrategyMarks` 5257

**5285** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5288
- `saveAlertCfg` 5289
- `alertSeen` 5290
- `alertOnce` 5291
- `raiseAlert` 5298
- `flushSay` 5307
- `showAlertCard` 5314
- `hm2min` 5326
- `alertTick` 5328
- `realFillCheck` 5367
- `renderAlertBtn` 5376

**5389** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5390
- `backtestWithRule` 5403
- `halfStats` 5420
- `setLabel` 5441
- `compareVariants` 5443
- `variantsFrom` 5473
- `runCompare` 5478
- `tableHtml` 5488

**5489** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5503
- `markIndex` 5504
- `roundT` 5513
- `extractRule` 5514
- `runExtract` 5563
- `extractFacts` 5593

**5594** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5596
- `importRecords` 5606

**5627** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5628

**5665** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5667
- `drawAct` 5668
- `drawClearAct` 5687
- `drawUserDraw` 5694
- `drawLegend` 5722
- `drawFacts` 5727

**5729** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5731
- `journalAdd` 5732
- `journalWhyAct` 5746
- `journalFold` 5754
- `journalFacts` 5781

**5793** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5796
- `cl` 5807
- `indDef` 5866
- `indLabel` 5867
- `clone` 5870
- `normalizeLook` 5871
- `lookSubs` 5885
- `lookSeries` 5888
- `strokeSeries` 5896
- `fillBetween` 5903
- `drawLookOverlays` 5913
- `drawLookSubs` 5925
- `numShort` 5964
- `lookLegend` 5965
- `renderLookCard` 5973
- `lookChanged` 5992
- `openLook` 5997
- `lkSet` 6003
- `lookAct` 6034
- `lookFacts` 6077

**6079** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6082
- `agendaKey` 6083
- `agendaFind` 6084
- `equityNow` 6085
- `freeCash` 6086
- `planBuyQty` 6087
- `agendaChecks` 6092
- `agendaCreate` 6120
- `agendaBrief` 6134
- `agendaGate` 6149
- `agendaDone` 6157
- `winActiveFor` 6158
- `paperBuyNow` 6160
- `agendaExecNow` 6178
- `agendaDecide` 6202
- `agendaExpire` 6216
- `agendaOutcome` 6223
- `agendaHistLine` 6228
- `renderAgenda` 6233
- `agendaFacts` 6304

**6314** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6315
- `applyExternalReply` 6325

**6356** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6362
- `idxPct` 6363
- `loadMarketQuotes` 6364
- `renderIdxBar` 6371
- `renderIndexTab` 6382
- `renderIndexToolbar` 6391
- `idxEnter` 6400
- `idxExit` 6421
- `marketFacts` 6432

**6436** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6439
- `invLevOf` 6440
- `invHeld` 6441
- `invDecision` 6443
- `invEvaluate` 6461
- `invExec` 6475
- `invBacktest` 6489
- `invBtLine` 6524
- `renderInv` 6526
- `invFacts` 6570
- `invChecks` 6583

**6602** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6603
- `renderManage` 6614
- `manageFacts` 6631
- `chatSend` 6635
- `convoNext` 6658
- `convoToggle` 6664
- `voiceSel` 6680
- `stopSpeaking` 6682
- `speechChunks` 6689
- `pcmToWavBlob` 6696
- `audioBlob` 6704
- `speakText` 6709
- `browserSpeak` 6743
- `micToggle` 6757
- `silenceMs` 6766
- `endWait` 6771
- `startSR` 6779
- `startRecorder` 6830

**6902** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 6910
- `mlpForward` 6915
- `aucOf` 6920
- `trainStyle` 6928
- `retrainStyle` 6979
- `predictWin` 6992
- `predictBin` 6999
- `styleProfile` 7006
- `renderStyle` 7015

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,829줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/market/index`, `/market/quotes`, `/news`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

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
- `ai_available` 478
- `_ask_claude` 487
- `_ask_gemini` 521
- `gemini_tts` 601
- `gemini_models` 652
- `_clean_history` 668
- `_claude_msgs` 685
- `_ask` 689
- `ai_brief` 697
- `ai_test` 710
- `ai_ask` 844
- `demo_daily` 870
- `_hash01` 902
- `demo_chart` 910
- `Hub` 965
- `_tick_size` 1004
- `_tick_msg` 1011
- `_book_msg` 1021
- `Realtime` 1030
- `DemoRealtime` 1211
- `_state_path` 1264
- `state_read` 1278
- `state_write` 1287
- `state_backup` 1308
- `trade_available` 1340
- `acct_mask` 1344
- `_day_used` 1348
- `_day_add` 1357
- `nh_trade_post` 1374
- `_msg` 1394
- `_block` 1401
- `trade_check_acct` 1406
- `trade_status` 1428
- `trade_log` 1437
- `trade_order` 1443
- `trade_cancel` 1499
- `trade_balance` 1515
- `trade_orders` 1536
- `Handler` 1555
- `ExclusiveServer` 1762
- `hidden_input` 1773
- `main` 1794
