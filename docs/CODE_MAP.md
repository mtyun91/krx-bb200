# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 8,104줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.40 · 2026-11-05 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**366** · 1. 설정 · 상태
- `tfInfo` 491
- `applySynced` 526
- `loadStore` 557
- `loadToken` 574
- `saveToken` 575
- `saveStore` 576
- `bgRun` 589
- `bgWorker` 590
- `bgEvery` 591

**594** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 596
- `hmToMin` 607

**608** · ---- 휴장일: 한국거래소 공휴일·연말 휴장 (2026~2027) + 설정 '휴장일 더하기' — 휴장일에는 장중 판단·시세 재조회를 하지 않음
- `userHolidays` 611
- `isHoliday` 612
- `isTradingDay` 613
- `marketOpenNow` 614
- `tickSize` 619
- `tickFloor` 628
- `tickCeil` 629
- `won` 630
- `pct` 631
- `fmtDate` 632
- `nameOf` 633
- `esc` 634
- `toast` 636

**651** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridgeTimeout` 655
- `bridge` 656
- `db` 676
- `cacheGet` 687
- `cachePut` 693
- `cacheAllDaily` 700
- `modeKey` 717
- `lastFinalClose` 720
- `isStale` 732
- `weekdaysSince` 738
- `fetchDaily` 748
- `isCore` 778
- `applyDaily` 782
- `bucketOf` 789
- `aggregateDaily` 795
- `chartWant` 809
- `fetchChart` 810

**839** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 841
- `priceBroken` 878

**883** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 885
- `loadCaps` 886
- `codeOfBars` 894
- `capOf` 900
- `breadthAt` 904
- `bbCross` 930
- `structWhy` 943
- `baseBreakout` 960
- `widthLow` 967
- `isAccum` 975
- `accSqueeze` 983
- `squeezeCore` 993
- `sqKey` 1017
- `isSqueeze` 1019
- `squeezeSetup` 1027
- `isLongCandle` 1035
- `waitOk` 1046
- `phInfo` 1055
- `waitBase` 1067
- `waitFrom` 1068
- `above5` 1080
- `coreBreakout` 1081

**1085** · ---- 일봉 후보와 매수 가격 분리: 돌파 당일 또는 다음 며칠의 5일선 지지
- `pullbackSignal` 1086
- `isBreakout` 1097
- `reBreakFrom` 1104
- `sqFollowFrom` 1121
- `rawSignal` 1135
- `entryLabel` 1144
- `rawLabel` 1150

**1157** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1162
- `stratText` 1164
- `costBuy` 1168
- `costSell` 1169
- `newSeq` 1171

**1183** · ---- 계획 손실: 구조적 손절선까지 비용 포함 손실로 수량 제한 (갭·체결 지연은 별도)
- `plannedRisk` 1184
- `entryRiskBudget` 1188
- `seqBuy` 1198
- `tpTarget` 1218
- `seqSellHalf` 1219
- `seqSellAll` 1230
- `maN` 1239
- `stepSeq` 1245
- `seqResult` 1282
- `rankScore` 1290

**1296** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1298

**1383** · 7. 종목 목록
- `marketCodes` 1386
- `screenPass` 1393
- `universeCodes` 1402
- `rowInfo` 1414
- `renderSymbols` 1430
- `renderScrBar` 1471

**1480** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1485
- `chartBars` 1488
- `setChart` 1494
- `loadChart` 1502
- `chartGeom` 1554
- `axisTag` 1563
- `drawChart` 1572
- `drawChartNow` 1577
- `renderTfBar` 1769
- `updateBarCount` 1774
- `renderChartHeader` 1778
- `selectCode` 1799
- `setTf` 1812
- `rightPad` 1820
- `setViewEnd` 1821
- `curEnd` 1831
- `stopGlide` 1832
- `zoom` 1898
- `pan` 1909

**1918** · 9. 백테스트 패널
- `recomputeAll` 1920
- `runBt` 1926
- `renderBt` 1933
- `drawEquity` 1966

**1989** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1991
- `plog` 1995
- `lastPrice` 2000

**2007** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 2011
- `sessionDate` 2020
- `buyRate` 2027
- `sellRate` 2028
- `manualValue` 2029
- `reservedCash` 2030
- `reservedQty` 2031
- `strategyReserve` 2033
- `buyingPower` 2034
- `sellable` 2035
- `liveQuote` 2037
- `fillBuy` 2044
- `fillSell` 2061
- `submitOrder` 2084
- `cancelOrder` 2120
- `matchOrders` 2128
- `expireOrders` 2144
- `orderWatchTick` 2153

**2167** · ---- 주문창
- `ticketSync` 2170
- `renderTicket` 2180
- `ticketPct` 2206
- `stepPrice` 2214
- `withTodayBar` 2223
- `refreshQuotes` 2234
- `paperSellHalf` 2249
- `paperExit` 2260
- `paperDecide` 2274
- `renderPaper` 2363
- `scheduler` 2425

**2449** · 11. 설정 패널

**2451** · ---- 설정 찾기 · 바뀐 값 표시: 위 검색칸에 낱말을 넣으면 그 항목만, '바꾼 것만'을 켜면 기본값과 다른 항목만 보임 (● = 기본값과 다름)
- `sameVal` 2453
- `renderSettings` 2455
- `readSettings` 2494
- `setLabelOf` 2508

**2527** · 12. 이벤트 · 초기화
- `setTab` 2529
- `applyPanes` 2539
- `bindResizer` 2551
- `openHolding` 2598
- `sellNow` 2606
- `renderHoldInfo` 2626
- `toggleWatch` 2682
- `setMaster` 2694
- `loadMaster` 2702
- `searchMatches` 2712
- `renderSearch` 2740
- `openFromSearch` 2748

**2764** · ---- 단축키 (? 로 안내): / 검색 · 1~4 오른쪽 탭 · [ ] 패널 · S 관심 · D W M 주기 · + − 확대 · End 최신 · R 리서치 센터
- `showKeys` 2766
- `popOpen` 2769
- `connectBridge` 2802

**2844** · ---- 중계기 연결 감시: 20초마다 확인 → 두 번 연속 응답이 없으면 '끊김'으로 표시하고, 다시 켜지면 저절로 이어 붙음
- `connWatch` 2846
- `loadSaved` 2875
- `syncData` 2893
- `liveTick` 2947

**2988** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2993
- `rtStop` 2999
- `rtLoop` 3004
- `rtWanted` 3032
- `rtSubscribe` 3040
- `rtMsg` 3053
- `applyTick` 3061
- `updateMinuteBar` 3094
- `renderRtBadge` 3108
- `prevClose` 3120
- `chgTag` 3126
- `renderBook` 3127

**3180** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 3185
- `sync` 3192
- `saveSync` 3199
- `syncPayload` 3202
- `hasActivity` 3205
- `syncHash` 3210
- `syncMark` 3217
- `applyRemote` 3224
- `syncPush` 3236
- `syncPull` 3258
- `renderSync` 3282

**3314** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3323
- `sgn` 3347
- `pctTxt` 3348
- `evidenceAt` 3351
- `computeResearch` 3406
- `refreshResearch` 3437
- `regimeChip` 3446
- `researchChart` 3451
- `renderResearch0` 3462
- `renderResearch` 3510

**3518** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3561
- `setSectors` 3568
- `loadSectors` 3573
- `sectorOf` 3581
- `scenarioCodes` 3643

**3645** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3646
- `aboveMa` 3652
- `median` 3660
- `avg` 3661
- `sectorStats` 3663

**3681** · ---- 뉴스
- `getNews` 3683
- `agoTxt` 3690
- `newsList` 3691

**3695** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3697
- `loadScenarioNews` 3707

**3717** · ---- 화면
- `chg` 3719
- `heat` 3720
- `stockLink` 3721
- `renderSectorTab` 3723
- `renderSectorDetail` 3745
- `renderScenarioTab` 3761
- `renderNewsTab` 3788
- `renderCenter` 3796
- `openCenter` 3810
- `runNews` 3819
- `fetchSector` 3827

**3883** · ---- 진입 대응표: 가격 위험·수급 근거·분봉 실행을 구분 (점수는 확률이 아님)
- `refreshExecutionMinutes` 3885
- `minuteEvidence` 3894
- `executionPlan` 3909
- `executionPlanHtml` 3931
- `executionGate` 3943

**3949** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3960
- `liveBar` 3973
- `winRange` 3979
- `winLog` 3982
- `winScan` 3987
- `winEvaluate` 4005
- `winStep` 4034
- `winFinish` 4113
- `windowTick` 4134
- `renderWindow` 4155
- `loadMoreBars` 4163

**4169** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 4175
- `briefFacts` 4193
- `loadAi` 4214
- `renderBriefTab` 4228

**4272** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 4276
- `saveAiCfg` 4282
- `aiReady` 4286
- `aiPayload` 4289
- `renderAiBox` 4292
- `modelKind` 4307
- `readAiBox` 4313

**4372** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 4377
- `pushFeed` 4378
- `aiAuto` 4383
- `askAi` 4384

**4390** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 4391
- `entryCtx` 4414

**4419** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4429
- `btTrades` 4459
- `myTrades` 4472
- `journal` 4475
- `statLine` 4482

**4492** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4493
- `showGuard` 4537
- `guardedSubmit` 4553

**4559** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4560
- `briefLines` 4587
- `assistOnSelect` 4600

**4617** · ---- 체결 직후 코멘트
- `assistOnTrade` 4618

**4633** · ---- 화면
- `renderAssistStrip` 4634
- `tableOf` 4641
- `renderAssist` 4653
- `foldOpen` 4684
- `fold` 4685
- `runAsk` 4719
- `calDays` 4738

**4744** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4749
- `marketRadarFacts` 4751
- `assistFacts` 4768
- `renderChat` 4787

**4801** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4802
- `grabActs` 4813
- `splitActions` 4828
- `plainSay` 4846
- `describeAct` 4850
- `findCode` 4872
- `confirmAct` 4881
- `runAction` 4896
- `settingAct` 5041
- `orderAct` 5065
- `runActions` 5079

**5089** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 5093
- `saveCustom` 5097
- `safeId` 5100
- `attr` 5101
- `splitBlocks` 5103
- `applyBlocks` 5111
- `applyCss` 5139
- `calcInd` 5152
- `drawCustomInd` 5161
- `jsonSafe` 5206
- `widgetData` 5207
- `renderWidgets` 5238
- `renderCustomBox` 5277
- `customFacts` 5299

**5307** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 5310
- `realConfirm` 5319
- `realSubmit` 5337
- `realCancel` 5368
- `realArm` 5374
- `realKill` 5384
- `renderReal` 5389
- `realFacts` 5425

**5431** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5434
- `setRangeMode` 5439
- `analyzeRange` 5447
- `similarSpots` 5481
- `startRange` 5506
- `endRange` 5513
- `openRangeCard` 5523
- `renderRangeCard` 5529
- `rangeFacts` 5552
- `saveMark` 5558
- `drawRanges` 5592
- `openMark` 5631
- `marksFacts` 5638
- `marksFold` 5643
- `verTxt` 5658
- `checkPageVersion` 5662

**5682** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5701
- `runRule` 5704
- `computeRules` 5714
- `dataSig` 5729
- `ruleTick` 5731
- `stopPrice` 5738
- `exitOrStop` 5743
- `exitSignal` 5758
- `btBrief` 5769
- `btDiff` 5770
- `selSignals` 5776
- `setRule` 5783
- `renderRules` 5793
- `rulesFacts` 5828
- `drawStrategyMarks` 5833

**5870** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5873
- `saveAlertCfg` 5874
- `alertSeen` 5875
- `alertOnce` 5876
- `raiseAlert` 5883
- `flushSay` 5893
- `showAlertCard` 5900
- `hm2min` 5912
- `alertTick` 5914
- `realFillCheck` 5953
- `renderAlertBtn` 5962

**5975** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5976
- `backtestWithRule` 5989
- `halfStats` 6006
- `setLabel` 6058
- `compareVariants` 6060
- `variantsFrom` 6091
- `runCompare` 6096
- `tableHtml` 6106

**6107** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 6124
- `markIndex` 6125
- `roundT` 6134
- `extractRule` 6135
- `runExtract` 6184
- `extractFacts` 6215

**6216** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 6218

**6228** · ---- 엑셀로 저장: 백테스트 거래 · 매매 일지 · 모의 매매 기록을 CSV로 (엑셀에서 한글이 깨지지 않게 BOM 포함)
- `downloadCsv` 6229
- `ymdDot` 6245
- `kstTime` 6246
- `exportBtCsv` 6247
- `exportJournalCsv` 6254
- `importRecords` 6259

**6280** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 6281

**6318** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 6320
- `drawAct` 6321
- `drawClearAct` 6340
- `drawUserDraw` 6347
- `drawLegend` 6375
- `drawFacts` 6380

**6382** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 6384
- `journalAdd` 6385
- `journalWhyAct` 6399
- `journalFold` 6407
- `journalFacts` 6435

**6447** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 6450
- `cl` 6461
- `indDef` 6524
- `indLabel` 6525
- `clone` 6528
- `normalizeLook` 6529
- `lookSubs` 6547
- `lookSeries` 6550
- `strokeSeries` 6558
- `fillBetween` 6565

**6575** · ---- 매물대: 가격대별 거래량 — 봉마다 거래량을 저가~고가에 고르게 나눠 칸에 쌓음 (양봉 거래량 · 음봉 거래량 따로)
- `vpBins` 6576
- `drawVP` 6591
- `vpFacts` 6615
- `drawLookOverlays` 6624
- `drawLookSubs` 6637
- `numShort` 6676
- `lookLegend` 6677
- `renderLookCard` 6685
- `lookChanged` 6705
- `openLook` 6710
- `lkSet` 6716
- `lookAct` 6747
- `lookFacts` 6790

**6792** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6795
- `agendaKey` 6796
- `agendaFind` 6797
- `equityNow` 6798
- `freeCash` 6799
- `planBuyQty` 6800
- `agendaChecks` 6809
- `agendaCreate` 6859
- `agendaBrief` 6874
- `agendaGate` 6889
- `agendaDone` 6897
- `winActiveFor` 6898
- `paperBuyNow` 6900
- `agendaExecNow` 6920
- `agendaDecide` 6946
- `agendaExpire` 6960
- `agendaOutcome` 6967
- `agendaHistLine` 6972
- `renderAgenda` 6977
- `agendaFacts` 7048

**7058** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 7059
- `applyExternalReply` 7069

**7100** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 7106
- `idxPct` 7107
- `loadMarketQuotes` 7108
- `renderIdxBar` 7115
- `renderIndexTab` 7126
- `renderIndexToolbar` 7135
- `idxEnter` 7144
- `idxExit` 7165
- `marketFacts` 7176

**7180** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 7183
- `invLevOf` 7184
- `invHeld` 7185
- `invDecision` 7187
- `invEvaluate` 7205
- `invExec` 7219
- `invBacktest` 7233
- `invBtLine` 7268
- `renderInv` 7270
- `invFacts` 7314
- `invChecks` 7327

**7346** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 7347
- `renderManage` 7360
- `manageFacts` 7378

**7382** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 7384
- `newsAgo` 7390
- `renderNewsTicker` 7391
- `topNewsFacts` 7411

**7414** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 7415

**7422** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 7425
- `waitCodes` 7441
- `renderWait` 7442
- `waitAlerts` 7455

**7461** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 7464

**7495** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 7498
- `savePhone` 7499
- `phoneNotify` 7501
- `renderPhone` 7509

**7541** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 7545
- `tgReply` 7550
- `agShort` 7554
- `agByShort` 7555
- `tgHandle` 7558
- `tgStart` 7629
- `savePin` 7637
- `chatSend` 7642
- `convoNext` 7668
- `convoToggle` 7674
- `voiceSel` 7690
- `stopSpeaking` 7692
- `speechChunks` 7699
- `pcmToWavBlob` 7706
- `audioBlob` 7714
- `speakText` 7719
- `browserSpeak` 7753
- `micToggle` 7767
- `silenceMs` 7776
- `endWait` 7781
- `startSR` 7789
- `startRecorder` 7840

**7912** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7920
- `mlpForward` 7925
- `aucOf` 7930
- `trainStyle` 7938
- `retrainStyle` 7997
- `predictWin` 8010
- `predictBin` 8017
- `styleProfile` 8024

**8033** · ---- 드래그 선호: 수익률과 분리해 진입·청산 때의 모양을 각각 비교
- `preferenceMatch` 8034
- `preferenceText` 8050
- `renderStyle` 8056

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `riskPct`, `totalRiskPct`, `sqOrdered`, `sqConverge`, `pullbackDays`, `entryRiskMax`, `minuteGate`, `exitConfirm`, `exitGrace`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `phOn`, `phCap`, `phDays`, `brOn`, `brMin`, `sigCap`, `obvNeed`, `obvDays`, `closeTop`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `tpPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`, `holidays`, `stratV`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `vp` 매물대(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `cmf` CMF(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

## nh_bridge_core.py

총 2,043줄. 표준 라이브러리 HTTP 서버(`Handler`). 실행기 `nh_bridge.py`가 띄움.

### 주소 (POST JSON, 헤더에 토큰)

`/ai/ask`, `/ai/stt`, `/ai/test`, `/ai/tts`, `/krx/caps`, `/krx/chart`, `/krx/daily`, `/krx/master`, `/krx/sectors`, `/market/index`, `/market/quotes`, `/news`, `/news/top`, `/notify/telegram`, `/notify/telegram_chat`, `/notify/tg_start`, `/notify/tg_stop`, `/rt/stream`, `/rt/subscribe`, `/state/get`, `/state/put`, `/trade/arm`, `/trade/*`(실계좌 — 상태·잔고·주문·취소·정지)

### AI 요청 종류 (`ASK_PURPOSE`)

`stock`, `trade`, `order`, `journal`, `risk`, `ask`, `chat`, `range`

비서 대화 규칙·명령 설명은 `CHAT_STYLE`, `CHAT_ACTIONS` 문자열.

### 함수·클래스 (줄 번호)

- `_load_token` 40
- `origin_allowed` 73
- `_throttle` 84
- `access_token` 93
- `token_invalidate` 117
- `nh_post` 131
- `_num` 156
- `_period_rows` 167
- `_bars` 181
- `nh_chart` 193
- `nh_daily` 203
- `nh_components` 221
- `_krx_finder` 251
- `krx_master` 260
- `krx_caps` 311
- `krx_sectors` 367
- `_yahoo_chart` 422
- `market_index` 429
- `market_quotes` 462
- `news_search` 487
- `news_top` 522
- `_tg_token_ok` 552
- `_tg_call` 557
- `telegram_send` 575
- `telegram_chat` 583
- `_tg_poll` 599
- `tg_start` 628
- `tg_stop` 642
- `ai_available` 670
- `_ask_claude` 679
- `_ask_gemini` 713
- `gemini_tts` 793
- `gemini_models` 844
- `_clean_history` 860
- `_claude_msgs` 877
- `_ask` 881
- `ai_brief` 889
- `ai_test` 902
- `ai_ask` 1043
- `demo_daily` 1069
- `_hash01` 1101
- `demo_chart` 1109
- `Hub` 1164
- `_tick_size` 1203
- `_tick_msg` 1210
- `_book_msg` 1220
- `Realtime` 1229
- `DemoRealtime` 1410
- `_state_path` 1463
- `state_read` 1477
- `state_write` 1486
- `state_backup` 1507
- `trade_available` 1539
- `acct_mask` 1543
- `_day_used` 1547
- `_day_add` 1556
- `nh_trade_post` 1573
- `_msg` 1593
- `_block` 1600
- `trade_check_acct` 1605
- `trade_status` 1627
- `trade_log` 1636
- `trade_order` 1642
- `trade_cancel` 1698
- `trade_balance` 1714
- `trade_orders` 1735
- `Handler` 1754
- `ExclusiveServer` 1973
- `hidden_input` 1984
- `main` 2005
