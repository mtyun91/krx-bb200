# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 6,574줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.17 · 2026-10-28 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**327** · 1. 설정 · 상태
- `tfInfo` 404
- `applySynced` 434
- `loadStore` 448
- `loadToken` 465
- `saveToken` 466
- `saveStore` 467
- `bgRun` 480
- `bgWorker` 481
- `bgEvery` 482

**485** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 487
- `hmToMin` 498
- `marketOpenNow` 499
- `tickSize` 504
- `tickFloor` 513
- `tickCeil` 514
- `won` 515
- `pct` 516
- `fmtDate` 517
- `nameOf` 518
- `esc` 519
- `toast` 520

**529** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 532
- `db` 544
- `cacheGet` 555
- `cachePut` 561
- `cacheAllDaily` 568
- `modeKey` 585
- `lastFinalClose` 588
- `isStale` 600
- `weekdaysSince` 606
- `fetchDaily` 616
- `isCore` 646
- `applyDaily` 650
- `bucketOf` 657
- `aggregateDaily` 663
- `chartWant` 677
- `fetchChart` 678

**707** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 709
- `priceBroken` 741
- `baseBreakout` 746
- `isSqueeze` 757
- `isLongCandle` 777
- `waitOk` 788
- `waitBase` 795
- `waitFrom` 796
- `above5` 808
- `isBreakout` 809
- `reBreakFrom` 815
- `rawSignal` 830
- `entryLabel` 838
- `rawLabel` 842

**848** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 853
- `costBuy` 854
- `costSell` 855
- `newSeq` 857
- `seqBuy` 863
- `seqSellAll` 876
- `maN` 885
- `stepSeq` 891
- `seqResult` 922
- `rankScore` 930

**936** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 938

**1023** · 7. 종목 목록
- `marketCodes` 1026
- `screenPass` 1033
- `universeCodes` 1042
- `rowInfo` 1053
- `renderSymbols` 1067
- `renderScrBar` 1102

**1111** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1116
- `chartBars` 1119
- `setChart` 1124
- `loadChart` 1132
- `chartGeom` 1184
- `axisTag` 1193
- `drawChart` 1202
- `drawChartNow` 1207
- `renderTfBar` 1397
- `updateBarCount` 1402
- `renderChartHeader` 1406
- `selectCode` 1427
- `setTf` 1440
- `setViewEnd` 1447
- `curEnd` 1456
- `stopGlide` 1457
- `zoom` 1523
- `pan` 1534

**1543** · 9. 백테스트 패널
- `recomputeAll` 1545
- `runBt` 1551
- `renderBt` 1558
- `drawEquity` 1591

**1614** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1616
- `plog` 1620
- `lastPrice` 1625

**1632** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1636
- `sessionDate` 1645
- `buyRate` 1652
- `sellRate` 1653
- `manualValue` 1654
- `reservedCash` 1655
- `reservedQty` 1656
- `strategyReserve` 1658
- `buyingPower` 1659
- `sellable` 1660
- `liveQuote` 1662
- `fillBuy` 1669
- `fillSell` 1686
- `submitOrder` 1709
- `cancelOrder` 1745
- `matchOrders` 1753
- `expireOrders` 1769
- `orderWatchTick` 1778

**1792** · ---- 주문창
- `ticketSync` 1795
- `renderTicket` 1805
- `ticketPct` 1831
- `stepPrice` 1839
- `withTodayBar` 1848
- `refreshQuotes` 1859
- `paperExit` 1874
- `paperDecide` 1888
- `renderPaper` 1969
- `scheduler` 2031

**2055** · 11. 설정 패널
- `renderSettings` 2057
- `readSettings` 2071

**2096** · 12. 이벤트 · 초기화
- `setTab` 2098
- `applyPanes` 2108
- `openHolding` 2141
- `sellNow` 2149
- `renderHoldInfo` 2169
- `toggleWatch` 2224
- `setMaster` 2236
- `loadMaster` 2244
- `searchMatches` 2254
- `renderSearch` 2282
- `openFromSearch` 2290
- `connectBridge` 2322
- `loadSaved` 2366
- `syncData` 2384
- `liveTick` 2438

**2479** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2484
- `rtStop` 2490
- `rtLoop` 2495
- `rtWanted` 2523
- `rtSubscribe` 2530
- `rtMsg` 2543
- `applyTick` 2550
- `updateMinuteBar` 2583
- `renderRtBadge` 2597
- `prevClose` 2609
- `chgTag` 2615
- `renderBook` 2616

