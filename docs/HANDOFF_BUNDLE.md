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

- 전략 기본값: 모든 BB200 상단 돌파 즉시(1차 50%·2차 50%), 종가 5일선 이탈 매도, 복리 배분(평가자산 ÷ 최대 5종목), 결재제 켜짐, 일봉 3000개 저장.
- 옵션(기본 꺼짐): 200일 스퀴즈 돌파만, 장대양봉 대기(눌림 반등·전고점 돌파 때 매수), 5일선 2일 확인 매수. 백테스트 탭 '내 매매 규칙' 칸의 비교 버튼으로 나란히 비교.
- 아직 실제로 확인 못 한 것: 장중 15:00~15:20 결재→체결 흐름, 실제 AI 리스크 브리핑, 나무 모의서버 주문 시험(`--ask --trade`로 모의서버 선택 후 사용자와 함께).
- 사용자 요청 이력과 전략 검증 수치는 `docs/STRATEGY.md`.


---

# 매매 전략과 검증 결과

## 기본 전략 (BB200 일봉)

- **진입**: 종가가 볼린저밴드(200일, 2σ) 상단을 처음 넘은 양봉 (`baseBreakout`). 선택: 거래량 ≥ 20일 평균 × N, ADX ≥ N, 사용자 매수 규칙(`rE`).
- **분할**: 1차 w1% · 2차 w2%(눌림 뒤 반등) · 3차 w3%(전고점 돌파). 사용자 현재값 50/50/0.
- **청산**: 손절·목표가 없음. 매수 다음 날부터 종가가 N일선(사용자 현재 5일선) 아래면 매도. 선택: 사용자 매도 규칙(`rX`).
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

## 사용자의 매매 생각 (요청 이력 요약)

- 장기 추세 신호 = 200일 밴드가 하락 뒤 횡보하며 최대로 좁아진 상태에서 상단 돌파(몇 년 매집의 흔적). 다만 절대적이지 않다.
- 장대양봉 돌파는 바로 따라가지 말고 눌림·안정 뒤 매수(N자). 대기 뒤 그 고점을 강하게 넘는 봉에서는 산다.
- 돌파 뒤 5일선 안착이 중요하다고 본다(옵션으로 넣고 비교 중).
- 수익률 글자: 이익 빨강, 손실 파랑(한국식).
- 계좌는 포트폴리오 복리 운용. 최종 매수·매도 결정은 항상 본인(결재제).


---

# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 6,977줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.24 · 2026-10-28 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**341** · 1. 설정 · 상태
- `tfInfo` 430
- `applySynced` 464
- `loadStore` 479
- `loadToken` 496
- `saveToken` 497
- `saveStore` 498
- `bgRun` 511
- `bgWorker` 512
- `bgEvery` 513

**516** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 518
- `hmToMin` 529
- `marketOpenNow` 530
- `tickSize` 535
- `tickFloor` 544
- `tickCeil` 545
- `won` 546
- `pct` 547
- `fmtDate` 548
- `nameOf` 549
- `esc` 550
- `toast` 551

**560** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 563
- `db` 575
- `cacheGet` 586
- `cachePut` 592
- `cacheAllDaily` 599
- `modeKey` 616
- `lastFinalClose` 619
- `isStale` 631
- `weekdaysSince` 637
- `fetchDaily` 647
- `isCore` 677
- `applyDaily` 681
- `bucketOf` 688
- `aggregateDaily` 694
- `chartWant` 708
- `fetchChart` 709

**738** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 740
- `priceBroken` 772
- `baseBreakout` 777
- `isSqueeze` 788
- `isLongCandle` 808
- `waitOk` 819
- `waitBase` 826
- `waitFrom` 827
- `above5` 839
- `isBreakout` 840
- `reBreakFrom` 846
- `rawSignal` 861
- `entryLabel` 869
- `rawLabel` 873

**879** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 884
- `costBuy` 885
- `costSell` 886
- `newSeq` 888
- `seqBuy` 894
- `seqSellAll` 907
- `maN` 916
- `stepSeq` 922
- `seqResult` 953
- `rankScore` 961

