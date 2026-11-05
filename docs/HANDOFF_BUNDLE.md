# 파르티잔 개발 안내 — 2세대 대응 워크스페이스

## 1. 현재 구조

사용자가 2026-11-05에 전체 UI·전략 재작성과 불필요 기능 정리를 요청했다. 현재 기본 화면은 `partisan_investment.html`이다. 이후 전체 시장 조건검색과 애플 스타일 HTS, 기존 증권사 주문 기능의 새 화면 연결 요청을 반영했다. 예전 단일 파일은 `partisan_legacy.html`에 그대로 보존했다. 이전 안내와 성과 표는 `docs/LEGACY_GUIDE.md`, `docs/STRATEGY.md`의 과거 기록이다. **그 성과를 새 엔진 성과로 인용하지 않는다.**

- `partisan_investment.html`: 새 화면 뼈대, 외부 의존성 없는 클래식 스크립트 로딩.
- `app/engine.js`: 순수 함수 기반 지표·구조 분석·회복/재진입·보유 관리·위험 수량·백테스트. 브라우저/Node 공용.
- `app/chart.js`: Canvas 차트, 인과적인 구간 설명, 봉 선택, 드래그 구간 기록.
- `app/app.js`: 시세 조회, 전체 시장 검색 제어, 독립 모의 장부, 결재, IndexedDB, UI 이벤트.
- `app/screener.js`: 엄격한 진입 신호 후보 추출, 시장·이름·유형 필터와 정렬.
- `app/terminal.js`: 기존 중계기를 통한 계좌·주문 조회, 매번 확인하는 지정가 주문/취소, 주문 허용/정지. 실계좌 자동 주문은 아직 연결하지 않았다.
- `app/cases.js`: 보존된 여섯 참고 설명. 현재 UI에서 로드하지 않는다. 기본 관심종목은 비어 있다.
- `app/worker.js`: 백테스트 전용 Worker.
- `app/style.css`: 반응형 화면. 빌드·CDN 없음.
- `nh_bridge.py`, `nh_bridge_core.py`: 기존 중계기. 이번 재작성에서 변경하지 않았다.

## 2. 실행·검증

기존 실행 파일로 실행하고 `partisan_investment.html`을 연다. Node는 앱 실행에 필요 없다. 시세와 조건검색은 `/health`, `/krx/master`, `/krx/daily`, `/krx/chart`를 호출한다. 주문 · 잔고 화면은 기존 `/trade/status`, `/trade/balance`, `/trade/orders`, `/trade/arm`, `/trade/order`, `/trade/cancel`을 연결한다. `/state/put`은 호출하지 않는다. 전략 감시가 실주문을 보내지는 않는다.

- 새 엔진: `node tests/engine.test.cjs`
- 이전 엔진 보존 확인: `node tools/test_strategy.cjs`
- UI: `npm install` → `npx playwright install chromium` → `npm run test:ui`
- 가상 중계기 결재 흐름: `npm run test:trading`
- 브라우저 테스트는 모든 중계기 응답을 가로채 가짜 응답으로 시험한다. 실제 중계기·계좌를 시험에 쓰지 않는다.
- 테스트 스크린샷은 `work/test-output/`에 저장한다. `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_BROWSERS_PATH` 환경변수로 기존 설치를 사용할 수 있다.
- 조건검색: `npm run test:screener`
- HTS 통합: `npm run test:hts` (모든 증권사 응답을 가로채며 실제 요청 없음)
- 함수 지도: `python tools/make_handoff.py`

## 3. 전략·기록의 의미

5일선 이탈은 점검 시작 신호다. 가격 지지, 고저점 진행, 매도 거래량, 누적 흐름, 분봉 회복 실패를 함께 본다. 작은 봉의 조정/쌍바닥/1~3일 회복은 재진입 후보가 될 수 있지만 기존 지지 구조 붕괴를 무시하지 않는다.