**2669** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2674
- `sync` 2681
- `saveSync` 2688
- `syncPayload` 2691
- `hasActivity` 2694
- `syncHash` 2699
- `syncMark` 2706
- `applyRemote` 2713
- `syncPush` 2725
- `syncPull` 2747
- `renderSync` 2771

**2803** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2812
- `sgn` 2836
- `pctTxt` 2837
- `evidenceAt` 2840
- `computeResearch` 2895
- `refreshResearch` 2926
- `regimeChip` 2935
- `researchChart` 2940
- `renderResearch0` 2951
- `renderResearch` 2999

**3007** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3050
- `setSectors` 3057
- `loadSectors` 3062
- `sectorOf` 3070
- `scenarioCodes` 3132

**3134** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3135
- `aboveMa` 3141
- `median` 3149
- `avg` 3150
- `sectorStats` 3152

**3170** · ---- 뉴스
- `getNews` 3172
- `agoTxt` 3179
- `newsList` 3180

**3184** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3186
- `loadScenarioNews` 3196

**3206** · ---- 화면
- `chg` 3208
- `heat` 3209
- `stockLink` 3210
- `renderSectorTab` 3212
- `renderSectorDetail` 3234
- `renderScenarioTab` 3250
- `renderNewsTab` 3277
- `renderCenter` 3285
- `openCenter` 3297
- `runNews` 3306
- `fetchSector` 3314

**3371** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3382
- `liveBar` 3394
- `winRange` 3400
- `winLog` 3403
- `winScan` 3408
- `winEvaluate` 3425
- `winStep` 3447
- `winFinish` 3511
- `windowTick` 3532
- `renderWindow` 3553
- `loadMoreBars` 3561

**3567** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3573
- `briefFacts` 3591
- `loadAi` 3612
- `renderBriefTab` 3626

**3670** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3674
- `saveAiCfg` 3680
- `aiReady` 3684
- `aiPayload` 3687
- `renderAiBox` 3690
- `modelKind` 3705
- `readAiBox` 3711

**3770** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3775
- `pushFeed` 3776
- `aiAuto` 3781
- `askAi` 3782

**3788** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3789
- `entryCtx` 3804

**3809** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3819
- `btTrades` 3849
- `myTrades` 3862
- `journal` 3865
- `statLine` 3872

**3882** · ---- 주문 전 실수 방지 점검
- `guardCheck` 3883
- `showGuard` 3927
- `guardedSubmit` 3943

**3949** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 3950
- `briefLines` 3972
- `assistOnSelect` 3985

**4002** · ---- 체결 직후 코멘트
- `assistOnTrade` 4003

**4018** · ---- 화면
- `renderAssistStrip` 4019
- `tableOf` 4026
- `renderAssist` 4038
- `foldOpen` 4069
- `fold` 4070
- `runAsk` 4103
- `calDays` 4121

**4127** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4132
- `assistFacts` 4133
- `renderChat` 4150

**4164** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4165
- `grabActs` 4176
- `splitActions` 4191
- `plainSay` 4209
- `describeAct` 4213
- `findCode` 4235
- `confirmAct` 4244
- `runAction` 4259
- `settingAct` 4351
- `orderAct` 4375
- `runActions` 4389

**4399** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4403
- `saveCustom` 4407
- `safeId` 4410
- `attr` 4411
- `splitBlocks` 4413
- `applyBlocks` 4421
- `applyCss` 4449
- `calcInd` 4462
- `drawCustomInd` 4471
- `jsonSafe` 4516
- `widgetData` 4517
- `renderWidgets` 4548
- `renderCustomBox` 4587
- `customFacts` 4609

**4617** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4620
- `realConfirm` 4629
- `realSubmit` 4647
- `realCancel` 4678
- `realArm` 4684
- `realKill` 4694
- `renderReal` 4699
- `realFacts` 4735

**4741** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4744
- `setRangeMode` 4749
- `analyzeRange` 4757
- `similarSpots` 4786
- `startRange` 4811
- `endRange` 4818
- `openRangeCard` 4828
- `renderRangeCard` 4834
- `rangeFacts` 4857
- `saveMark` 4863
- `drawRanges` 4897
- `openMark` 4935
- `marksFacts` 4942
- `marksFold` 4947
- `verTxt` 4962
- `checkPageVersion` 4966

