# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,061줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.26 · 2026-10-29 (pre-commit 훅이 자동으로 올림)

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
- `settingAct` 4489
- `orderAct` 4513
- `runActions` 4527

**4537** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4541
- `saveCustom` 4545
- `safeId` 4548
- `attr` 4549
- `splitBlocks` 4551
- `applyBlocks` 4559
- `applyCss` 4587
- `calcInd` 4600
- `drawCustomInd` 4609
- `jsonSafe` 4654
- `widgetData` 4655
- `renderWidgets` 4686
- `renderCustomBox` 4725
- `customFacts` 4747

**4755** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4758
- `realConfirm` 4767
- `realSubmit` 4785
- `realCancel` 4816
- `realArm` 4822
- `realKill` 4832
- `renderReal` 4837
- `realFacts` 4873

**4879** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 4882
- `setRangeMode` 4887
- `analyzeRange` 4895
- `similarSpots` 4924
- `startRange` 4949
- `endRange` 4956
- `openRangeCard` 4966
- `renderRangeCard` 4972
- `rangeFacts` 4995
- `saveMark` 5001
- `drawRanges` 5035
- `openMark` 5074
- `marksFacts` 5081
- `marksFold` 5086
- `verTxt` 5101
- `checkPageVersion` 5105

**5125** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5144
- `runRule` 5147
- `computeRules` 5157
- `dataSig` 5172
- `ruleTick` 5174
- `stopPrice` 5181
- `exitOrStop` 5185
- `exitSignal` 5190
- `btBrief` 5197
- `btDiff` 5198
- `selSignals` 5204
- `setRule` 5211
- `renderRules` 5221
- `rulesFacts` 5252
- `drawStrategyMarks` 5257

**5285** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5288
- `saveAlertCfg` 5289
- `alertSeen` 5290
- `alertOnce` 5291
- `raiseAlert` 5298
- `flushSay` 5307
- `showAlertCard` 5314
- `hm2min` 5326
- `alertTick` 5328
- `realFillCheck` 5367
- `renderAlertBtn` 5376

**5389** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5390
- `backtestWithRule` 5403
- `halfStats` 5420
- `setLabel` 5441
- `compareVariants` 5443
- `variantsFrom` 5473
- `runCompare` 5478
- `tableHtml` 5488

**5489** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5503
- `markIndex` 5504
- `roundT` 5513
- `extractRule` 5514
- `runExtract` 5563
- `extractFacts` 5593

**5594** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5596
- `importRecords` 5606

**5627** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5628

**5665** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5667
- `drawAct` 5668
- `drawClearAct` 5687
- `drawUserDraw` 5694
- `drawLegend` 5722
- `drawFacts` 5727

**5729** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5731
- `journalAdd` 5732
- `journalWhyAct` 5746
- `journalFold` 5754
- `journalFacts` 5781

**5793** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5796
- `cl` 5807
- `indDef` 5866
- `indLabel` 5867
- `clone` 5870
- `normalizeLook` 5871
- `lookSubs` 5885
- `lookSeries` 5888
- `strokeSeries` 5896
- `fillBetween` 5903
- `drawLookOverlays` 5913
- `drawLookSubs` 5925
- `numShort` 5964
- `lookLegend` 5965
- `renderLookCard` 5973
- `lookChanged` 5992
- `openLook` 5997
- `lkSet` 6003
- `lookAct` 6034
- `lookFacts` 6077

**6079** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6082
- `agendaKey` 6083
- `agendaFind` 6084
- `equityNow` 6085
- `freeCash` 6086
- `planBuyQty` 6087
- `agendaChecks` 6092
- `agendaCreate` 6120
- `agendaBrief` 6134
- `agendaGate` 6149
- `agendaDone` 6157
- `winActiveFor` 6158
- `paperBuyNow` 6160
- `agendaExecNow` 6178
- `agendaDecide` 6202
- `agendaExpire` 6216
- `agendaOutcome` 6223
- `agendaHistLine` 6228
- `renderAgenda` 6233
- `agendaFacts` 6304

**6314** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6315
- `applyExternalReply` 6325

**6356** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6362
- `idxPct` 6363
- `loadMarketQuotes` 6364
- `renderIdxBar` 6371
- `renderIndexTab` 6382
- `renderIndexToolbar` 6391
- `idxEnter` 6400
- `idxExit` 6421
- `marketFacts` 6432

**6436** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6439
- `invLevOf` 6440
- `invHeld` 6441
- `invDecision` 6443
- `invEvaluate` 6461
- `invExec` 6475
- `invBacktest` 6489
- `invBtLine` 6524
- `renderInv` 6526
- `invFacts` 6570
- `invChecks` 6583

**6602** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6603
- `renderManage` 6614
- `manageFacts` 6631
- `chatSend` 6635
- `convoNext` 6658
- `convoToggle` 6664
- `voiceSel` 6680
- `stopSpeaking` 6682
- `speechChunks` 6689
- `pcmToWavBlob` 6696
- `audioBlob` 6704
- `speakText` 6709
- `browserSpeak` 6743
- `micToggle` 6757
- `silenceMs` 6766
- `endWait` 6771
- `startSR` 6779
- `startRecorder` 6830

**6902** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 6910
- `mlpForward` 6915
- `aucOf` 6920
- `trainStyle` 6928
- `retrainStyle` 6979
- `predictWin` 6992
- `predictBin` 6999
- `styleProfile` 7006
- `renderStyle` 7015

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

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
