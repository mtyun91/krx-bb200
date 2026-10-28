# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 6,779줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.23 · 2026-10-28 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**339** · 1. 설정 · 상태
- `tfInfo` 416
- `applySynced` 448
- `loadStore` 462
- `loadToken` 479
- `saveToken` 480
- `saveStore` 481
- `bgRun` 494
- `bgWorker` 495
- `bgEvery` 496

**499** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 501
- `hmToMin` 512
- `marketOpenNow` 513
- `tickSize` 518
- `tickFloor` 527
- `tickCeil` 528
- `won` 529
- `pct` 530
- `fmtDate` 531
- `nameOf` 532
- `esc` 533
- `toast` 534

**543** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 546
- `db` 558
- `cacheGet` 569
- `cachePut` 575
- `cacheAllDaily` 582
- `modeKey` 599
- `lastFinalClose` 602
- `isStale` 614
- `weekdaysSince` 620
- `fetchDaily` 630
- `isCore` 660
- `applyDaily` 664
- `bucketOf` 671
- `aggregateDaily` 677
- `chartWant` 691
- `fetchChart` 692

**721** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 723
- `priceBroken` 755
- `baseBreakout` 760
- `isSqueeze` 771
- `isLongCandle` 791
- `waitOk` 802
- `waitBase` 809
- `waitFrom` 810
- `above5` 822
- `isBreakout` 823
- `reBreakFrom` 829
- `rawSignal` 844
- `entryLabel` 852
- `rawLabel` 856

**862** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 867
- `costBuy` 868
- `costSell` 869
- `newSeq` 871
- `seqBuy` 877
- `seqSellAll` 890
- `maN` 899
- `stepSeq` 905
- `seqResult` 936
- `rankScore` 944

**950** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 952

**1037** · 7. 종목 목록
- `marketCodes` 1040
- `screenPass` 1047
- `universeCodes` 1056
- `rowInfo` 1067
- `renderSymbols` 1082
- `renderScrBar` 1122

**1131** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1136
- `chartBars` 1139
- `setChart` 1145
- `loadChart` 1153
- `chartGeom` 1205
- `axisTag` 1214
- `drawChart` 1223
- `drawChartNow` 1228
- `renderTfBar` 1418
- `updateBarCount` 1423
- `renderChartHeader` 1427
- `selectCode` 1448
- `setTf` 1461
- `rightPad` 1469
- `setViewEnd` 1470
- `curEnd` 1480
- `stopGlide` 1481
- `zoom` 1547
- `pan` 1558

**1567** · 9. 백테스트 패널
- `recomputeAll` 1569
- `runBt` 1575
- `renderBt` 1582
- `drawEquity` 1615

**1638** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1640
- `plog` 1644
- `lastPrice` 1649

**1656** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1660
- `sessionDate` 1669
- `buyRate` 1676
- `sellRate` 1677
- `manualValue` 1678
- `reservedCash` 1679
- `reservedQty` 1680
- `strategyReserve` 1682
- `buyingPower` 1683
- `sellable` 1684
- `liveQuote` 1686
- `fillBuy` 1693
- `fillSell` 1710
- `submitOrder` 1733
- `cancelOrder` 1769
- `matchOrders` 1777
- `expireOrders` 1793
- `orderWatchTick` 1802

**1816** · ---- 주문창
- `ticketSync` 1819
- `renderTicket` 1829
- `ticketPct` 1855
- `stepPrice` 1863
- `withTodayBar` 1872
- `refreshQuotes` 1883
- `paperExit` 1898
- `paperDecide` 1912
- `renderPaper` 1995
- `scheduler` 2057

**2081** · 11. 설정 패널
- `renderSettings` 2083
- `readSettings` 2097

**2122** · 12. 이벤트 · 초기화
- `setTab` 2124
- `applyPanes` 2134
- `bindResizer` 2146
- `openHolding` 2193
- `sellNow` 2201
- `renderHoldInfo` 2221
- `toggleWatch` 2276
- `setMaster` 2288
- `loadMaster` 2296
- `searchMatches` 2306
- `renderSearch` 2334
- `openFromSearch` 2342
- `connectBridge` 2374
- `loadSaved` 2418
- `syncData` 2436
- `liveTick` 2490

**2531** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2536
- `rtStop` 2542
- `rtLoop` 2547
- `rtWanted` 2575
- `rtSubscribe` 2582
- `rtMsg` 2595
- `applyTick` 2602
- `updateMinuteBar` 2635
- `renderRtBadge` 2649
- `prevClose` 2661
- `chgTag` 2667
- `renderBook` 2668