**4986** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5005
- `runRule` 5008
- `computeRules` 5018
- `dataSig` 5033
- `ruleTick` 5035
- `exitSignal` 5040
- `btBrief` 5047
- `btDiff` 5048
- `selSignals` 5054
- `setRule` 5061
- `renderRules` 5071
- `rulesFacts` 5102
- `drawStrategyMarks` 5107

**5135** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5138
- `saveAlertCfg` 5139
- `alertSeen` 5140
- `alertOnce` 5141
- `raiseAlert` 5148
- `flushSay` 5157
- `showAlertCard` 5164
- `hm2min` 5176
- `alertTick` 5178
- `realFillCheck` 5217
- `renderAlertBtn` 5226

**5239** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5240
- `backtestWithRule` 5253
- `halfStats` 5270
- `setLabel` 5289
- `compareVariants` 5291
- `variantsFrom` 5321
- `runCompare` 5326
- `tableHtml` 5336

**5337** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5351
- `markIndex` 5352
- `roundT` 5361
- `extractRule` 5362
- `runExtract` 5411
- `extractFacts` 5441

**5442** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5444
- `importRecords` 5454

**5475** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5476

**5513** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5515
- `drawAct` 5516
- `drawClearAct` 5535
- `drawUserDraw` 5542
- `drawLegend` 5570
- `drawFacts` 5575

**5577** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5579
- `journalAdd` 5580
- `journalWhyAct` 5594
- `journalFold` 5602
- `journalFacts` 5629

**5641** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5644
- `cl` 5655
- `indDef` 5713
- `indLabel` 5714
- `clone` 5717
- `normalizeLook` 5718
- `lookSubs` 5732
- `lookSeries` 5735
- `strokeSeries` 5743
- `fillBetween` 5750
- `drawLookOverlays` 5760
- `drawLookSubs` 5771
- `numShort` 5810
- `lookLegend` 5811
- `renderLookCard` 5819
- `lookChanged` 5838
- `openLook` 5843
- `lkSet` 5849
- `lookAct` 5880
- `lookFacts` 5923

**5925** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 5928
- `agendaKey` 5929
- `agendaFind` 5930
- `equityNow` 5931
- `freeCash` 5932
- `planBuyQty` 5933
- `agendaChecks` 5938
- `agendaCreate` 5965
- `agendaBrief` 5979
- `agendaGate` 5994
- `agendaDone` 6002
- `winActiveFor` 6003
- `paperBuyNow` 6005
- `agendaExecNow` 6023
- `agendaDecide` 6039
- `agendaExpire` 6053
- `agendaOutcome` 6060
- `agendaHistLine` 6065
- `renderAgenda` 6070
- `agendaFacts` 6138
- `chatSend` 6148
- `convoNext` 6171
- `convoToggle` 6177
- `voiceSel` 6193
- `stopSpeaking` 6195
- `speechChunks` 6202
- `pcmToWavBlob` 6209
- `audioBlob` 6217
- `speakText` 6222
- `browserSpeak` 6256
- `micToggle` 6270
- `silenceMs` 6279
- `endWait` 6284
- `startSR` 6292
- `startRecorder` 6343

**6415** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 6423
- `mlpForward` 6428
- `aucOf` 6433
- `trainStyle` 6441
- `retrainStyle` 6492
- `predictWin` 6505
- `predictBin` 6512
- `styleProfile` 6519
- `renderStyle` 6528

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,745줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/news`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

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
- `news_search` 351
- `ai_available` 404
- `_ask_claude` 413
- `_ask_gemini` 447
- `gemini_tts` 527
- `gemini_models` 578
- `_clean_history` 594
- `_claude_msgs` 611
- `_ask` 615
- `ai_brief` 623
- `ai_test` 636
- `ai_ask` 765
- `demo_daily` 791
- `_hash01` 823
- `demo_chart` 831
- `Hub` 886
- `_tick_size` 925
- `_tick_msg` 932
- `_book_msg` 942
- `Realtime` 951
- `DemoRealtime` 1131
- `_state_path` 1184
- `state_read` 1198
- `state_write` 1207
- `state_backup` 1228
- `trade_available` 1260
- `acct_mask` 1264
- `_day_used` 1268
- `_day_add` 1277
- `nh_trade_post` 1294
- `_msg` 1314
- `_block` 1321
- `trade_check_acct` 1326
- `trade_status` 1348
- `trade_log` 1357
- `trade_order` 1363
- `trade_cancel` 1419
- `trade_balance` 1435
- `trade_orders` 1456
- `Handler` 1475
- `ExclusiveServer` 1678
- `hidden_input` 1689
- `main` 1710