사용자가 보낸 차트의 드래그 날짜는 대략적이다. 종목명·날짜로 신호를 하드코딩하거나 구간 끝의 수익으로 진입 정답을 만들지 않는다. 구간 기록은 진입·보유·대기·회피·청산·참고를 분리한다. 유사 사례는 설명·결재 근거에 반영하지만 학습했다고 승률을 꾸미거나 자동으로 규칙을 바꾸지 않는다.

## 4. 지켜야 할 규칙

1. 증권 앱키·시크릿·계좌번호는 사용자가 기존 실행기에만 입력한다. AI가 읽거나 기록하지 않는다.
2. AI가 실제 주문을 넣지 않는다. 새 주문 화면은 사용자가 직접 사용할 기능이며 개발 검증은 가상 응답만 사용한다. 실주문은 `app/terminal.js`의 확인·지연·최신 시세·한도·비상정지 흐름을 유지한다. 응답 미확인은 자동 재전송하지 않고 재접속 후에도 잠금을 유지한다. 실계좌 무인 자동 주문은 아직 구현되지 않았다.
3. 새 모의매매도 매수·매도 모두 매번 사용자 결재를 거친다. 읽음 확인·이유·1.5초 지연·최신 시세 재검사를 생략하지 않는다. 자동 관찰은 자동 체결이 아니다.
4. 토큰은 새 화면 메모리에만 둔다. 저장·내보내기·로그·git에 토큰이나 키를 넣지 않는다.
5. 기존 `krx_state.json`, 기존 localStorage 계좌·설정, 기존 서버 동기화는 건드리지 않는다. 새 저장소 `partisan.v2.real` / `partisan.v2.demo`를 분리한다. 일봉 캐시 `krx-bars`는 재사용한다.
6. 켜져 있는 사용자 중계기(8766)를 끄거나 재시작하지 않는다. 시험은 가상 응답 또는 별도 데모 포트로만 한다.
7. 새 엔진은 인과적으로 계산한다. 확인에 필요한 오른쪽 봉이 아직 없으면 저점을 확정하지 않는다. 분봉 결과를 일봉 백테스트로 검증했다고 하지 않는다.
8. GitHub 저장소는 비공개 유지. 작성자 이메일은 GitHub noreply. 작업을 마치면 검증 후 한국어 커밋·`git push`(main).
9. 화면 버전은 pre-commit 훅이 올린다. 손으로 올리지 않는다.
10. 사용자가 실제 운용 판단을 이해할 수 있도록 한국어로 근거·반대 근거·무효화 가격을 함께 보여준다. 수익이나 특정 패턴의 성공을 보장하지 않는다.

## 5. 구현 원칙

불필요 기능을 다시 얹지 않는다. 새 조건은 공통 엔진·시각화·모의 운용·백테스트의 적용 범위를 명시한다. 기본 규칙을 바꾸기 전에는 가설과 독립 검증을 분리하고 테스트한다. UI는 입력 중인 값을 주기 렌더링으로 지우지 않는다. 실제 시장 데이터가 없는 테스트는 반드시 가상 자료 검증이라고 보고한다.

현재 HTS 안내: `docs/HTS.md`. 과거 문서의 “새 화면 실주문 없음”은 HTS 개편 이전 설명이다.


---

# 파르티잔 HTS — 조건검색과 주문 워크스페이스

## 이번 변경

시작 화면을 전체 시장 조건검색으로 바꿨다. 애플 스타일의 시스템 글꼴, 밝은 회색 바탕, 흰 패널, 파란 주요 버튼을 사용한다. 조건검색 → 차트 → 주문·잔고 순서로 이동하며 전략의 모의 운용 장부는 별도 메뉴에 남긴다.

