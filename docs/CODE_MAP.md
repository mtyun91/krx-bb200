# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 6,691줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.22 · 2026-10-28 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**336** · 1. 설정 · 상태
- `tfInfo` 413
- `applySynced` 444
- `loadStore` 458
- `loadToken` 475
- `saveToken` 476
- `saveStore` 477
- `bgRun` 490
- `bgWorker` 491
- `bgEvery` 492

**495** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 497
- `hmToMin` 508
- `marketOpenNow` 509
- `tickSize` 514
- `tickFloor` 523
- `tickCeil` 524
- `won` 525
- `pct` 526
- `fmtDate` 527
- `nameOf` 528
- `esc` 529
- `toast` 530

**539** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 542
- `db` 554
- `cacheGet` 565
- `cachePut` 571
- `cacheAllDaily` 578
- `modeKey` 595
- `lastFinalClose` 598
- `isStale` 610
- `weekdaysSince` 616
- `fetchDaily` 626
- `isCore` 656
- `applyDaily` 660
- `bucketOf` 667
- `aggregateDaily` 673
- `chartWant` 687
- `fetchChart` 688

**717** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 719
- `priceBroken` 751
- `baseBreakout` 756
- `isSqueeze` 767
- `isLongCandle` 787
- `waitOk` 798
- `waitBase` 805
- `waitFrom` 806
- `above5` 818
- `isBreakout` 819
- `reBreakFrom` 825
- `rawSignal` 840
- `entryLabel` 848
- `rawLabel` 852

**858** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 863
- `costBuy` 864
- `costSell` 865
- `newSeq` 867
- `seqBuy` 873
- `seqSellAll` 886
- `maN` 895
- `stepSeq` 901
- `seqResult` 932
- `rankScore` 940

**946** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 948

**1033** · 7. 종목 목록
- `marketCodes` 1036
- `screenPass` 1043
- `universeCodes` 1052
- `rowInfo` 1063
- `renderSymbols` 1078
- `renderScrBar` 1118

**1127** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1132
- `chartBars` 1135
- `setChart` 1140
- `loadChart` 1148
- `chartGeom` 1200
- `axisTag` 1209
- `drawChart` 1218
- `drawChartNow` 1223
- `renderTfBar` 1413
- `updateBarCount` 1418
- `renderChartHeader` 1422
- `selectCode` 1443
- `setTf` 1456
- `rightPad` 1464
- `setViewEnd` 1465
- `curEnd` 1475
- `stopGlide` 1476
- `zoom` 1542
- `pan` 1553

**1562** · 9. 백테스트 패널
- `recomputeAll` 1564
- `runBt` 1570
- `renderBt` 1577
- `drawEquity` 1610

**1633** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1635
- `plog` 1639
- `lastPrice` 1644

**1651** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1655
- `sessionDate` 1664
- `buyRate` 1671
- `sellRate` 1672
- `manualValue` 1673
- `reservedCash` 1674
- `reservedQty` 1675
- `strategyReserve` 1677
- `buyingPower` 1678
- `sellable` 1679
- `liveQuote` 1681
- `fillBuy` 1688
- `fillSell` 1705
- `submitOrder` 1728
- `cancelOrder` 1764
- `matchOrders` 1772
- `expireOrders` 1788
- `orderWatchTick` 1797

**1811** · ---- 주문창
- `ticketSync` 1814
- `renderTicket` 1824
- `ticketPct` 1850
- `stepPrice` 1858
- `withTodayBar` 1867
- `refreshQuotes` 1878
- `paperExit` 1893
- `paperDecide` 1907
- `renderPaper` 1990
- `scheduler` 2052

**2076** · 11. 설정 패널
- `renderSettings` 2078
- `readSettings` 2092

**2117** · 12. 이벤트 · 초기화
- `setTab` 2119
- `applyPanes` 2129
- `bindResizer` 2141
- `openHolding` 2188
- `sellNow` 2196
- `renderHoldInfo` 2216
- `toggleWatch` 2271
- `setMaster` 2283
- `loadMaster` 2291
- `searchMatches` 2301
- `renderSearch` 2329
- `openFromSearch` 2337
- `connectBridge` 2369
- `loadSaved` 2413
- `syncData` 2431
- `liveTick` 2485

**2526** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2531
- `rtStop` 2537
- `rtLoop` 2542
- `rtWanted` 2570
- `rtSubscribe` 2577
- `rtMsg` 2590
- `applyTick` 2597
- `updateMinuteBar` 2630
- `renderRtBadge` 2644
- `prevClose` 2656
- `chgTag` 2662
- `renderBook` 2663