**967** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 969

**1054** · 7. 종목 목록
- `marketCodes` 1057
- `screenPass` 1064
- `universeCodes` 1073
- `rowInfo` 1085
- `renderSymbols` 1100
- `renderScrBar` 1140

**1149** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1154
- `chartBars` 1157
- `setChart` 1163
- `loadChart` 1171
- `chartGeom` 1223
- `axisTag` 1232
- `drawChart` 1241
- `drawChartNow` 1246
- `renderTfBar` 1436
- `updateBarCount` 1441
- `renderChartHeader` 1445
- `selectCode` 1466
- `setTf` 1479
- `rightPad` 1487
- `setViewEnd` 1488
- `curEnd` 1498
- `stopGlide` 1499
- `zoom` 1565
- `pan` 1576

**1585** · 9. 백테스트 패널
- `recomputeAll` 1587
- `runBt` 1593
- `renderBt` 1600
- `drawEquity` 1633

**1656** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1658
- `plog` 1662
- `lastPrice` 1667

**1674** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1678
- `sessionDate` 1687
- `buyRate` 1694
- `sellRate` 1695
- `manualValue` 1696
- `reservedCash` 1697
- `reservedQty` 1698
- `strategyReserve` 1700
- `buyingPower` 1701
- `sellable` 1702
- `liveQuote` 1704
- `fillBuy` 1711
- `fillSell` 1728
- `submitOrder` 1751
- `cancelOrder` 1787
- `matchOrders` 1795
- `expireOrders` 1811
- `orderWatchTick` 1820

**1834** · ---- 주문창
- `ticketSync` 1837
- `renderTicket` 1847
- `ticketPct` 1873
- `stepPrice` 1881
- `withTodayBar` 1890
- `refreshQuotes` 1901
- `paperExit` 1916
- `paperDecide` 1930
- `renderPaper` 2016
- `scheduler` 2078

**2102** · 11. 설정 패널
- `renderSettings` 2104
- `readSettings` 2118

**2143** · 12. 이벤트 · 초기화
- `setTab` 2145
- `applyPanes` 2155
- `bindResizer` 2167
- `openHolding` 2214
- `sellNow` 2222
- `renderHoldInfo` 2242
- `toggleWatch` 2297
- `setMaster` 2309
- `loadMaster` 2317
- `searchMatches` 2327
- `renderSearch` 2355
- `openFromSearch` 2363
- `connectBridge` 2395
- `loadSaved` 2439
- `syncData` 2457
- `liveTick` 2511

**2552** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2557
- `rtStop` 2563
- `rtLoop` 2568
- `rtWanted` 2596
- `rtSubscribe` 2603
- `rtMsg` 2616
- `applyTick` 2623
- `updateMinuteBar` 2656
- `renderRtBadge` 2670
- `prevClose` 2682
- `chgTag` 2688
- `renderBook` 2689

**2742** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2747
- `sync` 2754
- `saveSync` 2761
- `syncPayload` 2764
- `hasActivity` 2767
- `syncHash` 2772
- `syncMark` 2779
- `applyRemote` 2786
- `syncPush` 2798
- `syncPull` 2820
- `renderSync` 2844

**2876** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2885
- `sgn` 2909
- `pctTxt` 2910
- `evidenceAt` 2913
- `computeResearch` 2968
- `refreshResearch` 2999
- `regimeChip` 3008
- `researchChart` 3013
- `renderResearch0` 3024
- `renderResearch` 3072

**3080** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3123
- `setSectors` 3130
- `loadSectors` 3135
- `sectorOf` 3143
- `scenarioCodes` 3205

**3207** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3208
- `aboveMa` 3214
- `median` 3222
- `avg` 3223
- `sectorStats` 3225

**3243** · ---- 뉴스
- `getNews` 3245
- `agoTxt` 3252
- `newsList` 3253

**3257** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3259
- `loadScenarioNews` 3269