참고용 여섯 종목은 기본 목록·차트 아래·검증 화면에서 제거했다. 초기 관심종목은 비어 있다. 기존 저장 목록이 여섯 기본 종목뿐이고 기록·보유·거래가 없으면 초기 예시 목록도 정리한다. 사용자 기록이나 보유 내역이 있는 기존 목록은 보존한다.

## 전체 종목 조건검색

1. 상단 **연결**에서 시세 중계기를 연결한다.
2. **조건검색 → 전체 종목 검색**을 실행한다.
3. 결과 안에서 종목명·코드를 검색하거나 코스피/코스닥, 준비된 돌파/회복 재진입으로 필터링한다.
4. 준비 점수, 지지선까지 거리, 거래대금, 분석 기준일을 비교한다.
5. **차트 분석**으로 흐름과 분봉을 확인하거나 **＋**로 관심종목에 넣는다.

전체 시장 마스터의 ETF·ETN 상품 분류와 이름을 함께 확인하고 스팩·리츠·우선주 등에 해당하는 이름도 제외한다. 이름 기준 제외가 일부 포함돼 있어 모든 상품 유형을 정확히 분류한다고 보장하지는 않는다. 일봉 700개씩 순차 조회하며 오류 종목 수와 진행률을 표시한다. 중단하면 이후 응답은 결과에 추가하지 않는다. 재검색은 새 결과 집합으로 시작한다. 실패/중단한 검색을 전체 검색 성공으로 표시하지 않는다.

`signal=true`인 종목만 진입 검토에 넣는다. 준비 점수가 높은 대기 종목을 진입 신호로 승격하지 않는다. 점수는 수익 확률이 아니다. 검색은 일봉 후보 선별이며 분봉 확인 완료나 주문 실행을 뜻하지 않는다. 장중 일봉은 미확정으로 표시하고 과거 날짜의 후보는 최신 확인이 필요하다고 표시한다.

결과와 검색 조건은 브라우저에 저장한다. 설정을 변경하면 재검색 필요 표시가 나온다. 저장 시세 검색은 해당 브라우저에 저장된 자료 범위에서만 검색하며 전체 시장을 조회했다고 표시하지 않는다. 시세 모드별로 결과가 분리된다. 결과는 50개씩 표시한다.

## 실제 주문 연결

맥에서 주문 기능을 사용하려면 터미널에서 프로그램 폴더의 실행기를 다음과 같이 실행한다.

```bash
bash ~/Downloads/krx-bb200-main/맥에서_실행.command --trade
```

앱키·시크릿·계좌·주문 서버·한도는 기존 실행기에 직접 입력한다. 이미 실행 중인 중계기를 이 개발 작업에서 종료하거나 재시작하지 않았다.

**주문 · 잔고**에서 서버(실전/증권사 모의/데모), 마스킹된 계좌, 주문 허용 여부, 주문 가능 금액, 잔고, 당일 주문과 미체결을 확인한다. 열려 있는 주문 화면은 30초마다 조회하며 새 주문 전에도 다시 조회한다. 연결만 했다고 주문을 허용하지 않는다.

차트의 **증권사 주문창으로**를 누르면 선택 종목과 기준 가격을 채운다. 수량과 지정가는 직접 검토한다. 현재 주문 유형은 지정가이다. 호가 단위는 증권사가 검증하며 자동으로 가격을 반올림하지 않는다. 주문 허용과 실제 주문·미체결 취소는 각각 확인창을 거친다. 실제 주문은 정규장 최신 시세, 주문 한도, 주문 가능 금액 또는 미체결 매도를 뺀 보유 수량을 검사한다.

주문 접수와 체결은 구분한다. 주문이 접수돼도 미체결일 수 있다. 실패·응답 없음은 자동 재전송하지 않는다. 주문 응답 미확인 잠금은 같은 브라우저에서 새로고침해도 유지되며, 증권사 주문내역을 대조한 후 직접 해제해야 한다. 이 잠금은 다른 기기까지 공유되는 서버 측 멱등성 장치가 아니다.