**2716** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2721
- `sync` 2728
- `saveSync` 2735
- `syncPayload` 2738
- `hasActivity` 2741
- `syncHash` 2746
- `syncMark` 2753
- `applyRemote` 2760
- `syncPush` 2772
- `syncPull` 2794
- `renderSync` 2818

**2850** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 2859
- `sgn` 2883
- `pctTxt` 2884
- `evidenceAt` 2887
- `computeResearch` 2942
- `refreshResearch` 2973
- `regimeChip` 2982
- `researchChart` 2987
- `renderResearch0` 2998
- `renderResearch` 3046

**3054** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3097
- `setSectors` 3104
- `loadSectors` 3109
- `sectorOf` 3117
- `scenarioCodes` 3179

**3181** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3182
- `aboveMa` 3188
- `median` 3196
- `avg` 3197
- `sectorStats` 3199

**3217** · ---- 뉴스
- `getNews` 3219
- `agoTxt` 3226
- `newsList` 3227

**3231** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3233
- `loadScenarioNews` 3243

**3253** · ---- 화면
- `chg` 3255
- `heat` 3256
- `stockLink` 3257
- `renderSectorTab` 3259
- `renderSectorDetail` 3281
- `renderScenarioTab` 3297
- `renderNewsTab` 3324
- `renderCenter` 3332
- `openCenter` 3344
- `runNews` 3353
- `fetchSector` 3361

**3418** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3429
- `liveBar` 3441
- `winRange` 3447
- `winLog` 3450
- `winScan` 3455
- `winEvaluate` 3472
- `winStep` 3494
- `winFinish` 3558
- `windowTick` 3579
- `renderWindow` 3600
- `loadMoreBars` 3608

**3614** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3620
- `briefFacts` 3638
- `loadAi` 3659
- `renderBriefTab` 3673

**3717** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3721
- `saveAiCfg` 3727
- `aiReady` 3731
- `aiPayload` 3734
- `renderAiBox` 3737
- `modelKind` 3752
- `readAiBox` 3758

**3817** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 3822
- `pushFeed` 3823
- `aiAuto` 3828
- `askAi` 3829

**3835** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 3836
- `entryCtx` 3851

**3856** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 3866
- `btTrades` 3896
- `myTrades` 3909
- `journal` 3912
- `statLine` 3919

**3929** · ---- 주문 전 실수 방지 점검
- `guardCheck` 3930
- `showGuard` 3974
- `guardedSubmit` 3990

**3996** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 3997
- `briefLines` 4024
- `assistOnSelect` 4037

**4054** · ---- 체결 직후 코멘트
- `assistOnTrade` 4055

**4070** · ---- 화면
- `renderAssistStrip` 4071
- `tableOf` 4078
- `renderAssist` 4090
- `foldOpen` 4121
- `fold` 4122
- `runAsk` 4155
- `calDays` 4173

**4179** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4184
- `marketRadarFacts` 4186
- `assistFacts` 4203
- `renderChat` 4221

**4235** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4236
- `grabActs` 4247
- `splitActions` 4262
- `plainSay` 4280
- `describeAct` 4284
- `findCode` 4306
- `confirmAct` 4315
- `runAction` 4330
- `settingAct` 4422
- `orderAct` 4446
- `runActions` 4460

**4470** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4474
- `saveCustom` 4478
- `safeId` 4481
- `attr` 4482
- `splitBlocks` 4484
- `applyBlocks` 4492
- `applyCss` 4520
- `calcInd` 4533
- `drawCustomInd` 4542
- `jsonSafe` 4587
- `widgetData` 4588
- `renderWidgets` 4619
- `renderCustomBox` 4658
- `customFacts` 4680

**4688** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4691
- `realConfirm` 4700
- `realSubmit` 4718
- `realCancel` 4749
- `realArm` 4755
- `realKill` 4765
- `renderReal` 4770
- `realFacts` 4806

**4812** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4815
- `setRangeMode` 4820
- `analyzeRange` 4828
- `similarSpots` 4857
- `startRange` 4882
- `endRange` 4889
- `openRangeCard` 4899
- `renderRangeCard` 4905
- `rangeFacts` 4928
- `saveMark` 4934
- `drawRanges` 4968
- `openMark` 5006
- `marksFacts` 5013
- `marksFold` 5018
- `verTxt` 5033
- `checkPageVersion` 5037

