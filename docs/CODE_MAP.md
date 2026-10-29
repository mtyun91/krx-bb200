# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,035줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.25 · 2026-10-29 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**342** · 1. 설정 · 상태
- `tfInfo` 433
- `applySynced` 467
- `loadStore` 482
- `loadToken` 499
- `saveToken` 500
- `saveStore` 501
- `bgRun` 514
- `bgWorker` 515
- `bgEvery` 516

**519** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 521
- `hmToMin` 532
- `marketOpenNow` 533
- `tickSize` 538
- `tickFloor` 547
- `tickCeil` 548
- `won` 549
- `pct` 550
- `fmtDate` 551
- `nameOf` 552
- `esc` 553
- `toast` 554

**563** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 566
- `db` 578
- `cacheGet` 589
- `cachePut` 595
- `cacheAllDaily` 602
- `modeKey` 619
- `lastFinalClose` 622
- `isStale` 634
- `weekdaysSince` 640
- `fetchDaily` 650
- `isCore` 680
- `applyDaily` 684
- `bucketOf` 691
- `aggregateDaily` 697
- `chartWant` 711
- `fetchChart` 712

**741** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 743
- `priceBroken` 775
- `baseBreakout` 780
- `isSqueeze` 791
- `isLongCandle` 816
- `waitOk` 827
- `waitBase` 834
- `waitFrom` 835
- `above5` 847
- `isBreakout` 848
- `reBreakFrom` 854
- `rawSignal` 869
- `entryLabel` 877
- `rawLabel` 881

**887** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 892
- `costBuy` 893
- `costSell` 894
- `newSeq` 896
- `seqBuy` 905
- `seqSellAll` 918
- `maN` 927
- `stepSeq` 933
- `seqResult` 964
- `rankScore` 972

**978** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 980

**1065** · 7. 종목 목록
- `marketCodes` 1068
- `screenPass` 1075
- `universeCodes` 1084
- `rowInfo` 1096
- `renderSymbols` 1111
- `renderScrBar` 1151

**1160** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1165
- `chartBars` 1168
- `setChart` 1174
- `loadChart` 1182
- `chartGeom` 1234
- `axisTag` 1243
- `drawChart` 1252
- `drawChartNow` 1257
- `renderTfBar` 1449
- `updateBarCount` 1454
- `renderChartHeader` 1458
- `selectCode` 1479
- `setTf` 1492
- `rightPad` 1500
- `setViewEnd` 1501
- `curEnd` 1511
- `stopGlide` 1512
- `zoom` 1578
- `pan` 1589

**1598** · 9. 백테스트 패널
- `recomputeAll` 1600
- `runBt` 1606
- `renderBt` 1613
- `drawEquity` 1646

**1669** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1671
- `plog` 1675
- `lastPrice` 1680

**1687** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1691
- `sessionDate` 1700
- `buyRate` 1707
- `sellRate` 1708
- `manualValue` 1709
- `reservedCash` 1710
- `reservedQty` 1711
- `strategyReserve` 1713
- `buyingPower` 1714
- `sellable` 1715
- `liveQuote` 1717
- `fillBuy` 1724
- `fillSell` 1741
- `submitOrder` 1764
- `cancelOrder` 1800
- `matchOrders` 1808
- `expireOrders` 1824
- `orderWatchTick` 1833

**1847** · ---- 주문창
- `ticketSync` 1850
- `renderTicket` 1860
- `ticketPct` 1886
- `stepPrice` 1894
- `withTodayBar` 1903
- `refreshQuotes` 1914
- `paperExit` 1929
- `paperDecide` 1943
- `renderPaper` 2029
- `scheduler` 2091

**2115** · 11. 설정 패널
- `renderSettings` 2117
- `readSettings` 2131

**2156** · 12. 이벤트 · 초기화
- `setTab` 2158
- `applyPanes` 2168
- `bindResizer` 2180
- `openHolding` 2227
- `sellNow` 2235
- `renderHoldInfo` 2255
- `toggleWatch` 2311
- `setMaster` 2323
- `loadMaster` 2331
- `searchMatches` 2341
- `renderSearch` 2369
- `openFromSearch` 2377
- `connectBridge` 2409
- `loadSaved` 2453
- `syncData` 2471
- `liveTick` 2525

**2566** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2571
- `rtStop` 2577
- `rtLoop` 2582
- `rtWanted` 2610
- `rtSubscribe` 2617
- `rtMsg` 2630
- `applyTick` 2637
- `updateMinuteBar` 2670
- `renderRtBadge` 2684
- `prevClose` 2696
- `chgTag` 2702
- `renderBook` 2703