상단 또는 확인창의 **주문 정지**는 전략 감시를 멈추고 중계기에 신규 주문 정지를 요청한다. 서버 응답을 받지 못하면 정지 미확인으로 표시한다. 이미 접수된 미체결 주문은 별도로 취소해야 한다.

## 자동매매 범위

실계좌 주문 경로는 연결했지만 **무인 자동 주문 엔진은 아직 연결하지 않았다**. 전략운용 메뉴의 자동 관찰은 모의 대응 안건을 만들며, 실제 계좌로 자동 주문을 보내지 않는다. 기존 중계기 역시 전략을 지속 실행하는 서버가 아니다.

실전 자동 운용을 완성하려면 서버 상주 전략 실행, 서버 측 주문 멱등성, 부분 체결·재접속 대사, 계좌 위험 예산을 실제 체결과 연결하는 작업이 필요하다. 브라우저의 관찰 타이머를 실전 자동매매 엔진이라고 표시하지 않는다.

## 검증

- 기존 새 엔진 18개 및 이전 엔진 18개 테스트 유지.
- 조건검색: 엄격한 신호, 미래 봉 제외, 장중 표시, 상품 이름 제외, 필터·정렬.
- UI: 시세 가져오기, 구간 기록, 검증 Worker, 설정 저장, 반응형 화면.
- HTS 통합: 전체 시장 검색, 실패 집계, 중단 후 응답 무시, 결과 저장, 차트에서 주문창 이동, 확인 전 주문 없음, 한도 초과/오래된 시세 차단, 주문·취소, 응답 미확인 잠금과 새로고침, 확인창에서 정지.
- 모든 증권사 응답을 가로챈 가상 중계기로 검증했다. 실제 계좌 주문·체결이나 수익성은 검증하지 않았다.

실행: `npm run test:screener`, `npm run test:hts`, `npm run test:ui`, `npm run test:trading`. Playwright 설치가 필요하다. 앱 실행 자체에는 Node나 빌드가 필요 없다.


---

# 코드 지도 (자동 생성)

생성: `python tools/make_handoff.py`. 현재 UI와 보존된 이전 UI를 구분한다.

## partisan_investment.html

36줄


## app/engine.js

202줄

- `normalize`: 11
- `indicators`: 19
- `context`: 38
- `recovery`: 71
- `analyze`: 89
- `segments`: 119
- `timeline`: 120
- `createPosition`: 121
- `manage`: 126
- `minuteAnalysis`: 148
- `sizeOrder`: 159
- `backtest`: 169
- `similarity`: 197

## app/app.js

240줄

- `now`: 10
- `notify`: 11
- `name`: 12
- `save`: 13
- `load`: 14
- `log`: 21
- `db`: 22
- `cached`: 23
- `cache`: 24
- `bridge`: 26
- `installData`: 28
- `loadCode`: 35
- `loadMinutes`: 39
- `minuteEvidence`: 40
- `price`: 41
- `equity`: 42
- `activeAnalysis`: 43
- `currentAnalysis`: 44
- `entryCandidate`: 45
- `phaseBadge`: 50
- `renderWatch`: 51
- `renderChart`: 54
- `renderFlow`: 56
- `renderDecision`: 57
- `showMinuteSelection`: 72
- `select`: 73
- `page`: 74
- `getFreshQuote`: 75
- `inspect`: 77
- `addAgenda`: 78
- `evaluateCode`: 79
- `evaluateAll`: 94
- `renderPortfolio`: 95
- `openApproval`: 101
- `updateApproval`: 103
- `executeApproval`: 104
- `openAnnotation`: 112
- `renderLab`: 113
- `settingsDialog`: 117
- `refreshWatch`: 119
- `setMaster`: 120
- `runResearch`: 121
- `download`: 128
- `sanitizeNote`: 129
- `importFile`: 130
- `connectDialog`: 135
- `loadScreener`: 192
- `saveScreener`: 193
- `renderScreener`: 194
- `cachedUniverse`: 204
- `scanMarket`: 205
- `clockTick`: 232
- `init`: 235

