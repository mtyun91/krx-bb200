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