**2756** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2761
- `sync` 2768
- `saveSync` 2775
- `syncPayload` 2778
- `hasActivity` 2781
- `syncHash` 2786
- `syncMark` 2793
- `applyRemote` 2800
- `syncPush` 2812
- `syncPull` 2834
- `renderSync` 2858

**2890** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2899
- `sgn` 2923
- `pctTxt` 2924
- `evidenceAt` 2927
- `computeResearch` 2982
- `refreshResearch` 3013
- `regimeChip` 3022
- `researchChart` 3027
- `renderResearch0` 3038
- `renderResearch` 3086

**3094** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3137
- `setSectors` 3144
- `loadSectors` 3149
- `sectorOf` 3157
- `scenarioCodes` 3219

**3221** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3222
- `aboveMa` 3228
- `median` 3236
- `avg` 3237
- `sectorStats` 3239

**3257** · ---- 뉴스
- `getNews` 3259
- `agoTxt` 3266
- `newsList` 3267

**3271** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3273
- `loadScenarioNews` 3283

**3293** · ---- 화면
- `chg` 3295
- `heat` 3296
- `stockLink` 3297
- `renderSectorTab` 3299
- `renderSectorDetail` 3321
- `renderScenarioTab` 3337
- `renderNewsTab` 3364
- `renderCenter` 3372
- `openCenter` 3386
- `runNews` 3395
- `fetchSector` 3403

**3460** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3471
- `liveBar` 3483
- `winRange` 3489
- `winLog` 3492
- `winScan` 3497
- `winEvaluate` 3514
- `winStep` 3537
- `winFinish` 3601
- `windowTick` 3622
- `renderWindow` 3643
- `loadMoreBars` 3651

**3657** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3663
- `briefFacts` 3681
- `loadAi` 3702
- `renderBriefTab` 3716

**3760** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3764
- `saveAiCfg` 3770
- `aiReady` 3774
- `aiPayload` 3777
- `renderAiBox` 3780
- `modelKind` 3795
- `readAiBox` 3801

**3860** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3865
- `pushFeed` 3866
- `aiAuto` 3871
- `askAi` 3872

**3878** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3879
- `entryCtx` 3894

**3899** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3909
- `btTrades` 3939
- `myTrades` 3952
- `journal` 3955
- `statLine` 3962

**3972** · ---- 주문 전 실수 방지 점검
- `guardCheck` 3973
- `showGuard` 4017
- `guardedSubmit` 4033

**4039** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4040
- `briefLines` 4067
- `assistOnSelect` 4080

**4097** · ---- 체결 직후 코멘트
- `assistOnTrade` 4098

**4113** · ---- 화면
- `renderAssistStrip` 4114
- `tableOf` 4121
- `renderAssist` 4133
- `foldOpen` 4164
- `fold` 4165
- `runAsk` 4198
- `calDays` 4216

**4222** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4227
- `marketRadarFacts` 4229
- `assistFacts` 4246
- `renderChat` 4264

**4278** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4279
- `grabActs` 4290
- `splitActions` 4305
- `plainSay` 4323
- `describeAct` 4327
- `findCode` 4349
- `confirmAct` 4358
- `runAction` 4373
- `settingAct` 4465
- `orderAct` 4489
- `runActions` 4503

**4513** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4517
- `saveCustom` 4521
- `safeId` 4524
- `attr` 4525
- `splitBlocks` 4527
- `applyBlocks` 4535
- `applyCss` 4563
- `calcInd` 4576
- `drawCustomInd` 4585
- `jsonSafe` 4630
- `widgetData` 4631
- `renderWidgets` 4662
- `renderCustomBox` 4701
- `customFacts` 4723

**4731** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4734
- `realConfirm` 4743
- `realSubmit` 4761
- `realCancel` 4792
- `realArm` 4798
- `realKill` 4808
- `renderReal` 4813
- `realFacts` 4849

**4855** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4858
- `setRangeMode` 4863
- `analyzeRange` 4871
- `similarSpots` 4900
- `startRange` 4925
- `endRange` 4932
- `openRangeCard` 4942
- `renderRangeCard` 4948
- `rangeFacts` 4971
- `saveMark` 4977
- `drawRanges` 5011
- `openMark` 5050
- `marksFacts` 5057
- `marksFold` 5062
- `verTxt` 5077
- `checkPageVersion` 5081

**5101** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5120
- `runRule` 5123
- `computeRules` 5133
- `dataSig` 5148
- `ruleTick` 5150
- `stopPrice` 5157
- `exitOrStop` 5161
- `exitSignal` 5166
- `btBrief` 5173
- `btDiff` 5174
- `selSignals` 5180
- `setRule` 5187
- `renderRules` 5197
- `rulesFacts` 5228
- `drawStrategyMarks` 5233

