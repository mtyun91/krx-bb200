# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,498줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.32 · 2026-10-31 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**345** · 1. 설정 · 상태
- `tfInfo` 448
- `applySynced` 482
- `loadStore` 497
- `loadToken` 514
- `saveToken` 515
- `saveStore` 516
- `bgRun` 529
- `bgWorker` 530
- `bgEvery` 531

**534** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 536
- `hmToMin` 547
- `marketOpenNow` 548
- `tickSize` 553
- `tickFloor` 562
- `tickCeil` 563
- `won` 564
- `pct` 565
- `fmtDate` 566
- `nameOf` 567
- `esc` 568
- `toast` 569

**578** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 581
- `db` 593
- `cacheGet` 604
- `cachePut` 610
- `cacheAllDaily` 617
- `modeKey` 634
- `lastFinalClose` 637
- `isStale` 649
- `weekdaysSince` 655
- `fetchDaily` 665
- `isCore` 695
- `applyDaily` 699
- `bucketOf` 706
- `aggregateDaily` 712
- `chartWant` 726
- `fetchChart` 727

**756** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 758
- `priceBroken` 795

**800** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 802
- `loadCaps` 803
- `codeOfBars` 811
- `capOf` 817
- `bbCross` 819
- `structWhy` 830
- `baseBreakout` 843
- `widthLow` 850
- `isAccum` 858
- `accSqueeze` 866
- `squeezeCore` 876
- `sqKey` 891
- `isSqueeze` 893
- `squeezeSetup` 901
- `isLongCandle` 909
- `waitOk` 920
- `waitBase` 927
- `waitFrom` 928
- `above5` 940
- `isBreakout` 941
- `reBreakFrom` 947
- `sqFollowFrom` 964
- `rawSignal` 978
- `entryLabel` 987
- `rawLabel` 991

**998** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1003
- `costBuy` 1004
- `costSell` 1005
- `newSeq` 1007
- `seqBuy` 1020
- `seqSellAll` 1033
- `maN` 1042
- `stepSeq` 1048
- `seqResult` 1079
- `rankScore` 1087

**1093** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1095

**1180** · 7. 종목 목록
- `marketCodes` 1183
- `screenPass` 1190
- `universeCodes` 1199
- `rowInfo` 1211
- `renderSymbols` 1227
- `renderScrBar` 1268

**1277** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1282
- `chartBars` 1285
- `setChart` 1291
- `loadChart` 1299
- `chartGeom` 1351
- `axisTag` 1360
- `drawChart` 1369
- `drawChartNow` 1374
- `renderTfBar` 1566
- `updateBarCount` 1571
- `renderChartHeader` 1575
- `selectCode` 1596
- `setTf` 1609
- `rightPad` 1617
- `setViewEnd` 1618
- `curEnd` 1628
- `stopGlide` 1629
- `zoom` 1695
- `pan` 1706

**1715** · 9. 백테스트 패널
- `recomputeAll` 1717
- `runBt` 1723
- `renderBt` 1730
- `drawEquity` 1763

**1786** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1788
- `plog` 1792
- `lastPrice` 1797

**1804** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1808
- `sessionDate` 1817
- `buyRate` 1824
- `sellRate` 1825
- `manualValue` 1826
- `reservedCash` 1827
- `reservedQty` 1828
- `strategyReserve` 1830
- `buyingPower` 1831
- `sellable` 1832
- `liveQuote` 1834
- `fillBuy` 1841
- `fillSell` 1858
- `submitOrder` 1881
- `cancelOrder` 1917
- `matchOrders` 1925
- `expireOrders` 1941
- `orderWatchTick` 1950

**1964** · ---- 주문창
- `ticketSync` 1967
- `renderTicket` 1977
- `ticketPct` 2003
- `stepPrice` 2011
- `withTodayBar` 2020
- `refreshQuotes` 2031
- `paperExit` 2046
- `paperDecide` 2060
- `renderPaper` 2146
- `scheduler` 2208

**2232** · 11. 설정 패널
- `renderSettings` 2234
- `readSettings` 2248

**2273** · 12. 이벤트 · 초기화
- `setTab` 2275
- `applyPanes` 2285
- `bindResizer` 2297
- `openHolding` 2344
- `sellNow` 2352
- `renderHoldInfo` 2372
- `toggleWatch` 2428
- `setMaster` 2440
- `loadMaster` 2448
- `searchMatches` 2458
- `renderSearch` 2486
- `openFromSearch` 2494
- `connectBridge` 2526
- `loadSaved` 2570
- `syncData` 2588
- `liveTick` 2642

