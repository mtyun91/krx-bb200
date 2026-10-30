# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,289줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.29 · 2026-10-30 (pre-commit 훅이 자동으로 올림)

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
- `applyTick` 2681
- `updateMinuteBar` 2714
- `renderRtBadge` 2728
- `prevClose` 2740
- `chgTag` 2746
- `renderBook` 2747

**2800** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2805
- `sync` 2812
- `saveSync` 2819
- `syncPayload` 2822
- `hasActivity` 2825
- `syncHash` 2830
- `syncMark` 2837
- `applyRemote` 2844
- `syncPush` 2856
- `syncPull` 2878
- `renderSync` 2902

**2934** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2943
- `sgn` 2967
- `pctTxt` 2968
- `evidenceAt` 2971
- `computeResearch` 3026
- `refreshResearch` 3057
- `regimeChip` 3066
- `researchChart` 3071
- `renderResearch0` 3082
- `renderResearch` 3130

**3138** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3181
- `setSectors` 3188
- `loadSectors` 3193
- `sectorOf` 3201
- `scenarioCodes` 3263

**3265** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3266
- `aboveMa` 3272
- `median` 3280
- `avg` 3281
- `sectorStats` 3283

**3301** · ---- 뉴스
- `getNews` 3303
- `agoTxt` 3310
- `newsList` 3311

**3315** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3317
- `loadScenarioNews` 3327

**3337** · ---- 화면
- `chg` 3339
- `heat` 3340
- `stockLink` 3341
- `renderSectorTab` 3343
- `renderSectorDetail` 3365
- `renderScenarioTab` 3381
- `renderNewsTab` 3408
- `renderCenter` 3416
- `openCenter` 3430
- `runNews` 3439
- `fetchSector` 3447

**3504** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3515
- `liveBar` 3527
- `winRange` 3533
- `winLog` 3536
- `winScan` 3541
- `winEvaluate` 3558
- `winStep` 3581
- `winFinish` 3645
- `windowTick` 3666
- `renderWindow` 3687
- `loadMoreBars` 3695

**3701** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3707
- `briefFacts` 3725
- `loadAi` 3746
- `renderBriefTab` 3760

**3804** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3808
- `saveAiCfg` 3814
- `aiReady` 3818
- `aiPayload` 3821
- `renderAiBox` 3824
- `modelKind` 3839
- `readAiBox` 3845

**3904** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3909
- `pushFeed` 3910
- `aiAuto` 3915
- `askAi` 3916

**3922** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3923
- `entryCtx` 3938

**3943** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3953
- `btTrades` 3983
- `myTrades` 3996
- `journal` 3999
- `statLine` 4006

**4016** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4017
- `showGuard` 4061
- `guardedSubmit` 4077

**4083** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4084
- `briefLines` 4111
- `assistOnSelect` 4124

**4141** · ---- 체결 직후 코멘트
- `assistOnTrade` 4142

**4157** · ---- 화면
- `renderAssistStrip` 4158
- `tableOf` 4165
- `renderAssist` 4177
- `foldOpen` 4208
- `fold` 4209
- `runAsk` 4242
- `calDays` 4260

**4266** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4271
- `marketRadarFacts` 4273
- `assistFacts` 4290
- `renderChat` 4308

**4322** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4323
- `grabActs` 4334
- `splitActions` 4349
- `plainSay` 4367
- `describeAct` 4371
- `findCode` 4393
- `confirmAct` 4402
- `runAction` 4417
- `settingAct` 4561
- `orderAct` 4585
- `runActions` 4599

**4609** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4613
- `saveCustom` 4617
- `safeId` 4620
- `attr` 4621
- `splitBlocks` 4623
- `applyBlocks` 4631
- `applyCss` 4659
- `calcInd` 4672
- `drawCustomInd` 4681
- `jsonSafe` 4726
- `widgetData` 4727
- `renderWidgets` 4758
- `renderCustomBox` 4797
- `customFacts` 4819

**4827** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4830
- `realConfirm` 4839
- `realSubmit` 4857
- `realCancel` 4888
- `realArm` 4894
- `realKill` 4904
- `renderReal` 4909
- `realFacts` 4945

**4951** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4954
- `setRangeMode` 4959
- `analyzeRange` 4967
- `similarSpots` 4996
- `startRange` 5021
- `endRange` 5028
- `openRangeCard` 5038
- `renderRangeCard` 5044
- `rangeFacts` 5067
- `saveMark` 5073
- `drawRanges` 5107
- `openMark` 5146
- `marksFacts` 5153
- `marksFold` 5158
- `verTxt` 5173
- `checkPageVersion` 5177

**5197** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5216
- `runRule` 5219
- `computeRules` 5229
- `dataSig` 5244
- `ruleTick` 5246
- `stopPrice` 5253
- `exitOrStop` 5257
- `exitSignal` 5262
- `btBrief` 5269
- `btDiff` 5270
- `selSignals` 5276
- `setRule` 5283
- `renderRules` 5293
- `rulesFacts` 5324
- `drawStrategyMarks` 5329

**5357** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5360
- `saveAlertCfg` 5361
- `alertSeen` 5362
- `alertOnce` 5363
- `raiseAlert` 5370
- `flushSay` 5380
- `showAlertCard` 5387
- `hm2min` 5399
- `alertTick` 5401
- `realFillCheck` 5440
- `renderAlertBtn` 5449