## app/chart.js

59줄

- `FlowChart`: 2

## app/worker.js

3줄


## app/screener.js

26줄

- `marketKey`: 4
- `universe`: 5
- `inspect`: 8
- `filter`: 19

## app/terminal.js

119줄

- `render`: 8
- `refresh`: 21
- `confirm`: 36
- `updateConfirm`: 42
- `validate`: 43
- `review`: 57
- `submit`: 63
- `stop`: 94
- `prepare`: 100
- `amount`: 103
- `reset`: 104

## app/cases.js

8줄


## app/style.css

9줄


## nh_bridge_core.py

2,042줄

- `_load_token`: 40
- `origin_allowed`: 73
- `_throttle`: 84
- `access_token`: 93
- `token_invalidate`: 117
- `nh_post`: 131
- `_num`: 156
- `_period_rows`: 167
- `_bars`: 181
- `nh_chart`: 193
- `nh_daily`: 203
- `nh_components`: 221
- `_krx_finder`: 251
- `krx_master`: 260
- `krx_caps`: 311
- `krx_sectors`: 367
- `_yahoo_chart`: 422
- `market_index`: 429
- `market_quotes`: 462
- `news_search`: 487
- `news_top`: 522
- `_tg_token_ok`: 552
- `_tg_call`: 557
- `telegram_send`: 575
- `telegram_chat`: 583
- `_tg_poll`: 599
- `tg_start`: 628
- `tg_stop`: 642
- `ai_available`: 670
- `_ask_claude`: 679
- `_ask_gemini`: 713
- `gemini_tts`: 793
- `gemini_models`: 844
- `_clean_history`: 860
- `_claude_msgs`: 877
- `_ask`: 881
- `ai_brief`: 889
- `ai_test`: 902
- `ai_ask`: 1043
- `demo_daily`: 1069
- `_hash01`: 1101
- `demo_chart`: 1109
- `px`: 1134
- `Hub`: 1164
- `__init__`: 1167
- `add`: 1172
- `remove`: 1179
- `publish`: 1184
- `_tick_size`: 1203
- `_tick_msg`: 1210
- `_book_msg`: 1220
- `Realtime`: 1229
- `__init__`: 1233
- `set_targets`: 1243
- `_connect`: 1253
- `_send_frame`: 1272
- `_fill`: 1286
- `_read_frame`: 1303
- `_reg`: 1328
- `_sync`: 1333
- `_handle`: 1343
- `run`: 1357
- `DemoRealtime`: 1410
- `__init__`: 1414
- `set_targets`: 1419
- `run`: 1424
- `_state_path`: 1463
- `state_read`: 1477
- `state_write`: 1486
- `state_backup`: 1507
- `trade_available`: 1539
- `acct_mask`: 1543
- `_day_used`: 1547
- `_day_add`: 1556
- `nh_trade_post`: 1573
- `_msg`: 1593
- `_block`: 1600
- `trade_check_acct`: 1605
- `trade_status`: 1627
- `trade_log`: 1636
- `trade_order`: 1642
- `trade_cancel`: 1698
- `trade_balance`: 1714
- `trade_orders`: 1735
- `Handler`: 1754
- `_cors`: 1755
- `_json`: 1764
- `_guard`: 1773
- `do_OPTIONS`: 1782
- `do_GET`: 1787
- `_stream`: 1798
- `do_POST`: 1819
- `log_message`: 1969
- `ExclusiveServer`: 1973
- `server_bind`: 1977
- `hidden_input`: 1984
- `main`: 2005

## 이전 버전

`partisan_legacy.html` 및 `docs/LEGACY_GUIDE.md`는 이전 구현이다. 이전 성과를 새 전략 성과로 해석하지 않는다.