**2683** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2688
- `rtStop` 2694
- `rtLoop` 2699
- `rtWanted` 2727
- `rtSubscribe` 2735
- `rtMsg` 2748
- `applyTick` 2756
- `updateMinuteBar` 2789
- `renderRtBadge` 2803
- `prevClose` 2815
- `chgTag` 2821
- `renderBook` 2822

**2875** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2880
- `sync` 2887
- `saveSync` 2894
- `syncPayload` 2897
- `hasActivity` 2900
- `syncHash` 2905
- `syncMark` 2912
- `applyRemote` 2919
- `syncPush` 2931
- `syncPull` 2953
- `renderSync` 2977

**3009** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3018
- `sgn` 3042
- `pctTxt` 3043
- `evidenceAt` 3046
- `computeResearch` 3101
- `refreshResearch` 3132
- `regimeChip` 3141
- `researchChart` 3146
- `renderResearch0` 3157
- `renderResearch` 3205

**3213** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3256
- `setSectors` 3263
- `loadSectors` 3268
- `sectorOf` 3276
- `scenarioCodes` 3338

**3340** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3341
- `aboveMa` 3347
- `median` 3355
- `avg` 3356
- `sectorStats` 3358

**3376** · ---- 뉴스
- `getNews` 3378
- `agoTxt` 3385
- `newsList` 3386

**3390** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3392
- `loadScenarioNews` 3402

**3412** · ---- 화면
- `chg` 3414
- `heat` 3415
- `stockLink` 3416
- `renderSectorTab` 3418
- `renderSectorDetail` 3440
- `renderScenarioTab` 3456
- `renderNewsTab` 3483
- `renderCenter` 3491
- `openCenter` 3505
- `runNews` 3514
- `fetchSector` 3522

**3579** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3590
- `liveBar` 3602
- `winRange` 3608
- `winLog` 3611
- `winScan` 3616
- `winEvaluate` 3633
- `winStep` 3656
- `winFinish` 3720
- `windowTick` 3741
- `renderWindow` 3762
- `loadMoreBars` 3770

**3776** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3782
- `briefFacts` 3800
- `loadAi` 3821
- `renderBriefTab` 3835

**3879** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3883
- `saveAiCfg` 3889
- `aiReady` 3893
- `aiPayload` 3896
- `renderAiBox` 3899
- `modelKind` 3914
- `readAiBox` 3920

**3979** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3984
- `pushFeed` 3985
- `aiAuto` 3990
- `askAi` 3991

**3997** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3998
- `entryCtx` 4013

**4018** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4028
- `btTrades` 4058
- `myTrades` 4071
- `journal` 4074
- `statLine` 4081

**4091** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4092
- `showGuard` 4136
- `guardedSubmit` 4152

**4158** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4159
- `briefLines` 4186
- `assistOnSelect` 4199

**4216** · ---- 체결 직후 코멘트
- `assistOnTrade` 4217

**4232** · ---- 화면
- `renderAssistStrip` 4233
- `tableOf` 4240
- `renderAssist` 4252
- `foldOpen` 4283
- `fold` 4284
- `runAsk` 4317
- `calDays` 4335

**4341** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4346
- `marketRadarFacts` 4348
- `assistFacts` 4365
- `renderChat` 4383

**4397** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4398
- `grabActs` 4409
- `splitActions` 4424
- `plainSay` 4442
- `describeAct` 4446
- `findCode` 4468
- `confirmAct` 4477
- `runAction` 4492
- `settingAct` 4637
- `orderAct` 4661
- `runActions` 4675

**4685** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4689
- `saveCustom` 4693
- `safeId` 4696
- `attr` 4697
- `splitBlocks` 4699
- `applyBlocks` 4707
- `applyCss` 4735
- `calcInd` 4748
- `drawCustomInd` 4757
- `jsonSafe` 4802
- `widgetData` 4803
- `renderWidgets` 4834
- `renderCustomBox` 4873
- `customFacts` 4895

**4903** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4906
- `realConfirm` 4915
- `realSubmit` 4933
- `realCancel` 4964
- `realArm` 4970
- `realKill` 4980
- `renderReal` 4985
- `realFacts` 5021

**5027** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5030
- `setRangeMode` 5035
- `analyzeRange` 5043
- `similarSpots` 5072
- `startRange` 5097
- `endRange` 5104
- `openRangeCard` 5114
- `renderRangeCard` 5120
- `rangeFacts` 5143
- `saveMark` 5149
- `drawRanges` 5183
- `openMark` 5222
- `marksFacts` 5229
- `marksFold` 5234
- `verTxt` 5249
- `checkPageVersion` 5253