**5462** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5463
- `backtestWithRule` 5476
- `halfStats` 5493
- `setLabel` 5514
- `compareVariants` 5516
- `variantsFrom` 5546
- `runCompare` 5551
- `tableHtml` 5561

**5562** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5576
- `markIndex` 5577
- `roundT` 5586
- `extractRule` 5587
- `runExtract` 5636
- `extractFacts` 5666

**5667** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5669
- `importRecords` 5679

**5700** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5701

**5738** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5740
- `drawAct` 5741
- `drawClearAct` 5760
- `drawUserDraw` 5767
- `drawLegend` 5795
- `drawFacts` 5800

**5802** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5804
- `journalAdd` 5805
- `journalWhyAct` 5819
- `journalFold` 5827
- `journalFacts` 5854

**5866** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5869
- `cl` 5880
- `indDef` 5939
- `indLabel` 5940
- `clone` 5943
- `normalizeLook` 5944
- `lookSubs` 5958
- `lookSeries` 5961
- `strokeSeries` 5969
- `fillBetween` 5976
- `drawLookOverlays` 5986
- `drawLookSubs` 5998
- `numShort` 6037
- `lookLegend` 6038
- `renderLookCard` 6046
- `lookChanged` 6065
- `openLook` 6070
- `lkSet` 6076
- `lookAct` 6107
- `lookFacts` 6150

**6152** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6155
- `agendaKey` 6156
- `agendaFind` 6157
- `equityNow` 6158
- `freeCash` 6159
- `planBuyQty` 6160
- `agendaChecks` 6165
- `agendaCreate` 6193
- `agendaBrief` 6207
- `agendaGate` 6222
- `agendaDone` 6230
- `winActiveFor` 6231
- `paperBuyNow` 6233
- `agendaExecNow` 6251
- `agendaDecide` 6275
- `agendaExpire` 6289
- `agendaOutcome` 6296
- `agendaHistLine` 6301
- `renderAgenda` 6306
- `agendaFacts` 6377

**6387** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6388
- `applyExternalReply` 6398

**6429** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6435
- `idxPct` 6436
- `loadMarketQuotes` 6437
- `renderIdxBar` 6444
- `renderIndexTab` 6455
- `renderIndexToolbar` 6464
- `idxEnter` 6473
- `idxExit` 6494
- `marketFacts` 6505

**6509** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6512
- `invLevOf` 6513
- `invHeld` 6514
- `invDecision` 6516
- `invEvaluate` 6534
- `invExec` 6548
- `invBacktest` 6562
- `invBtLine` 6597
- `renderInv` 6599
- `invFacts` 6643
- `invChecks` 6656

**6675** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6676
- `renderManage` 6687
- `manageFacts` 6704

**6708** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 6710
- `newsAgo` 6716
- `renderNewsTicker` 6717
- `topNewsFacts` 6737

**6740** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 6741

**6748** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 6751
- `waitCodes` 6767
- `renderWait` 6768
- `waitAlerts` 6781

**6787** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 6790

**6821** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 6824
- `savePhone` 6825
- `phoneNotify` 6827
- `renderPhone` 6835
- `chatSend` 6860
- `convoNext` 6886
- `convoToggle` 6892
- `voiceSel` 6908
- `stopSpeaking` 6910
- `speechChunks` 6917
- `pcmToWavBlob` 6924
- `audioBlob` 6932
- `speakText` 6937
- `browserSpeak` 6971
- `micToggle` 6985
- `silenceMs` 6994
- `endWait` 6999
- `startSR` 7007
- `startRecorder` 7058

**7130** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7138
- `mlpForward` 7143
- `aucOf` 7148
- `trainStyle` 7156
- `retrainStyle` 7207
- `predictWin` 7220
- `predictBin` 7227
- `styleProfile` 7234
- `renderStyle` 7243

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

총 1,916줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/market/index`, `/market/quotes`, `/news`, `/news/top`, `/notify/telegram`, `/notify/telegram_chat`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

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
- `ai_available` 552
- `_ask_claude` 561
- `_ask_gemini` 595
- `gemini_tts` 675
- `gemini_models` 726
- `_clean_history` 742
- `_claude_msgs` 759
- `_ask` 763
- `ai_brief` 771
- `ai_test` 784
- `ai_ask` 925
- `demo_daily` 951
- `_hash01` 983
- `demo_chart` 991
- `Hub` 1046
- `_tick_size` 1085
- `_tick_msg` 1092
- `_book_msg` 1102
- `Realtime` 1111
- `DemoRealtime` 1292
- `_state_path` 1345
- `state_read` 1359
- `state_write` 1368
- `state_backup` 1389
- `trade_available` 1421
- `acct_mask` 1425
- `_day_used` 1429
- `_day_add` 1438
- `nh_trade_post` 1455
- `_msg` 1475
- `_block` 1482
- `trade_check_acct` 1487
- `trade_status` 1509
- `trade_log` 1518
- `trade_order` 1524
- `trade_cancel` 1580
- `trade_balance` 1596
- `trade_orders` 1617
- `Handler` 1636
- `ExclusiveServer` 1849
- `hidden_input` 1860
- `main` 1881