**2721** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2726
- `sync` 2733
- `saveSync` 2740
- `syncPayload` 2743
- `hasActivity` 2746
- `syncHash` 2751
- `syncMark` 2758
- `applyRemote` 2765
- `syncPush` 2777
- `syncPull` 2799
- `renderSync` 2823

**2855** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2864
- `sgn` 2888
- `pctTxt` 2889
- `evidenceAt` 2892
- `computeResearch` 2947
- `refreshResearch` 2978
- `regimeChip` 2987
- `researchChart` 2992
- `renderResearch0` 3003
- `renderResearch` 3051

**3059** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3102
- `setSectors` 3109
- `loadSectors` 3114
- `sectorOf` 3122
- `scenarioCodes` 3184

**3186** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3187
- `aboveMa` 3193
- `median` 3201
- `avg` 3202
- `sectorStats` 3204

**3222** · ---- 뉴스
- `getNews` 3224
- `agoTxt` 3231
- `newsList` 3232

**3236** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3238
- `loadScenarioNews` 3248

**3258** · ---- 화면
- `chg` 3260
- `heat` 3261
- `stockLink` 3262
- `renderSectorTab` 3264
- `renderSectorDetail` 3286
- `renderScenarioTab` 3302
- `renderNewsTab` 3329
- `renderCenter` 3337
- `openCenter` 3351
- `runNews` 3360
- `fetchSector` 3368

**3425** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3436
- `liveBar` 3448
- `winRange` 3454
- `winLog` 3457
- `winScan` 3462
- `winEvaluate` 3479
- `winStep` 3501
- `winFinish` 3565
- `windowTick` 3586
- `renderWindow` 3607
- `loadMoreBars` 3615

**3621** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3627
- `briefFacts` 3645
- `loadAi` 3666
- `renderBriefTab` 3680

**3724** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3728
- `saveAiCfg` 3734
- `aiReady` 3738
- `aiPayload` 3741
- `renderAiBox` 3744
- `modelKind` 3759
- `readAiBox` 3765

**3824** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3829
- `pushFeed` 3830
- `aiAuto` 3835
- `askAi` 3836

**3842** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3843
- `entryCtx` 3858

**3863** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3873
- `btTrades` 3903
- `myTrades` 3916
- `journal` 3919
- `statLine` 3926

**3936** · ---- 주문 전 실수 방지 점검
- `guardCheck` 3937
- `showGuard` 3981
- `guardedSubmit` 3997

**4003** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4004
- `briefLines` 4031
- `assistOnSelect` 4044

**4061** · ---- 체결 직후 코멘트
- `assistOnTrade` 4062

**4077** · ---- 화면
- `renderAssistStrip` 4078
- `tableOf` 4085
- `renderAssist` 4097
- `foldOpen` 4128
- `fold` 4129
- `runAsk` 4162
- `calDays` 4180

**4186** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4191
- `marketRadarFacts` 4193
- `assistFacts` 4210
- `renderChat` 4228

**4242** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4243
- `grabActs` 4254
- `splitActions` 4269
- `plainSay` 4287
- `describeAct` 4291
- `findCode` 4313
- `confirmAct` 4322
- `runAction` 4337
- `settingAct` 4429
- `orderAct` 4453
- `runActions` 4467

**4477** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4481
- `saveCustom` 4485
- `safeId` 4488
- `attr` 4489
- `splitBlocks` 4491
- `applyBlocks` 4499
- `applyCss` 4527
- `calcInd` 4540
- `drawCustomInd` 4549
- `jsonSafe` 4594
- `widgetData` 4595
- `renderWidgets` 4626
- `renderCustomBox` 4665
- `customFacts` 4687

**4695** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4698
- `realConfirm` 4707
- `realSubmit` 4725
- `realCancel` 4756
- `realArm` 4762
- `realKill` 4772
- `renderReal` 4777
- `realFacts` 4813

**4819** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4822
- `setRangeMode` 4827
- `analyzeRange` 4835
- `similarSpots` 4864
- `startRange` 4889
- `endRange` 4896
- `openRangeCard` 4906
- `renderRangeCard` 4912
- `rangeFacts` 4935
- `saveMark` 4941
- `drawRanges` 4975
- `openMark` 5014
- `marksFacts` 5021
- `marksFold` 5026
- `verTxt` 5041
- `checkPageVersion` 5045

