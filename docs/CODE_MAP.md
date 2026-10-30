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
