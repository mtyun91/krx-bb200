# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,445줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.31 · 2026-10-30 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**345** · 1. 설정 · 상태
- `tfInfo` 445
- `applySynced` 479
- `loadStore` 494
- `loadToken` 511
- `saveToken` 512
- `saveStore` 513
- `bgRun` 526
- `bgWorker` 527
- `bgEvery` 528

**531** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 533
- `hmToMin` 544
- `marketOpenNow` 545
- `tickSize` 550
- `tickFloor` 559
- `tickCeil` 560
- `won` 561
- `pct` 562
- `fmtDate` 563
- `nameOf` 564
- `esc` 565
- `toast` 566

**575** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 578
- `db` 590
- `cacheGet` 601
- `cachePut` 607
- `cacheAllDaily` 614
- `modeKey` 631
- `lastFinalClose` 634
- `isStale` 646
- `weekdaysSince` 652
- `fetchDaily` 662
- `isCore` 692
- `applyDaily` 696
- `bucketOf` 703
- `aggregateDaily` 709
- `chartWant` 723
- `fetchChart` 724

**753** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 755
- `priceBroken` 792
- `baseBreakout` 797
- `widthLow` 807
- `isAccum` 815
- `accSqueeze` 823
- `squeezeCore` 833
- `sqKey` 848
- `isSqueeze` 850
- `squeezeSetup` 858
- `isLongCandle` 866
- `waitOk` 877
- `waitBase` 884
- `waitFrom` 885
- `above5` 897
- `isBreakout` 898
- `reBreakFrom` 904
- `sqFollowFrom` 921
- `rawSignal` 935
- `entryLabel` 944
- `rawLabel` 948

**955** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 960
- `costBuy` 961
- `costSell` 962
- `newSeq` 964
- `seqBuy` 977
- `seqSellAll` 990
- `maN` 999
- `stepSeq` 1005
- `seqResult` 1036
- `rankScore` 1044

**1050** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1052

**1137** · 7. 종목 목록
- `marketCodes` 1140
- `screenPass` 1147
- `universeCodes` 1156
- `rowInfo` 1168
- `renderSymbols` 1184
- `renderScrBar` 1225

**1234** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1239
- `chartBars` 1242
- `setChart` 1248
- `loadChart` 1256
- `chartGeom` 1308
- `axisTag` 1317
- `drawChart` 1326
- `drawChartNow` 1331
- `renderTfBar` 1523
- `updateBarCount` 1528
- `renderChartHeader` 1532
- `selectCode` 1553
- `setTf` 1566
- `rightPad` 1574
- `setViewEnd` 1575
- `curEnd` 1585
- `stopGlide` 1586
- `zoom` 1652
- `pan` 1663

**1672** · 9. 백테스트 패널
- `recomputeAll` 1674
- `runBt` 1680
- `renderBt` 1687
- `drawEquity` 1720

**1743** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1745
- `plog` 1749
- `lastPrice` 1754

**1761** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1765
- `sessionDate` 1774
- `buyRate` 1781
- `sellRate` 1782
- `manualValue` 1783
- `reservedCash` 1784
- `reservedQty` 1785
- `strategyReserve` 1787
- `buyingPower` 1788
- `sellable` 1789
- `liveQuote` 1791
- `fillBuy` 1798
- `fillSell` 1815
- `submitOrder` 1838
- `cancelOrder` 1874
- `matchOrders` 1882
- `expireOrders` 1898
- `orderWatchTick` 1907

**1921** · ---- 주문창
- `ticketSync` 1924
- `renderTicket` 1934
- `ticketPct` 1960
- `stepPrice` 1968
- `withTodayBar` 1977
- `refreshQuotes` 1988
- `paperExit` 2003
- `paperDecide` 2017
- `renderPaper` 2103
- `scheduler` 2165

**2189** · 11. 설정 패널
- `renderSettings` 2191
- `readSettings` 2205

**2230** · 12. 이벤트 · 초기화
- `setTab` 2232
- `applyPanes` 2242
- `bindResizer` 2254
- `openHolding` 2301
- `sellNow` 2309
- `renderHoldInfo` 2329
- `toggleWatch` 2385
- `setMaster` 2397
- `loadMaster` 2405
- `searchMatches` 2415
- `renderSearch` 2443
- `openFromSearch` 2451
- `connectBridge` 2483
- `loadSaved` 2527
- `syncData` 2545
- `liveTick` 2599

**2640** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2645
- `rtStop` 2651
- `rtLoop` 2656
- `rtWanted` 2684
- `rtSubscribe` 2692
- `rtMsg` 2705
- `applyTick` 2713
- `updateMinuteBar` 2746
- `renderRtBadge` 2760
- `prevClose` 2772
- `chgTag` 2778
- `renderBook` 2779