**5273** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5292
- `runRule` 5295
- `computeRules` 5305
- `dataSig` 5320
- `ruleTick` 5322
- `stopPrice` 5329
- `exitOrStop` 5333
- `exitSignal` 5338
- `btBrief` 5345
- `btDiff` 5346
- `selSignals` 5352
- `setRule` 5359
- `renderRules` 5369
- `rulesFacts` 5402
- `drawStrategyMarks` 5407

**5437** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5440
- `saveAlertCfg` 5441
- `alertSeen` 5442
- `alertOnce` 5443
- `raiseAlert` 5450
- `flushSay` 5460
- `showAlertCard` 5467
- `hm2min` 5479
- `alertTick` 5481
- `realFillCheck` 5520
- `renderAlertBtn` 5529

**5542** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5543
- `backtestWithRule` 5556
- `halfStats` 5573
- `setLabel` 5610
- `compareVariants` 5612
- `variantsFrom` 5642
- `runCompare` 5647
- `tableHtml` 5657

**5658** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5672
- `markIndex` 5673
- `roundT` 5682
- `extractRule` 5683
- `runExtract` 5732
- `extractFacts` 5762

**5763** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5765
- `importRecords` 5775

**5796** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5797

**5834** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5836
- `drawAct` 5837
- `drawClearAct` 5856
- `drawUserDraw` 5863
- `drawLegend` 5891
- `drawFacts` 5896

**5898** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5900
- `journalAdd` 5901
- `journalWhyAct` 5915
- `journalFold` 5923
- `journalFacts` 5950

**5962** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5965
- `cl` 5976
- `indDef` 6037
- `indLabel` 6038
- `clone` 6041
- `normalizeLook` 6042
- `lookSubs` 6058
- `lookSeries` 6061
- `strokeSeries` 6069
- `fillBetween` 6076
- `drawLookOverlays` 6086
- `drawLookSubs` 6098
- `numShort` 6137
- `lookLegend` 6138
- `renderLookCard` 6146
- `lookChanged` 6166
- `openLook` 6171
- `lkSet` 6177
- `lookAct` 6208
- `lookFacts` 6251

**6253** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6256
- `agendaKey` 6257
- `agendaFind` 6258
- `equityNow` 6259
- `freeCash` 6260
- `planBuyQty` 6261
- `agendaChecks` 6266
- `agendaCreate` 6294
- `agendaBrief` 6308
- `agendaGate` 6323
- `agendaDone` 6331
- `winActiveFor` 6332
- `paperBuyNow` 6334
- `agendaExecNow` 6352
- `agendaDecide` 6376
- `agendaExpire` 6390
- `agendaOutcome` 6397
- `agendaHistLine` 6402
- `renderAgenda` 6407
- `agendaFacts` 6478

**6488** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6489
- `applyExternalReply` 6499

**6530** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6536
- `idxPct` 6537
- `loadMarketQuotes` 6538
- `renderIdxBar` 6545
- `renderIndexTab` 6556
- `renderIndexToolbar` 6565
- `idxEnter` 6574
- `idxExit` 6595
- `marketFacts` 6606

**6610** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6613
- `invLevOf` 6614
- `invHeld` 6615
- `invDecision` 6617
- `invEvaluate` 6635
- `invExec` 6649
- `invBacktest` 6663
- `invBtLine` 6698
- `renderInv` 6700
- `invFacts` 6744
- `invChecks` 6757

**6776** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6777
- `renderManage` 6788
- `manageFacts` 6805

**6809** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 6811
- `newsAgo` 6817
- `renderNewsTicker` 6818
- `topNewsFacts` 6838

**6841** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 6842

**6849** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 6852
- `waitCodes` 6868
- `renderWait` 6869
- `waitAlerts` 6882

**6888** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 6891

**6922** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 6925
- `savePhone` 6926
- `phoneNotify` 6928
- `renderPhone` 6936

**6968** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 6972
- `tgReply` 6977
- `agShort` 6981
- `agByShort` 6982
- `tgHandle` 6985
- `tgStart` 7056
- `savePin` 7064
- `chatSend` 7069
- `convoNext` 7095
- `convoToggle` 7101
- `voiceSel` 7117
- `stopSpeaking` 7119
- `speechChunks` 7126
- `pcmToWavBlob` 7133
- `audioBlob` 7141
- `speakText` 7146
- `browserSpeak` 7180
- `micToggle` 7194
- `silenceMs` 7203
- `endWait` 7208
- `startSR` 7216
- `startRecorder` 7267

**7339** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7347
- `mlpForward` 7352
- `aucOf` 7357
- `trainStyle` 7365
- `retrainStyle` 7416
- `predictWin` 7429
- `predictBin` 7436
- `styleProfile` 7443
- `renderStyle` 7452

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `cmf` CMF(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

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
