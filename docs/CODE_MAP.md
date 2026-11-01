# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,586줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.34 · 2026-11-01 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**345** · 1. 설정 · 상태
- `tfInfo` 451
- `applySynced` 485
- `loadStore` 500
- `loadToken` 517
- `saveToken` 518
- `saveStore` 519
- `bgRun` 532
- `bgWorker` 533
- `bgEvery` 534

**537** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 539
- `hmToMin` 550
- `marketOpenNow` 551
- `tickSize` 556
- `tickFloor` 565
- `tickCeil` 566
- `won` 567
- `pct` 568
- `fmtDate` 569
- `nameOf` 570
- `esc` 571
- `toast` 572

**581** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridge` 584
- `db` 596
- `cacheGet` 607
- `cachePut` 613
- `cacheAllDaily` 620
- `modeKey` 637
- `lastFinalClose` 640
- `isStale` 652
- `weekdaysSince` 658
- `fetchDaily` 668
- `isCore` 698
- `applyDaily` 702
- `bucketOf` 709
- `aggregateDaily` 715
- `chartWant` 729
- `fetchChart` 730

**759** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 761
- `priceBroken` 798

**803** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 805
- `loadCaps` 806
- `codeOfBars` 814
- `capOf` 820
- `bbCross` 822
- `structWhy` 833
- `baseBreakout` 846
- `widthLow` 853
- `isAccum` 861
- `accSqueeze` 869
- `squeezeCore` 879
- `sqKey` 894
- `isSqueeze` 896
- `squeezeSetup` 904
- `isLongCandle` 912
- `waitOk` 923
- `phInfo` 932
- `waitBase` 944
- `waitFrom` 945
- `above5` 957
- `isBreakout` 958
- `reBreakFrom` 964
- `sqFollowFrom` 981
- `rawSignal` 995
- `entryLabel` 1004
- `rawLabel` 1008

**1015** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1020
- `costBuy` 1021
- `costSell` 1022
- `newSeq` 1024
- `seqBuy` 1037
- `seqSellAll` 1050
- `maN` 1059
- `stepSeq` 1065
- `seqResult` 1096
- `rankScore` 1104

**1110** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1112

**1197** · 7. 종목 목록
- `marketCodes` 1200
- `screenPass` 1207
- `universeCodes` 1216
- `rowInfo` 1228
- `renderSymbols` 1244
- `renderScrBar` 1285

**1294** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1299
- `chartBars` 1302
- `setChart` 1308
- `loadChart` 1316
- `chartGeom` 1368
- `axisTag` 1377
- `drawChart` 1386
- `drawChartNow` 1391
- `renderTfBar` 1583
- `updateBarCount` 1588
- `renderChartHeader` 1592
- `selectCode` 1613
- `setTf` 1626
- `rightPad` 1634
- `setViewEnd` 1635
- `curEnd` 1645
- `stopGlide` 1646
- `zoom` 1712
- `pan` 1723

**1732** · 9. 백테스트 패널
- `recomputeAll` 1734
- `runBt` 1740
- `renderBt` 1747
- `drawEquity` 1780

**1803** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1805
- `plog` 1809
- `lastPrice` 1814

**1821** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1825
- `sessionDate` 1834
- `buyRate` 1841
- `sellRate` 1842
- `manualValue` 1843
- `reservedCash` 1844
- `reservedQty` 1845
- `strategyReserve` 1847
- `buyingPower` 1848
- `sellable` 1849
- `liveQuote` 1851
- `fillBuy` 1858
- `fillSell` 1875
- `submitOrder` 1898
- `cancelOrder` 1934
- `matchOrders` 1942
- `expireOrders` 1958
- `orderWatchTick` 1967

**1981** · ---- 주문창
- `ticketSync` 1984
- `renderTicket` 1994
- `ticketPct` 2020
- `stepPrice` 2028
- `withTodayBar` 2037
- `refreshQuotes` 2048
- `paperExit` 2063
- `paperDecide` 2077
- `renderPaper` 2163
- `scheduler` 2225

**2249** · 11. 설정 패널
- `renderSettings` 2251
- `readSettings` 2265

**2290** · 12. 이벤트 · 초기화
- `setTab` 2292
- `applyPanes` 2302
- `bindResizer` 2314
- `openHolding` 2361
- `sellNow` 2369
- `renderHoldInfo` 2389
- `toggleWatch` 2445
- `setMaster` 2457
- `loadMaster` 2465
- `searchMatches` 2475
- `renderSearch` 2503
- `openFromSearch` 2511
- `connectBridge` 2543
- `loadSaved` 2587
- `syncData` 2605
- `liveTick` 2659

**2700** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2705
- `rtStop` 2711
- `rtLoop` 2716
- `rtWanted` 2744
- `rtSubscribe` 2752
- `rtMsg` 2765
- `applyTick` 2773
- `updateMinuteBar` 2806
- `renderRtBadge` 2820
- `prevClose` 2832
- `chgTag` 2838
- `renderBook` 2839

**2892** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 2897
- `sync` 2904
- `saveSync` 2911
- `syncPayload` 2914
- `hasActivity` 2917
- `syncHash` 2922
- `syncMark` 2929
- `applyRemote` 2936
- `syncPush` 2948
- `syncPull` 2970
- `renderSync` 2994

**3026** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3035
- `sgn` 3059
- `pctTxt` 3060
- `evidenceAt` 3063
- `computeResearch` 3118
- `refreshResearch` 3149
- `regimeChip` 3158
- `researchChart` 3163
- `renderResearch0` 3174
- `renderResearch` 3222

**3230** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3273
- `setSectors` 3280
- `loadSectors` 3285
- `sectorOf` 3293
- `scenarioCodes` 3355

**3357** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3358
- `aboveMa` 3364
- `median` 3372
- `avg` 3373
- `sectorStats` 3375

**3393** · ---- 뉴스
- `getNews` 3395
- `agoTxt` 3402
- `newsList` 3403

**3407** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3409
- `loadScenarioNews` 3419

**3429** · ---- 화면
- `chg` 3431
- `heat` 3432
- `stockLink` 3433
- `renderSectorTab` 3435
- `renderSectorDetail` 3457
- `renderScenarioTab` 3473
- `renderNewsTab` 3500
- `renderCenter` 3508
- `openCenter` 3522
- `runNews` 3531
- `fetchSector` 3539

**3596** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3607
- `liveBar` 3619
- `winRange` 3625
- `winLog` 3628
- `winScan` 3633
- `winEvaluate` 3650
- `winStep` 3673
- `winFinish` 3737
- `windowTick` 3758
- `renderWindow` 3779
- `loadMoreBars` 3787

**3793** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3799
- `briefFacts` 3817
- `loadAi` 3838
- `renderBriefTab` 3852

**3896** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 3900
- `saveAiCfg` 3906
- `aiReady` 3910
- `aiPayload` 3913
- `renderAiBox` 3916
- `modelKind` 3931
- `readAiBox` 3937

**3996** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 4001
- `pushFeed` 4002
- `aiAuto` 4007
- `askAi` 4008

**4014** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 4015
- `entryCtx` 4030

**4035** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4045
- `btTrades` 4075
- `myTrades` 4088
- `journal` 4091
- `statLine` 4098

**4108** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4109
- `showGuard` 4153
- `guardedSubmit` 4169

**4175** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4176
- `briefLines` 4203
- `assistOnSelect` 4216

**4233** · ---- 체결 직후 코멘트
- `assistOnTrade` 4234

**4249** · ---- 화면
- `renderAssistStrip` 4250
- `tableOf` 4257
- `renderAssist` 4269
- `foldOpen` 4300
- `fold` 4301
- `runAsk` 4334
- `calDays` 4352

**4358** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4363
- `marketRadarFacts` 4365
- `assistFacts` 4382
- `renderChat` 4400

**4414** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4415
- `grabActs` 4426
- `splitActions` 4441
- `plainSay` 4459
- `describeAct` 4463
- `findCode` 4485
- `confirmAct` 4494
- `runAction` 4509
- `settingAct` 4654
- `orderAct` 4678
- `runActions` 4692

**4702** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4706
- `saveCustom` 4710
- `safeId` 4713
- `attr` 4714
- `splitBlocks` 4716
- `applyBlocks` 4724
- `applyCss` 4752
- `calcInd` 4765
- `drawCustomInd` 4774
- `jsonSafe` 4819
- `widgetData` 4820
- `renderWidgets` 4851
- `renderCustomBox` 4890
- `customFacts` 4912

**4920** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 4923
- `realConfirm` 4932
- `realSubmit` 4950
- `realCancel` 4981
- `realArm` 4987
- `realKill` 4997
- `renderReal` 5002
- `realFacts` 5038

**5044** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5047
- `setRangeMode` 5052
- `analyzeRange` 5060
- `similarSpots` 5089
- `startRange` 5114
- `endRange` 5121
- `openRangeCard` 5131
- `renderRangeCard` 5137
- `rangeFacts` 5160
- `saveMark` 5166
- `drawRanges` 5200
- `openMark` 5239
- `marksFacts` 5246
- `marksFold` 5251
- `verTxt` 5266
- `checkPageVersion` 5270

**5290** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5309
- `runRule` 5312
- `computeRules` 5322
- `dataSig` 5337
- `ruleTick` 5339
- `stopPrice` 5346
- `exitOrStop` 5350
- `exitSignal` 5355
- `btBrief` 5362
- `btDiff` 5363
- `selSignals` 5369
- `setRule` 5376
- `renderRules` 5386
- `rulesFacts` 5420
- `drawStrategyMarks` 5425

**5462** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5465
- `saveAlertCfg` 5466
- `alertSeen` 5467
- `alertOnce` 5468
- `raiseAlert` 5475
- `flushSay` 5485
- `showAlertCard` 5492
- `hm2min` 5504
- `alertTick` 5506
- `realFillCheck` 5545
- `renderAlertBtn` 5554

**5567** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5568
- `backtestWithRule` 5581
- `halfStats` 5598
- `setLabel` 5643
- `compareVariants` 5645
- `variantsFrom` 5675
- `runCompare` 5680
- `tableHtml` 5690

**5691** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5705
- `markIndex` 5706
- `roundT` 5715
- `extractRule` 5716
- `runExtract` 5765
- `extractFacts` 5795

**5796** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5798
- `importRecords` 5808

**5829** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5830

**5867** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 5869
- `drawAct` 5870
- `drawClearAct` 5889
- `drawUserDraw` 5896
- `drawLegend` 5924
- `drawFacts` 5929

**5931** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 5933
- `journalAdd` 5934
- `journalWhyAct` 5948
- `journalFold` 5956
- `journalFacts` 5983

**5995** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 5998
- `cl` 6009
- `indDef` 6072
- `indLabel` 6073
- `clone` 6076
- `normalizeLook` 6077
- `lookSubs` 6095
- `lookSeries` 6098
- `strokeSeries` 6106
- `fillBetween` 6113

**6123** · ---- 매물대: 가격대별 거래량 — 봉마다 거래량을 저가~고가에 고르게 나눠 칸에 쌓음 (양봉 거래량 · 음봉 거래량 따로)
- `vpBins` 6124
- `drawVP` 6139
- `vpFacts` 6163
- `drawLookOverlays` 6172
- `drawLookSubs` 6185
- `numShort` 6224
- `lookLegend` 6225
- `renderLookCard` 6233
- `lookChanged` 6253
- `openLook` 6258
- `lkSet` 6264
- `lookAct` 6295
- `lookFacts` 6338

**6340** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6343
- `agendaKey` 6344
- `agendaFind` 6345
- `equityNow` 6346
- `freeCash` 6347
- `planBuyQty` 6348
- `agendaChecks` 6353
- `agendaCreate` 6382
- `agendaBrief` 6396
- `agendaGate` 6411
- `agendaDone` 6419
- `winActiveFor` 6420
- `paperBuyNow` 6422
- `agendaExecNow` 6440
- `agendaDecide` 6464
- `agendaExpire` 6478
- `agendaOutcome` 6485
- `agendaHistLine` 6490
- `renderAgenda` 6495
- `agendaFacts` 6566

**6576** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6577
- `applyExternalReply` 6587

**6618** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6624
- `idxPct` 6625
- `loadMarketQuotes` 6626
- `renderIdxBar` 6633
- `renderIndexTab` 6644
- `renderIndexToolbar` 6653
- `idxEnter` 6662
- `idxExit` 6683
- `marketFacts` 6694

**6698** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6701
- `invLevOf` 6702
- `invHeld` 6703
- `invDecision` 6705
- `invEvaluate` 6723
- `invExec` 6737
- `invBacktest` 6751
- `invBtLine` 6786
- `renderInv` 6788
- `invFacts` 6832
- `invChecks` 6845

**6864** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 6865
- `renderManage` 6876
- `manageFacts` 6893

**6897** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 6899
- `newsAgo` 6905
- `renderNewsTicker` 6906
- `topNewsFacts` 6926

**6929** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 6930

**6937** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 6940
- `waitCodes` 6956
- `renderWait` 6957
- `waitAlerts` 6970

**6976** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 6979

**7010** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 7013
- `savePhone` 7014
- `phoneNotify` 7016
- `renderPhone` 7024

**7056** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 7060
- `tgReply` 7065
- `agShort` 7069
- `agByShort` 7070
- `tgHandle` 7073
- `tgStart` 7144
- `savePin` 7152
- `chatSend` 7157
- `convoNext` 7183
- `convoToggle` 7189
- `voiceSel` 7205
- `stopSpeaking` 7207
- `speechChunks` 7214
- `pcmToWavBlob` 7221
- `audioBlob` 7229
- `speakText` 7234
- `browserSpeak` 7268
- `micToggle` 7282
- `silenceMs` 7291
- `endWait` 7296
- `startSR` 7304
- `startRecorder` 7355

**7427** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7435
- `mlpForward` 7440
- `aucOf` 7445
- `trainStyle` 7453
- `retrainStyle` 7504
- `predictWin` 7517
- `predictBin` 7524
- `styleProfile` 7531
- `renderStyle` 7540

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `phOn`, `phCap`, `phDays`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`