**2832** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2837
- `sync` 2844
- `saveSync` 2851
- `syncPayload` 2854
- `hasActivity` 2857
- `syncHash` 2862
- `syncMark` 2869
- `applyRemote` 2876
- `syncPush` 2888
- `syncPull` 2910
- `renderSync` 2934

**2966** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2975
- `sgn` 2999
- `pctTxt` 3000
- `evidenceAt` 3003
- `computeResearch` 3058
- `refreshResearch` 3089
- `regimeChip` 3098
- `researchChart` 3103
- `renderResearch0` 3114
- `renderResearch` 3162

**3170** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3213
- `setSectors` 3220
- `loadSectors` 3225
- `sectorOf` 3233
- `scenarioCodes` 3295

**3297** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3298
- `aboveMa` 3304
- `median` 3312
- `avg` 3313
- `sectorStats` 3315

**3333** · ---- 뉴스
- `getNews` 3335
- `agoTxt` 3342
- `newsList` 3343

**3347** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3349
- `loadScenarioNews` 3359

**3369** · ---- 화면
- `chg` 3371
- `heat` 3372
- `stockLink` 3373
- `renderSectorTab` 3375
- `renderSectorDetail` 3397
- `renderScenarioTab` 3413
- `renderNewsTab` 3440
- `renderCenter` 3448
- `openCenter` 3462
- `runNews` 3471
- `fetchSector` 3479

**3536** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3547
- `liveBar` 3559
- `winRange` 3565
- `winLog` 3568
- `winScan` 3573
- `winEvaluate` 3590
- `winStep` 3613
- `winFinish` 3677
- `windowTick` 3698
- `renderWindow` 3719
- `loadMoreBars` 3727

**3733** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3739
- `briefFacts` 3757
- `loadAi` 3778
- `renderBriefTab` 3792

**3836** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3840
- `saveAiCfg` 3846
- `aiReady` 3850
- `aiPayload` 3853
- `renderAiBox` 3856
- `modelKind` 3871
- `readAiBox` 3877

**3936** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3941
- `pushFeed` 3942
- `aiAuto` 3947
- `askAi` 3948

**3954** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3955
- `entryCtx` 3970

**3975** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3985
- `btTrades` 4015
- `myTrades` 4028
- `journal` 4031
- `statLine` 4038

**4048** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4049
- `showGuard` 4093
- `guardedSubmit` 4109

**4115** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4116
- `briefLines` 4143
- `assistOnSelect` 4156

**4173** · ---- 체결 직후 코멘트
- `assistOnTrade` 4174

**4189** · ---- 화면
- `renderAssistStrip` 4190
- `tableOf` 4197
- `renderAssist` 4209
- `foldOpen` 4240
- `fold` 4241
- `runAsk` 4274
- `calDays` 4292

**4298** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4303
- `marketRadarFacts` 4305
- `assistFacts` 4322
- `renderChat` 4340

**4354** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4355
- `grabActs` 4366
- `splitActions` 4381
- `plainSay` 4399
- `describeAct` 4403
- `findCode` 4425
- `confirmAct` 4434
- `runAction` 4449
- `settingAct` 4594
- `orderAct` 4618
- `runActions` 4632

**4642** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4646
- `saveCustom` 4650
- `safeId` 4653
- `attr` 4654
- `splitBlocks` 4656
- `applyBlocks` 4664
- `applyCss` 4692
- `calcInd` 4705
- `drawCustomInd` 4714
- `jsonSafe` 4759
- `widgetData` 4760
- `renderWidgets` 4791
- `renderCustomBox` 4830
- `customFacts` 4852

**4860** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4863
- `realConfirm` 4872
- `realSubmit` 4890
- `realCancel` 4921
- `realArm` 4927
- `realKill` 4937
- `renderReal` 4942
- `realFacts` 4978

**4984** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4987
- `setRangeMode` 4992
- `analyzeRange` 5000
- `similarSpots` 5029
- `startRange` 5054
- `endRange` 5061
- `openRangeCard` 5071
- `renderRangeCard` 5077
- `rangeFacts` 5100
- `saveMark` 5106
- `drawRanges` 5140
- `openMark` 5179
- `marksFacts` 5186
- `marksFold` 5191
- `verTxt` 5206
- `checkPageVersion` 5210