**5261** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5264
- `saveAlertCfg` 5265
- `alertSeen` 5266
- `alertOnce` 5267
- `raiseAlert` 5274
- `flushSay` 5283
- `showAlertCard` 5290
- `hm2min` 5302
- `alertTick` 5304
- `realFillCheck` 5343
- `renderAlertBtn` 5352

**5365** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5366
- `backtestWithRule` 5379
- `halfStats` 5396
- `setLabel` 5415
- `compareVariants` 5417
- `variantsFrom` 5447
- `runCompare` 5452
- `tableHtml` 5462

**5463** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5477
- `markIndex` 5478
- `roundT` 5487
- `extractRule` 5488
- `runExtract` 5537
- `extractFacts` 5567

**5568** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5570
- `importRecords` 5580

**5601** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5602

**5639** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5641
- `drawAct` 5642
- `drawClearAct` 5661
- `drawUserDraw` 5668
- `drawLegend` 5696
- `drawFacts` 5701

**5703** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5705
- `journalAdd` 5706
- `journalWhyAct` 5720
- `journalFold` 5728
- `journalFacts` 5755

**5767** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5770
- `cl` 5781
- `indDef` 5840
- `indLabel` 5841
- `clone` 5844
- `normalizeLook` 5845
- `lookSubs` 5859
- `lookSeries` 5862
- `strokeSeries` 5870
- `fillBetween` 5877
- `drawLookOverlays` 5887
- `drawLookSubs` 5899
- `numShort` 5938
- `lookLegend` 5939
- `renderLookCard` 5947
- `lookChanged` 5966
- `openLook` 5971
- `lkSet` 5977
- `lookAct` 6008
- `lookFacts` 6051

**6053** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6056
- `agendaKey` 6057
- `agendaFind` 6058
- `equityNow` 6059
- `freeCash` 6060
- `planBuyQty` 6061
- `agendaChecks` 6066
- `agendaCreate` 6094
- `agendaBrief` 6108
- `agendaGate` 6123
- `agendaDone` 6131
- `winActiveFor` 6132
- `paperBuyNow` 6134
- `agendaExecNow` 6152
- `agendaDecide` 6176
- `agendaExpire` 6190
- `agendaOutcome` 6197
- `agendaHistLine` 6202
- `renderAgenda` 6207
- `agendaFacts` 6278

**6288** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6289
- `applyExternalReply` 6299

**6330** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6336
- `idxPct` 6337
- `loadMarketQuotes` 6338
- `renderIdxBar` 6345
- `renderIndexTab` 6356
- `renderIndexToolbar` 6365
- `idxEnter` 6374
- `idxExit` 6395
- `marketFacts` 6406

**6410** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6413
- `invLevOf` 6414
- `invHeld` 6415
- `invDecision` 6417
- `invEvaluate` 6435
- `invExec` 6449
- `invBacktest` 6463
- `invBtLine` 6498
- `renderInv` 6500
- `invFacts` 6544
- `invChecks` 6557

**6576** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6577
- `renderManage` 6588
- `manageFacts` 6605
- `chatSend` 6609
- `convoNext` 6632
- `convoToggle` 6638
- `voiceSel` 6654
- `stopSpeaking` 6656
- `speechChunks` 6663
- `pcmToWavBlob` 6670
- `audioBlob` 6678
- `speakText` 6683
- `browserSpeak` 6717
- `micToggle` 6731
- `silenceMs` 6740
- `endWait` 6745
- `startSR` 6753
- `startRecorder` 6804

**6876** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 6884
- `mlpForward` 6889
- `aucOf` 6894
- `trainStyle` 6902
- `retrainStyle` 6953
- `predictWin` 6966
- `predictBin` 6973
- `styleProfile` 6980
- `renderStyle` 6989

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,829줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

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
- `ai_ask` 844
- `demo_daily` 870
- `_hash01` 902
- `demo_chart` 910
- `Hub` 965
- `_tick_size` 1004
- `_tick_msg` 1011
- `_book_msg` 1021
- `Realtime` 1030
- `DemoRealtime` 1211
- `_state_path` 1264
- `state_read` 1278
- `state_write` 1287
- `state_backup` 1308
- `trade_available` 1340
- `acct_mask` 1344
- `_day_used` 1348
- `_day_add` 1357
- `nh_trade_post` 1374
- `_msg` 1394
- `_block` 1401
- `trade_check_acct` 1406
- `trade_status` 1428
- `trade_log` 1437
- `trade_order` 1443
- `trade_cancel` 1499
- `trade_balance` 1515
- `trade_orders` 1536
- `Handler` 1555
- `ExclusiveServer` 1762
- `hidden_input` 1773
- `main` 1794