### `state` 키

`cfg`, `watch`, `universe`, `filter`, `lists`, `listsAt`, `names`, `data`, `meta`, `chart`, `selected`, `tf`, `ui`, `sort`, `lastMode`, `bridge`, `bt`, `marks`, `rules`, `journal`, `draw`, `invList`, `invBt`, `idxView`, `agenda`, `view`, `paper`, `tab`

동기화되는 것: `syncPayload()` 참고 (같이 `applySynced()`·`saveStore()`도 고칠 것).

### 비서 화면 명령 (`runAction`의 `do` 값)

`종목`, `주기`, `확대`, `과거봉`, `탭`, `리서치센터`, `리서치센터닫기`, `종목군`, `관심`, `패널`, `백테스트`, `설정`, `주문`, `즉시매도`, `위젯삭제`, `지표삭제`, `실주문`, `비상정지`, `비교`, `종목찾기`, `관심추가`, `그리기`, `그림삭제`, `지수차트`, `필터`, `정렬`, `결재함`, `인버스판단`, `인버스백테스트`, `지금판단`, `알림`, `패널폭`, `차트설정창`, `뉴스`, `차트설정`, `보조지표`, `일지`, `규칙추출`, `규칙적용`, `규칙삭제`, `스타일초기화`

### 보조지표 (`IND_LIB`)

`mesh` 그물망(위), `vp` 매물대(위), `ema` 지수이평(위), `bb` 볼린저(위), `env` 엔벨로프(위), `ichi` 일목균형표(위), `sar` 파라볼릭(위), `rsi` RSI(아래), `macd` MACD(아래), `stoch` 스토캐스틱(아래), `cci` CCI(아래), `willr` 윌리엄스 %R(아래), `mfi` MFI(아래), `adx` DMI·ADX(아래), `atr` ATR(아래), `obv` OBV(아래), `cmf` CMF(아래), `disp` 이격도(아래), `vr` 거래량 비율(아래)

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