**5230** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5249
- `runRule` 5252
- `computeRules` 5262
- `dataSig` 5277
- `ruleTick` 5279
- `stopPrice` 5286
- `exitOrStop` 5290
- `exitSignal` 5295
- `btBrief` 5302
- `btDiff` 5303
- `selSignals` 5309
- `setRule` 5316
- `renderRules` 5326
- `rulesFacts` 5358
- `drawStrategyMarks` 5363

**5392** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5395
- `saveAlertCfg` 5396
- `alertSeen` 5397
- `alertOnce` 5398
- `raiseAlert` 5405
- `flushSay` 5415
- `showAlertCard` 5422
- `hm2min` 5434
- `alertTick` 5436
- `realFillCheck` 5475
- `renderAlertBtn` 5484

**5497** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5498
- `backtestWithRule` 5511
- `halfStats` 5528
- `setLabel` 5557
- `compareVariants` 5559
- `variantsFrom` 5589
- `runCompare` 5594
- `tableHtml` 5604

**5605** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5619
- `markIndex` 5620
- `roundT` 5629
- `extractRule` 5630
- `runExtract` 5679
- `extractFacts` 5709

**5710** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5712
- `importRecords` 5722

**5743** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5744

**5781** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5783
- `drawAct` 5784
- `drawClearAct` 5803
- `drawUserDraw` 5810
- `drawLegend` 5838
- `drawFacts` 5843

**5845** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5847
- `journalAdd` 5848
- `journalWhyAct` 5862
- `journalFold` 5870
- `journalFacts` 5897

**5909** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5912
- `cl` 5923
- `indDef` 5984
- `indLabel` 5985
- `clone` 5988
- `normalizeLook` 5989
- `lookSubs` 6005
- `lookSeries` 6008
- `strokeSeries` 6016
- `fillBetween` 6023
- `drawLookOverlays` 6033
- `drawLookSubs` 6045
- `numShort` 6084
- `lookLegend` 6085
- `renderLookCard` 6093
- `lookChanged` 6113
- `openLook` 6118
- `lkSet` 6124
- `lookAct` 6155
- `lookFacts` 6198

**6200** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6203
- `agendaKey` 6204
- `agendaFind` 6205
- `equityNow` 6206
- `freeCash` 6207
- `planBuyQty` 6208
- `agendaChecks` 6213
- `agendaCreate` 6241
- `agendaBrief` 6255
- `agendaGate` 6270
- `agendaDone` 6278
- `winActiveFor` 6279
- `paperBuyNow` 6281
- `agendaExecNow` 6299
- `agendaDecide` 6323
- `agendaExpire` 6337
- `agendaOutcome` 6344
- `agendaHistLine` 6349
- `renderAgenda` 6354
- `agendaFacts` 6425

**6435** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6436
- `applyExternalReply` 6446

**6477** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6483
- `idxPct` 6484
- `loadMarketQuotes` 6485
- `renderIdxBar` 6492
- `renderIndexTab` 6503
- `renderIndexToolbar` 6512
- `idxEnter` 6521
- `idxExit` 6542
- `marketFacts` 6553

**6557** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6560
- `invLevOf` 6561
- `invHeld` 6562
- `invDecision` 6564
- `invEvaluate` 6582
- `invExec` 6596
- `invBacktest` 6610
- `invBtLine` 6645
- `renderInv` 6647
- `invFacts` 6691
- `invChecks` 6704

**6723** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6724
- `renderManage` 6735
- `manageFacts` 6752

**6756** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 6758
- `newsAgo` 6764
- `renderNewsTicker` 6765
- `topNewsFacts` 6785

**6788** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 6789

**6796** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 6799
- `waitCodes` 6815
- `renderWait` 6816
- `waitAlerts` 6829

**6835** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 6838

**6869** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 6872
- `savePhone` 6873
- `phoneNotify` 6875
- `renderPhone` 6883

**6915** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 6919
- `tgReply` 6924
- `agShort` 6928
- `agByShort` 6929
- `tgHandle` 6932
- `tgStart` 7003
- `savePin` 7011
- `chatSend` 7016
- `convoNext` 7042
- `convoToggle` 7048
- `voiceSel` 7064
- `stopSpeaking` 7066
- `speechChunks` 7073
- `pcmToWavBlob` 7080
- `audioBlob` 7088
- `speakText` 7093
- `browserSpeak` 7127
- `micToggle` 7141
- `silenceMs` 7150
- `endWait` 7155
- `startSR` 7163
- `startRecorder` 7214

**7286** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7294
- `mlpForward` 7299
- `aucOf` 7304
- `trainStyle` 7312
- `retrainStyle` 7363
- `predictWin` 7376
- `predictBin` 7383
- `styleProfile` 7390
- `renderStyle` 7399

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `cmf` CMF(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

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
