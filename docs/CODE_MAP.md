# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,153줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.27 · 2026-10-29 (pre-commit 훅이 자동으로 올림)

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
- `settingAct` 4541
- `orderAct` 4565
- `runActions` 4579

**4589** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4593
- `saveCustom` 4597
- `safeId` 4600
- `attr` 4601
- `splitBlocks` 4603
- `applyBlocks` 4611
- `applyCss` 4639
- `calcInd` 4652
- `drawCustomInd` 4661
- `jsonSafe` 4706
- `widgetData` 4707
- `renderWidgets` 4738
- `renderCustomBox` 4777
- `customFacts` 4799

**4807** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4810
- `realConfirm` 4819
- `realSubmit` 4837
- `realCancel` 4868
- `realArm` 4874
- `realKill` 4884
- `renderReal` 4889
- `realFacts` 4925

**4931** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4934
- `setRangeMode` 4939
- `analyzeRange` 4947
- `similarSpots` 4976
- `startRange` 5001
- `endRange` 5008
- `openRangeCard` 5018
- `renderRangeCard` 5024
- `rangeFacts` 5047
- `saveMark` 5053
- `drawRanges` 5087
- `openMark` 5126
- `marksFacts` 5133
- `marksFold` 5138
- `verTxt` 5153
- `checkPageVersion` 5157

**5177** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5196
- `runRule` 5199
- `computeRules` 5209
- `dataSig` 5224
- `ruleTick` 5226
- `stopPrice` 5233
- `exitOrStop` 5237
- `exitSignal` 5242
- `btBrief` 5249
- `btDiff` 5250
- `selSignals` 5256
- `setRule` 5263
- `renderRules` 5273
- `rulesFacts` 5304
- `drawStrategyMarks` 5309

**5337** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5340
- `saveAlertCfg` 5341
- `alertSeen` 5342
- `alertOnce` 5343
- `raiseAlert` 5350
- `flushSay` 5359
- `showAlertCard` 5366
- `hm2min` 5378
- `alertTick` 5380
- `realFillCheck` 5419
- `renderAlertBtn` 5428

**5441** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5442
- `backtestWithRule` 5455
- `halfStats` 5472
- `setLabel` 5493
- `compareVariants` 5495
- `variantsFrom` 5525
- `runCompare` 5530
- `tableHtml` 5540

**5541** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5555
- `markIndex` 5556
- `roundT` 5565
- `extractRule` 5566
- `runExtract` 5615
- `extractFacts` 5645

**5646** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5648
- `importRecords` 5658

**5679** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5680

**5717** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5719
- `drawAct` 5720
- `drawClearAct` 5739
- `drawUserDraw` 5746
- `drawLegend` 5774
- `drawFacts` 5779

**5781** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5783
- `journalAdd` 5784
- `journalWhyAct` 5798
- `journalFold` 5806
- `journalFacts` 5833

**5845** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5848
- `cl` 5859
- `indDef` 5918
- `indLabel` 5919
- `clone` 5922
- `normalizeLook` 5923
- `lookSubs` 5937
- `lookSeries` 5940
- `strokeSeries` 5948
- `fillBetween` 5955
- `drawLookOverlays` 5965
- `drawLookSubs` 5977
- `numShort` 6016
- `lookLegend` 6017
- `renderLookCard` 6025
- `lookChanged` 6044
- `openLook` 6049
- `lkSet` 6055
- `lookAct` 6086
- `lookFacts` 6129

**6131** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6134
- `agendaKey` 6135
- `agendaFind` 6136
- `equityNow` 6137
- `freeCash` 6138
- `planBuyQty` 6139
- `agendaChecks` 6144
- `agendaCreate` 6172
- `agendaBrief` 6186
- `agendaGate` 6201
- `agendaDone` 6209
- `winActiveFor` 6210
- `paperBuyNow` 6212
- `agendaExecNow` 6230
- `agendaDecide` 6254
- `agendaExpire` 6268
- `agendaOutcome` 6275
- `agendaHistLine` 6280
- `renderAgenda` 6285
- `agendaFacts` 6356

**6366** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6367
- `applyExternalReply` 6377

**6408** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6414
- `idxPct` 6415
- `loadMarketQuotes` 6416
- `renderIdxBar` 6423
- `renderIndexTab` 6434
- `renderIndexToolbar` 6443
- `idxEnter` 6452
- `idxExit` 6473
- `marketFacts` 6484

**6488** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6491
- `invLevOf` 6492
- `invHeld` 6493
- `invDecision` 6495
- `invEvaluate` 6513
- `invExec` 6527
- `invBacktest` 6541
- `invBtLine` 6576
- `renderInv` 6578
- `invFacts` 6622
- `invChecks` 6635

**6654** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6655
- `renderManage` 6666
- `manageFacts` 6683

**6687** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 6689
- `newsAgo` 6695
- `renderNewsTicker` 6696
- `topNewsFacts` 6716

**6719** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 6720
- `chatSend` 6727
- `convoNext` 6750
- `convoToggle` 6756
- `voiceSel` 6772
- `stopSpeaking` 6774
- `speechChunks` 6781
- `pcmToWavBlob` 6788
- `audioBlob` 6796
- `speakText` 6801
- `browserSpeak` 6835
- `micToggle` 6849
- `silenceMs` 6858
- `endWait` 6863
- `startSR` 6871
- `startRecorder` 6922

**6994** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7002
- `mlpForward` 7007
- `aucOf` 7012
- `trainStyle` 7020
- `retrainStyle` 7071
- `predictWin` 7084
- `predictBin` 7091
- `styleProfile` 7098
- `renderStyle` 7107

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,870줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/market/index`, `/market/quotes`, `/news`, `/news/top`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

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
- `ai_available` 511
- `_ask_claude` 520
- `_ask_gemini` 554
- `gemini_tts` 634
- `gemini_models` 685
- `_clean_history` 701
- `_claude_msgs` 718
- `_ask` 722
- `ai_brief` 730
- `ai_test` 743
- `ai_ask` 883
- `demo_daily` 909
- `_hash01` 941
- `demo_chart` 949
- `Hub` 1004
- `_tick_size` 1043
- `_tick_msg` 1050
- `_book_msg` 1060
- `Realtime` 1069
- `DemoRealtime` 1250
- `_state_path` 1303
- `state_read` 1317
- `state_write` 1326
- `state_backup` 1347
- `trade_available` 1379
- `acct_mask` 1383
- `_day_used` 1387
- `_day_add` 1396
- `nh_trade_post` 1413
- `_msg` 1433
- `_block` 1440
- `trade_check_acct` 1445
- `trade_status` 1467
- `trade_log` 1476
- `trade_order` 1482
- `trade_cancel` 1538
- `trade_balance` 1554
- `trade_orders` 1575
- `Handler` 1594
- `ExclusiveServer` 1803
- `hidden_input` 1814
- `main` 1835