**5057** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5076
- `runRule` 5079
- `computeRules` 5089
- `dataSig` 5104
- `ruleTick` 5106
- `exitSignal` 5111
- `btBrief` 5118
- `btDiff` 5119
- `selSignals` 5125
- `setRule` 5132
- `renderRules` 5142
- `rulesFacts` 5173
- `drawStrategyMarks` 5178

**5206** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5209
- `saveAlertCfg` 5210
- `alertSeen` 5211
- `alertOnce` 5212
- `raiseAlert` 5219
- `flushSay` 5228
- `showAlertCard` 5235
- `hm2min` 5247
- `alertTick` 5249
- `realFillCheck` 5288
- `renderAlertBtn` 5297

**5310** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5311
- `backtestWithRule` 5324
- `halfStats` 5341
- `setLabel` 5360
- `compareVariants` 5362
- `variantsFrom` 5392
- `runCompare` 5397
- `tableHtml` 5407

**5408** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5422
- `markIndex` 5423
- `roundT` 5432
- `extractRule` 5433
- `runExtract` 5482
- `extractFacts` 5512

**5513** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5515
- `importRecords` 5525

**5546** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5547

**5584** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5586
- `drawAct` 5587
- `drawClearAct` 5606
- `drawUserDraw` 5613
- `drawLegend` 5641
- `drawFacts` 5646

**5648** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5650
- `journalAdd` 5651
- `journalWhyAct` 5665
- `journalFold` 5673
- `journalFacts` 5700

**5712** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5715
- `cl` 5726
- `indDef` 5785
- `indLabel` 5786
- `clone` 5789
- `normalizeLook` 5790
- `lookSubs` 5804
- `lookSeries` 5807
- `strokeSeries` 5815
- `fillBetween` 5822
- `drawLookOverlays` 5832
- `drawLookSubs` 5844
- `numShort` 5883
- `lookLegend` 5884
- `renderLookCard` 5892
- `lookChanged` 5911
- `openLook` 5916
- `lkSet` 5922
- `lookAct` 5953
- `lookFacts` 5996

**5998** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6001
- `agendaKey` 6002
- `agendaFind` 6003
- `equityNow` 6004
- `freeCash` 6005
- `planBuyQty` 6006
- `agendaChecks` 6011
- `agendaCreate` 6038
- `agendaBrief` 6052
- `agendaGate` 6067
- `agendaDone` 6075
- `winActiveFor` 6076
- `paperBuyNow` 6078
- `agendaExecNow` 6096
- `agendaDecide` 6112
- `agendaExpire` 6126
- `agendaOutcome` 6133
- `agendaHistLine` 6138
- `renderAgenda` 6143
- `agendaFacts` 6214

**6224** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6225
- `applyExternalReply` 6235
- `chatSend` 6265
- `convoNext` 6288
- `convoToggle` 6294
- `voiceSel` 6310
- `stopSpeaking` 6312
- `speechChunks` 6319
- `pcmToWavBlob` 6326
- `audioBlob` 6334
- `speakText` 6339
- `browserSpeak` 6373
- `micToggle` 6387
- `silenceMs` 6396
- `endWait` 6401
- `startSR` 6409
- `startRecorder` 6460

**6532** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 6540
- `mlpForward` 6545
- `aucOf` 6550
- `trainStyle` 6558
- `retrainStyle` 6609
- `predictWin` 6622
- `predictBin` 6629
- `styleProfile` 6636
- `renderStyle` 6645

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 1,749줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

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
- `ai_ask` 768
- `demo_daily` 794
- `_hash01` 826
- `demo_chart` 834
- `Hub` 889
- `_tick_size` 928
- `_tick_msg` 935
- `_book_msg` 945
- `Realtime` 954
- `DemoRealtime` 1135
- `_state_path` 1188
- `state_read` 1202
- `state_write` 1211
- `state_backup` 1232
- `trade_available` 1264
- `acct_mask` 1268
- `_day_used` 1272
- `_day_add` 1281
- `nh_trade_post` 1298
- `_msg` 1318
- `_block` 1325
- `trade_check_acct` 1330
- `trade_status` 1352
- `trade_log` 1361
- `trade_order` 1367
- `trade_cancel` 1423
- `trade_balance` 1439
- `trade_orders` 1460
- `Handler` 1479
- `ExclusiveServer` 1682
- `hidden_input` 1693
- `main` 1714
