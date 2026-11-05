# 파르티잔 개발 안내 — 2세대 대응 워크스페이스

## 1. 현재 구조

사용자가 2026-11-05에 전체 UI·전략 재작성과 불필요 기능 정리를 요청했다. 현재 기본 화면은 `partisan_investment.html`이다. 예전 단일 파일은 `partisan_legacy.html`에 그대로 보존했다. 이전 안내와 성과 표는 `docs/LEGACY_GUIDE.md`, `docs/STRATEGY.md`의 과거 기록이다. **그 성과를 새 엔진 성과로 인용하지 않는다.**

- `partisan_investment.html`: 새 화면 뼈대, 외부 의존성 없는 클래식 스크립트 로딩.
- `app/engine.js`: 순수 함수 기반 지표·구조 분석·회복/재진입·보유 관리·위험 수량·백테스트. 브라우저/Node 공용.
- `app/chart.js`: Canvas 차트, 인과적인 구간 설명, 봉 선택, 드래그 구간 기록.
- `app/app.js`: 시세 조회, 독립 모의 장부, 결재, IndexedDB, UI 이벤트.
- `app/cases.js`: 사용자의 여섯 사례 설명과 **대략적인 참고 범위**. 매매 정답/성과 검증 세트가 아니다.
- `app/worker.js`: 백테스트 전용 Worker.
- `app/style.css`: 반응형 화면. 빌드·CDN 없음.
- `nh_bridge.py`, `nh_bridge_core.py`: 기존 중계기. 이번 재작성에서 변경하지 않았다.

## 2. 실행·검증

기존 실행 파일로 실행하고 `partisan_investment.html`을 연다. Node는 앱 실행에 필요 없다. 새 화면은 `/health`, `/krx/master`, `/krx/daily`, `/krx/chart`만 호출하며 `/trade/*`와 `/state/put`은 호출하지 않는다.

- 새 엔진: `node tests/engine.test.cjs`
- 이전 엔진 보존 확인: `node tools/test_strategy.cjs`
- UI: `npm install` → `npx playwright install chromium` → `npm run test:ui`
- 가상 중계기 결재 흐름: `npm run test:trading`
- 브라우저 테스트는 모든 중계기 응답을 가로채 가짜 응답으로 시험한다. 실제 중계기·계좌를 시험에 쓰지 않는다.
- 테스트 스크린샷은 `work/test-output/`에 저장한다. `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_BROWSERS_PATH` 환경변수로 기존 설치를 사용할 수 있다.
- 함수 지도: `python tools/make_handoff.py`

## 3. 전략·기록의 의미

5일선 이탈은 점검 시작 신호다. 가격 지지, 고저점 진행, 매도 거래량, 누적 흐름, 분봉 회복 실패를 함께 본다. 작은 봉의 조정/쌍바닥/1~3일 회복은 재진입 후보가 될 수 있지만 기존 지지 구조 붕괴를 무시하지 않는다.

사용자가 보낸 차트의 드래그 날짜는 대략적이다. 종목명·날짜로 신호를 하드코딩하거나 구간 끝의 수익으로 진입 정답을 만들지 않는다. 구간 기록은 진입·보유·대기·회피·청산·참고를 분리한다. 유사 사례는 설명·결재 근거에 반영하지만 학습했다고 승률을 꾸미거나 자동으로 규칙을 바꾸지 않는다.

## 4. 지켜야 할 규칙

1. 증권 앱키·시크릿·계좌번호는 사용자가 기존 실행기에만 입력한다. AI가 읽거나 기록하지 않는다.
2. AI가 실제 주문을 넣지 않는다. 새 화면에는 실계좌 주문 기능이 없다. 기존 버전의 실계좌 주문은 `realSubmit`의 사용자 확인·지연·중계기 한도·비상정지 흐름을 유지한다.
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


---

# 새 대응 워크스페이스 사용법

기존 실행기로 실행한 뒤 같은 `partisan_investment.html`을 열고 새로고침한다. 기본 화면을 분석 워크스페이스 / 포트폴리오 / 검증·학습으로 재구성했다. 이전 화면은 설정의 이전 버전 링크에서 열 수 있다. 기존 계좌·설정은 보존하며 새 화면은 별도 모의 장부를 사용한다.

## 차트 읽기

시세를 연결하거나 JSON 시세 자료를 가져온다. 일봉 위의 색상 구간과 설명은 수축·대기·준비된 돌파·보유·조정·약화·구조 붕괴를 구분한다. 봉을 클릭하면 그 날짜까지 알려진 정보로 해석한다. 과거 봉에서는 주문할 수 없다. 장중 일봉은 미완성 판단으로 표시한다. 5분봉 버튼으로 실제 확보된 분봉을 확인한다. 자료가 없거나 오래되면 확인 불가로 표시한다.

신호 하나보다 이전 고점, 고점 이후 가격 유지, 작은 봉의 밀집, 거래량 흐름과 지지선을 함께 본다. 가격·거래량으로 매집을 확정할 수 없으므로 화면 근거는 관측 지표에 기반한 가설이다.

## 5일선 이탈과 재진입

5일선 이탈만으로 청산하지 않는다. 거래량이 줄고 지지가 유지되는 작은 봉은 조정으로 분류한다. 반면 고저점 하락, 매도 거래량 증가, 누적 흐름 약화, 돌파 가격 및 20일선 회복 실패가 겹치면 청산을 검토한다. 구조적 지지선이 깨지면 회복을 무기한 기다리지 않는다.