**3279** · ---- 화면
- `chg` 3281
- `heat` 3282
- `stockLink` 3283
- `renderSectorTab` 3285
- `renderSectorDetail` 3307
- `renderScenarioTab` 3323
- `renderNewsTab` 3350
- `renderCenter` 3358
- `openCenter` 3372
- `runNews` 3381
- `fetchSector` 3389

**3446** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3457
- `liveBar` 3469
- `winRange` 3475
- `winLog` 3478
- `winScan` 3483
- `winEvaluate` 3500
- `winStep` 3523
- `winFinish` 3587
- `windowTick` 3608
- `renderWindow` 3629
- `loadMoreBars` 3637

**3643** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3649
- `briefFacts` 3667
- `loadAi` 3688
- `renderBriefTab` 3702

**3746** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3750
- `saveAiCfg` 3756
- `aiReady` 3760
- `aiPayload` 3763
- `renderAiBox` 3766
- `modelKind` 3781
- `readAiBox` 3787

**3846** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3851
- `pushFeed` 3852
- `aiAuto` 3857
- `askAi` 3858

**3864** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3865
- `entryCtx` 3880

**3885** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3895
- `btTrades` 3925
- `myTrades` 3938
- `journal` 3941
- `statLine` 3948

**3958** · ---- 주문 전 실수 방지 점검
- `guardCheck` 3959
- `showGuard` 4003
- `guardedSubmit` 4019

**4025** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4026
- `briefLines` 4053
- `assistOnSelect` 4066

**4083** · ---- 체결 직후 코멘트
- `assistOnTrade` 4084

**4099** · ---- 화면
- `renderAssistStrip` 4100
- `tableOf` 4107
- `renderAssist` 4119
- `foldOpen` 4150
- `fold` 4151
- `runAsk` 4184
- `calDays` 4202

**4208** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4213
- `marketRadarFacts` 4215
- `assistFacts` 4232
- `renderChat` 4250

**4264** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4265
- `grabActs` 4276
- `splitActions` 4291
- `plainSay` 4309
- `describeAct` 4313
- `findCode` 4335
- `confirmAct` 4344
- `runAction` 4359
- `settingAct` 4451
- `orderAct` 4475
- `runActions` 4489

**4499** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4503
- `saveCustom` 4507
- `safeId` 4510
- `attr` 4511
- `splitBlocks` 4513
- `applyBlocks` 4521
- `applyCss` 4549
- `calcInd` 4562
- `drawCustomInd` 4571
- `jsonSafe` 4616
- `widgetData` 4617
- `renderWidgets` 4648
- `renderCustomBox` 4687
- `customFacts` 4709

**4717** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4720
- `realConfirm` 4729
- `realSubmit` 4747
- `realCancel` 4778
- `realArm` 4784
- `realKill` 4794
- `renderReal` 4799
- `realFacts` 4835

**4841** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4844
- `setRangeMode` 4849
- `analyzeRange` 4857
- `similarSpots` 4886
- `startRange` 4911
- `endRange` 4918
- `openRangeCard` 4928
- `renderRangeCard` 4934
- `rangeFacts` 4957
- `saveMark` 4963
- `drawRanges` 4997
- `openMark` 5036
- `marksFacts` 5043
- `marksFold` 5048
- `verTxt` 5063
- `checkPageVersion` 5067

**5087** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5106
- `runRule` 5109
- `computeRules` 5119
- `dataSig` 5134
- `ruleTick` 5136
- `exitSignal` 5141
- `btBrief` 5148
- `btDiff` 5149
- `selSignals` 5155
- `setRule` 5162
- `renderRules` 5172
- `rulesFacts` 5203
- `drawStrategyMarks` 5208

**5236** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5239
- `saveAlertCfg` 5240
- `alertSeen` 5241
- `alertOnce` 5242
- `raiseAlert` 5249
- `flushSay` 5258
- `showAlertCard` 5265
- `hm2min` 5277
- `alertTick` 5279
- `realFillCheck` 5318
- `renderAlertBtn` 5327

**5340** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5341
- `backtestWithRule` 5354
- `halfStats` 5371
- `setLabel` 5390
- `compareVariants` 5392
- `variantsFrom` 5422
- `runCompare` 5427
- `tableHtml` 5437