**5065** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5084
- `runRule` 5087
- `computeRules` 5097
- `dataSig` 5112
- `ruleTick` 5114
- `exitSignal` 5119
- `btBrief` 5126
- `btDiff` 5127
- `selSignals` 5133
- `setRule` 5140
- `renderRules` 5150
- `rulesFacts` 5181
- `drawStrategyMarks` 5186

**5214** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5217
- `saveAlertCfg` 5218
- `alertSeen` 5219
- `alertOnce` 5220
- `raiseAlert` 5227
- `flushSay` 5236
- `showAlertCard` 5243
- `hm2min` 5255
- `alertTick` 5257
- `realFillCheck` 5296
- `renderAlertBtn` 5305

**5318** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5319
- `backtestWithRule` 5332
- `halfStats` 5349
- `setLabel` 5368
- `compareVariants` 5370
- `variantsFrom` 5400
- `runCompare` 5405
- `tableHtml` 5415

**5416** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5430
- `markIndex` 5431
- `roundT` 5440
- `extractRule` 5441
- `runExtract` 5490
- `extractFacts` 5520

**5521** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5523
- `importRecords` 5533

**5554** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5555

**5592** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5594
- `drawAct` 5595
- `drawClearAct` 5614
- `drawUserDraw` 5621
- `drawLegend` 5649
- `drawFacts` 5654

**5656** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5658
- `journalAdd` 5659
- `journalWhyAct` 5673
- `journalFold` 5681
- `journalFacts` 5708

**5720** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5723
- `cl` 5734
- `indDef` 5793
- `indLabel` 5794
- `clone` 5797
- `normalizeLook` 5798
- `lookSubs` 5812
- `lookSeries` 5815
- `strokeSeries` 5823
- `fillBetween` 5830
- `drawLookOverlays` 5840
- `drawLookSubs` 5852
- `numShort` 5891
- `lookLegend` 5892
- `renderLookCard` 5900
- `lookChanged` 5919
- `openLook` 5924
- `lkSet` 5930
- `lookAct` 5961
- `lookFacts` 6004

**6006** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6009
- `agendaKey` 6010
- `agendaFind` 6011
- `equityNow` 6012
- `freeCash` 6013
- `planBuyQty` 6014
- `agendaChecks` 6019
- `agendaCreate` 6046
- `agendaBrief` 6060
- `agendaGate` 6075
- `agendaDone` 6083
- `winActiveFor` 6084
- `paperBuyNow` 6086
- `agendaExecNow` 6104
- `agendaDecide` 6120
- `agendaExpire` 6134
- `agendaOutcome` 6141
- `agendaHistLine` 6146
- `renderAgenda` 6151
- `agendaFacts` 6222

**6232** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6233
- `applyExternalReply` 6243

**6273** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6279
- `idxPct` 6280
- `loadMarketQuotes` 6281
- `renderIdxBar` 6288
- `renderIndexTab` 6299
- `renderIndexToolbar` 6308
- `idxEnter` 6317
- `idxExit` 6338
- `marketFacts` 6349
- `chatSend` 6353
- `convoNext` 6376
- `convoToggle` 6382
- `voiceSel` 6398
- `stopSpeaking` 6400
- `speechChunks` 6407
- `pcmToWavBlob` 6414
- `audioBlob` 6422
- `speakText` 6427
- `browserSpeak` 6461
- `micToggle` 6475
- `silenceMs` 6484
- `endWait` 6489
- `startSR` 6497
- `startRecorder` 6548

**6620** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 6628
- `mlpForward` 6633
- `aucOf` 6638
- `trainStyle` 6646
- `retrainStyle` 6697
- `predictWin` 6710
- `predictBin` 6717
- `styleProfile` 6724
- `renderStyle` 6733

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,827줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

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
- `ai_ask` 842
- `demo_daily` 868
- `_hash01` 900
- `demo_chart` 908
- `Hub` 963
- `_tick_size` 1002
- `_tick_msg` 1009
- `_book_msg` 1019
- `Realtime` 1028
- `DemoRealtime` 1209
- `_state_path` 1262
- `state_read` 1276
- `state_write` 1285
- `state_backup` 1306
- `trade_available` 1338
- `acct_mask` 1342
- `_day_used` 1346
- `_day_add` 1355
- `nh_trade_post` 1372
- `_msg` 1392
- `_block` 1399
- `trade_check_acct` 1404
- `trade_status` 1426
- `trade_log` 1435
- `trade_order` 1441
- `trade_cancel` 1497
- `trade_balance` 1513
- `trade_orders` 1534
- `Handler` 1553
- `ExclusiveServer` 1760
- `hidden_input` 1771
- `main` 1792