최근 준비된 돌파 이후 1~3일 안에 5일선을 회복하거나, 작은 봉의 쌍바닥 뒤 이전 봉 고점과 5일선을 되찾으면 재진입 후보가 된다. 최초 지지 구조가 이미 무너졌으면 같은 회복 시나리오로 재진입하지 않는다. 재매수는 현재 가격과 지지선으로 수량을 새로 계산한다. 같은 날 매도·재매수 반복은 막는다.

장중 신규 진입은 최신 시세와 완료된 5분봉 회복 근거가 필요하다. 분봉의 고저점·VWAP·회복 실패를 일봉 구조와 함께 사용한다. 일봉 백테스트는 이 분봉 운용을 재현하지 않는다.

## 여섯 사례의 적용

- 하나마이크론: 이전 거래량 시도 뒤 가격 유지와 재돌파를 우선 분석한다.
- 차바이오텍: 장대봉 이후 정상 조정을 5일선 단독 손절과 구분한다.
- 아이쓰리시스템: 처음 상단에 닿았다는 이유만으로 진입하지 않고 준비 과정을 본다.
- F&F: 작은 봉이어도 고저점과 자금 흐름이 약해지는지 확인한다.
- 넷마블: 큰 거래량과 상단 돌파만으로 충분한 준비가 됐다고 보지 않는다.
- 삼성전자: 평소 수준의 거래량이어도 가격 유지와 추세 준비가 충족되는지 본다.

이름별 예외 규칙은 없다. 제공된 날짜는 대략적 참고 구간이며 진입·청산 정답으로 사용하지 않았다. 실제 여섯 종목 원시 시세로 성과를 재검증한 상태는 아니다.

## 위험과 모의 운용

손절 거리 지수는 지지선까지의 가격 거리 표시이며 성공 확률이 아니다. 수량은 매수 가격, 지지선, 비용, 종목당 위험, 전체 잔여 위험, 보유 한도로 계산한다. 기본값은 초기 가설이며 설정에서 조정한다. 갭·유동성 때문에 실제 손실은 계산된 거리보다 커질 수 있다.

자동 관찰은 안건을 만들 뿐 체결하지 않는다. 모의 매수와 매도 모두 읽음 확인·이유 입력·대기·최신 시세 재검사를 거친다. 새 화면에는 실계좌 주문 기능이 없다. 중계기는 시세 조회 용도로만 사용한다. 토큰은 메모리에만 유지한다.

## 구간 기록과 학습 범위

Shift를 누르고 차트를 드래그하면 진입 선호 / 보유 유지 / 대기 / 회피 / 청산 검토 / 참고 구간을 따로 기록할 수 있다. 비슷한 과거 상황을 찾아 판단 근거에 표시한다. 현재 구현은 사례 기록과 유사도 비교이며, 사용자 기록만으로 자동으로 전략 규칙을 변경하는 학습 모델은 아니다. 기록을 추가했다고 검증되지 않은 승률을 표시하지 않는다.

## 검증과 최적화

새 엔진 18개 테스트: 미래 자료 불변성, 준비된 돌파, 거래량 단독 오판 방지, 조정 유지·구조 손절, 회복·쌍바닥 재진입, 위험 예산, 다음 시가 체결 등을 검증한다. 기존 엔진 18개 회귀 테스트도 보존한다. 별도 브라우저 테스트는 가져오기·기록·반응형 화면·백테스트·결재를 가상 자료와 가상 중계기로 검증한다.

Canvas로 차트를 그리고 백테스트는 Worker로 분리했다. 외부 CDN과 실행용 패키지 설치가 필요 없는 모듈 구조다. 전 종목 검색은 순차 조회하고 중지할 수 있다. 실제 시장에서의 수익 개선·휩소 감소는 아직 입증되지 않았다. 다음 검증은 실제 일봉 및 과거 분봉의 확보, 기간 분리 검증, 거래 비용·갭·체결 가능성 점검이다.


---

# 코드 지도 (자동 생성)

생성: `python tools/make_handoff.py`. 현재 UI와 보존된 이전 UI를 구분한다.

## partisan_investment.html

27줄


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

197줄

- `now`: 10
- `notify`: 11
- `name`: 12
- `save`: 13
- `load`: 14
- `log`: 20
- `db`: 21
- `cached`: 22
- `cache`: 23
- `bridge`: 25
- `installData`: 27
- `loadCode`: 34
- `loadMinutes`: 38
- `minuteEvidence`: 39
- `price`: 40
- `equity`: 41
- `activeAnalysis`: 42
- `currentAnalysis`: 43
- `entryCandidate`: 44
- `phaseBadge`: 49
- `renderWatch`: 50
- `renderChart`: 53
- `renderFlow`: 55
- `renderDecision`: 56
- `showMinuteSelection`: 71
- `select`: 72
- `page`: 73
- `getFreshQuote`: 74
- `inspect`: 76
- `addAgenda`: 77
- `evaluateCode`: 78
- `evaluateAll`: 93
- `renderPortfolio`: 94
- `openApproval`: 100
- `updateApproval`: 102
- `executeApproval`: 103
- `openAnnotation`: 111
- `renderLab`: 112
- `settingsDialog`: 117
- `refreshWatch`: 119
- `scanMarket`: 120
- `setMaster`: 127
- `runResearch`: 128
- `download`: 135
- `sanitizeNote`: 136
- `importFile`: 137
- `connectDialog`: 142
- `clockTick`: 190
- `init`: 192

## app/chart.js

59줄

- `FlowChart`: 2

## app/worker.js

3줄


## app/cases.js

8줄


## app/style.css

1줄


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