**5438** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5452
- `markIndex` 5453
- `roundT` 5462
- `extractRule` 5463
- `runExtract` 5512
- `extractFacts` 5542

**5543** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5545
- `importRecords` 5555

**5576** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5577

**5614** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5616
- `drawAct` 5617
- `drawClearAct` 5636
- `drawUserDraw` 5643
- `drawLegend` 5671
- `drawFacts` 5676

**5678** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5680
- `journalAdd` 5681
- `journalWhyAct` 5695
- `journalFold` 5703
- `journalFacts` 5730

**5742** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5745
- `cl` 5756
- `indDef` 5815
- `indLabel` 5816
- `clone` 5819
- `normalizeLook` 5820
- `lookSubs` 5834
- `lookSeries` 5837
- `strokeSeries` 5845
- `fillBetween` 5852
- `drawLookOverlays` 5862
- `drawLookSubs` 5874
- `numShort` 5913
- `lookLegend` 5914
- `renderLookCard` 5922
- `lookChanged` 5941
- `openLook` 5946
- `lkSet` 5952
- `lookAct` 5983
- `lookFacts` 6026

**6028** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6031
- `agendaKey` 6032
- `agendaFind` 6033
- `equityNow` 6034
- `freeCash` 6035
- `planBuyQty` 6036
- `agendaChecks` 6041
- `agendaCreate` 6069
- `agendaBrief` 6083
- `agendaGate` 6098
- `agendaDone` 6106
- `winActiveFor` 6107
- `paperBuyNow` 6109
- `agendaExecNow` 6127
- `agendaDecide` 6151
- `agendaExpire` 6165
- `agendaOutcome` 6172
- `agendaHistLine` 6177
- `renderAgenda` 6182
- `agendaFacts` 6253

**6263** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6264
- `applyExternalReply` 6274

**6305** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6311
- `idxPct` 6312
- `loadMarketQuotes` 6313
- `renderIdxBar` 6320
- `renderIndexTab` 6331
- `renderIndexToolbar` 6340
- `idxEnter` 6349
- `idxExit` 6370
- `marketFacts` 6381

**6385** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6388
- `invLevOf` 6389
- `invHeld` 6390
- `invDecision` 6392
- `invEvaluate` 6410
- `invExec` 6424
- `invBacktest` 6438
- `invBtLine` 6473
- `renderInv` 6475
- `invFacts` 6519
- `invChecks` 6532
- `chatSend` 6551
- `convoNext` 6574
- `convoToggle` 6580
- `voiceSel` 6596
- `stopSpeaking` 6598
- `speechChunks` 6605
- `pcmToWavBlob` 6612
- `audioBlob` 6620
- `speakText` 6625
- `browserSpeak` 6659
- `micToggle` 6673
- `silenceMs` 6682
- `endWait` 6687
- `startSR` 6695
- `startRecorder` 6746

**6818** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 6826
- `mlpForward` 6831
- `aucOf` 6836
- `trainStyle` 6844
- `retrainStyle` 6895
- `predictWin` 6908
- `predictBin` 6915
- `styleProfile` 6922
- `renderStyle` 6931

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,828줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

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
- `ai_ask` 843
- `demo_daily` 869
- `_hash01` 901
- `demo_chart` 909
- `Hub` 964
- `_tick_size` 1003
- `_tick_msg` 1010
- `_book_msg` 1020
- `Realtime` 1029
- `DemoRealtime` 1210
- `_state_path` 1263
- `state_read` 1277
- `state_write` 1286
- `state_backup` 1307
- `trade_available` 1339
- `acct_mask` 1343
- `_day_used` 1347
- `_day_add` 1356
- `nh_trade_post` 1373
- `_msg` 1393
- `_block` 1400
- `trade_check_acct` 1405
- `trade_status` 1427
- `trade_log` 1436
- `trade_order` 1442
- `trade_cancel` 1498
- `trade_balance` 1514
- `trade_orders` 1535
- `Handler` 1554
- `ExclusiveServer` 1761
- `hidden_input` 1772
- `main` 1793
