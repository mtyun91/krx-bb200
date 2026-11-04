# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,751줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.35 · 2026-11-01 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**366** · 1. 설정 · 상태
- `tfInfo` 473
- `applySynced` 507
- `loadStore` 522
- `loadToken` 539
- `saveToken` 540
- `saveStore` 541
- `bgRun` 554
- `bgWorker` 555
- `bgEvery` 556

**559** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 561
- `hmToMin` 572

**573** · ---- 휴장일: 한국거래소 공휴일·연말 휴장 (2026~2027) + 설정 '휴장일 더하기' — 휴장일에는 장중 판단·시세 재조회를 하지 않음
- `userHolidays` 576
- `isHoliday` 577
- `isTradingDay` 578
- `marketOpenNow` 579
- `tickSize` 584
- `tickFloor` 593
- `tickCeil` 594
- `won` 595
- `pct` 596
- `fmtDate` 597
- `nameOf` 598
- `esc` 599
- `toast` 601

**616** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridgeTimeout` 620
- `bridge` 621
- `db` 641
- `cacheGet` 652
- `cachePut` 658
- `cacheAllDaily` 665
- `modeKey` 682
- `lastFinalClose` 685
- `isStale` 697
- `weekdaysSince` 703
- `fetchDaily` 713
- `isCore` 743
- `applyDaily` 747
- `bucketOf` 754
- `aggregateDaily` 760
- `chartWant` 774
- `fetchChart` 775

**804** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 806
- `priceBroken` 843

**848** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 850
- `loadCaps` 851
- `codeOfBars` 859
- `capOf` 865
- `bbCross` 867
- `structWhy` 878
- `baseBreakout` 891
- `widthLow` 898
- `isAccum` 906
- `accSqueeze` 914
- `squeezeCore` 924
- `sqKey` 939
- `isSqueeze` 941
- `squeezeSetup` 949
- `isLongCandle` 957
- `waitOk` 968
- `phInfo` 977
- `waitBase` 989
- `waitFrom` 990
- `above5` 1002
- `isBreakout` 1003
- `reBreakFrom` 1009
- `sqFollowFrom` 1026
- `rawSignal` 1040
- `entryLabel` 1049
- `rawLabel` 1053

**1060** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1065
- `costBuy` 1066
- `costSell` 1067
- `newSeq` 1069
- `seqBuy` 1082
- `seqSellAll` 1095
- `maN` 1104
- `stepSeq` 1110
- `seqResult` 1141
- `rankScore` 1149

**1155** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1157

**1242** · 7. 종목 목록
- `marketCodes` 1245
- `screenPass` 1252
- `universeCodes` 1261
- `rowInfo` 1273
- `renderSymbols` 1289
- `renderScrBar` 1330

**1339** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1344
- `chartBars` 1347
- `setChart` 1353
- `loadChart` 1361
- `chartGeom` 1413
- `axisTag` 1422
- `drawChart` 1431
- `drawChartNow` 1436
- `renderTfBar` 1628
- `updateBarCount` 1633
- `renderChartHeader` 1637
- `selectCode` 1658
- `setTf` 1671
- `rightPad` 1679
- `setViewEnd` 1680
- `curEnd` 1690
- `stopGlide` 1691
- `zoom` 1757
- `pan` 1768

**1777** · 9. 백테스트 패널
- `recomputeAll` 1779
- `runBt` 1785
- `renderBt` 1792
- `drawEquity` 1825

**1848** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1850
- `plog` 1854
- `lastPrice` 1859

**1866** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1870
- `sessionDate` 1879
- `buyRate` 1886
- `sellRate` 1887
- `manualValue` 1888
- `reservedCash` 1889
- `reservedQty` 1890
- `strategyReserve` 1892
- `buyingPower` 1893
- `sellable` 1894
- `liveQuote` 1896
- `fillBuy` 1903
- `fillSell` 1920
- `submitOrder` 1943
- `cancelOrder` 1979
- `matchOrders` 1987
- `expireOrders` 2003
- `orderWatchTick` 2012

**2026** · ---- 주문창
- `ticketSync` 2029
- `renderTicket` 2039
- `ticketPct` 2065
- `stepPrice` 2073
- `withTodayBar` 2082
- `refreshQuotes` 2093
- `paperExit` 2108
- `paperDecide` 2122
- `renderPaper` 2208
- `scheduler` 2270

**2294** · 11. 설정 패널

**2296** · ---- 설정 찾기 · 바뀐 값 표시: 위 검색칸에 낱말을 넣으면 그 항목만, '바꾼 것만'을 켜면 기본값과 다른 항목만 보임 (● = 기본값과 다름)
- `sameVal` 2298
- `renderSettings` 2300
- `readSettings` 2339
- `setLabelOf` 2353

**2372** · 12. 이벤트 · 초기화
- `setTab` 2374
- `applyPanes` 2384
- `bindResizer` 2396
- `openHolding` 2443
- `sellNow` 2451
- `renderHoldInfo` 2471
- `toggleWatch` 2527
- `setMaster` 2539
- `loadMaster` 2547
- `searchMatches` 2557
- `renderSearch` 2585
- `openFromSearch` 2593

**2609** · ---- 단축키 (? 로 안내): / 검색 · 1~4 오른쪽 탭 · [ ] 패널 · S 관심 · D W M 주기 · + − 확대 · End 최신 · R 리서치 센터
- `showKeys` 2611
- `popOpen` 2614
- `connectBridge` 2647

**2689** · ---- 중계기 연결 감시: 20초마다 확인 → 두 번 연속 응답이 없으면 '끊김'으로 표시하고, 다시 켜지면 저절로 이어 붙음
- `connWatch` 2691
- `loadSaved` 2720
- `syncData` 2738
- `liveTick` 2792

**2833** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2838
- `rtStop` 2844
- `rtLoop` 2849
- `rtWanted` 2877
- `rtSubscribe` 2885
- `rtMsg` 2898
- `applyTick` 2906
- `updateMinuteBar` 2939
- `renderRtBadge` 2953
- `prevClose` 2965
- `chgTag` 2971
- `renderBook` 2972

**3025** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 3030
- `sync` 3037
- `saveSync` 3044
- `syncPayload` 3047
- `hasActivity` 3050
- `syncHash` 3055
- `syncMark` 3062
- `applyRemote` 3069
- `syncPush` 3081
- `syncPull` 3103
- `renderSync` 3127

**3159** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3168
- `sgn` 3192
- `pctTxt` 3193
- `evidenceAt` 3196
- `computeResearch` 3251
- `refreshResearch` 3282
- `regimeChip` 3291
- `researchChart` 3296
- `renderResearch0` 3307
- `renderResearch` 3355

**3363** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3406
- `setSectors` 3413
- `loadSectors` 3418
- `sectorOf` 3426
- `scenarioCodes` 3488

**3490** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3491
- `aboveMa` 3497
- `median` 3505
- `avg` 3506
- `sectorStats` 3508

**3526** · ---- 뉴스
- `getNews` 3528
- `agoTxt` 3535
- `newsList` 3536

**3540** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3542
- `loadScenarioNews` 3552

**3562** · ---- 화면
- `chg` 3564
- `heat` 3565
- `stockLink` 3566
- `renderSectorTab` 3568
- `renderSectorDetail` 3590
- `renderScenarioTab` 3606
- `renderNewsTab` 3633
- `renderCenter` 3641
- `openCenter` 3655
- `runNews` 3664
- `fetchSector` 3672

**3729** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3740
- `liveBar` 3752
- `winRange` 3758
- `winLog` 3761
- `winScan` 3766
- `winEvaluate` 3783
- `winStep` 3806
- `winFinish` 3870
- `windowTick` 3891
- `renderWindow` 3912
- `loadMoreBars` 3920

**3926** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 3932
- `briefFacts` 3950
- `loadAi` 3971
- `renderBriefTab` 3985

**4029** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 4033
- `saveAiCfg` 4039
- `aiReady` 4043
- `aiPayload` 4046
- `renderAiBox` 4049
- `modelKind` 4064
- `readAiBox` 4070

**4129** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 4134
- `pushFeed` 4135
- `aiAuto` 4140
- `askAi` 4141

**4147** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 4148
- `entryCtx` 4163

**4168** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4178
- `btTrades` 4208
- `myTrades` 4221
- `journal` 4224
- `statLine` 4231

**4241** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4242
- `showGuard` 4286
- `guardedSubmit` 4302

**4308** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4309
- `briefLines` 4336
- `assistOnSelect` 4349

**4366** · ---- 체결 직후 코멘트
- `assistOnTrade` 4367

**4382** · ---- 화면
- `renderAssistStrip` 4383
- `tableOf` 4390
- `renderAssist` 4402
- `foldOpen` 4433
- `fold` 4434
- `runAsk` 4467
- `calDays` 4485

**4491** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4496
- `marketRadarFacts` 4498
- `assistFacts` 4515
- `renderChat` 4533

**4547** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4548
- `grabActs` 4559
- `splitActions` 4574
- `plainSay` 4592
- `describeAct` 4596
- `findCode` 4618
- `confirmAct` 4627
- `runAction` 4642
- `settingAct` 4787
- `orderAct` 4811
- `runActions` 4825

**4835** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4839
- `saveCustom` 4843
- `safeId` 4846
- `attr` 4847
- `splitBlocks` 4849
- `applyBlocks` 4857
- `applyCss` 4885
- `calcInd` 4898
- `drawCustomInd` 4907
- `jsonSafe` 4952
- `widgetData` 4953
- `renderWidgets` 4984
- `renderCustomBox` 5023
- `customFacts` 5045

**5053** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 5056
- `realConfirm` 5065
- `realSubmit` 5083
- `realCancel` 5114
- `realArm` 5120
- `realKill` 5130
- `renderReal` 5135
- `realFacts` 5171

**5177** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5180
- `setRangeMode` 5185
- `analyzeRange` 5193
- `similarSpots` 5222
- `startRange` 5247
- `endRange` 5254
- `openRangeCard` 5264
- `renderRangeCard` 5270
- `rangeFacts` 5293
- `saveMark` 5299
- `drawRanges` 5333
- `openMark` 5372
- `marksFacts` 5379
- `marksFold` 5384
- `verTxt` 5399
- `checkPageVersion` 5403

**5423** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5442
- `runRule` 5445
- `computeRules` 5455
- `dataSig` 5470
- `ruleTick` 5472
- `stopPrice` 5479
- `exitOrStop` 5483
- `exitSignal` 5488
- `btBrief` 5495
- `btDiff` 5496
- `selSignals` 5502
- `setRule` 5509
- `renderRules` 5519
- `rulesFacts` 5553
- `drawStrategyMarks` 5558

**5595** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5598
- `saveAlertCfg` 5599
- `alertSeen` 5600
- `alertOnce` 5601
- `raiseAlert` 5608
- `flushSay` 5618
- `showAlertCard` 5625
- `hm2min` 5637
- `alertTick` 5639
- `realFillCheck` 5678
- `renderAlertBtn` 5687

**5700** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5701
- `backtestWithRule` 5714
- `halfStats` 5731
- `setLabel` 5776
- `compareVariants` 5778
- `variantsFrom` 5808
- `runCompare` 5813
- `tableHtml` 5823

**5824** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5838
- `markIndex` 5839
- `roundT` 5848
- `extractRule` 5849
- `runExtract` 5898
- `extractFacts` 5928

**5929** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 5931

**5941** · ---- 엑셀로 저장: 백테스트 거래 · 매매 일지 · 모의 매매 기록을 CSV로 (엑셀에서 한글이 깨지지 않게 BOM 포함)
- `downloadCsv` 5942
- `ymdDot` 5958
- `kstTime` 5959
- `exportBtCsv` 5960
- `exportJournalCsv` 5967
- `importRecords` 5972

**5993** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 5994

**6031** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 6033
- `drawAct` 6034
- `drawClearAct` 6053
- `drawUserDraw` 6060
- `drawLegend` 6088
- `drawFacts` 6093

**6095** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 6097
- `journalAdd` 6098
- `journalWhyAct` 6112
- `journalFold` 6120
- `journalFacts` 6148

**6160** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 6163
- `cl` 6174
- `indDef` 6237
- `indLabel` 6238
- `clone` 6241
- `normalizeLook` 6242
- `lookSubs` 6260
- `lookSeries` 6263
- `strokeSeries` 6271
- `fillBetween` 6278

**6288** · ---- 매물대: 가격대별 거래량 — 봉마다 거래량을 저가~고가에 고르게 나눠 칸에 쌓음 (양봉 거래량 · 음봉 거래량 따로)
- `vpBins` 6289
- `drawVP` 6304
- `vpFacts` 6328
- `drawLookOverlays` 6337
- `drawLookSubs` 6350
- `numShort` 6389
- `lookLegend` 6390
- `renderLookCard` 6398
- `lookChanged` 6418
- `openLook` 6423
- `lkSet` 6429
- `lookAct` 6460
- `lookFacts` 6503

**6505** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6508
- `agendaKey` 6509
- `agendaFind` 6510
- `equityNow` 6511
- `freeCash` 6512
- `planBuyQty` 6513
- `agendaChecks` 6518
- `agendaCreate` 6547
- `agendaBrief` 6561
- `agendaGate` 6576
- `agendaDone` 6584
- `winActiveFor` 6585
- `paperBuyNow` 6587
- `agendaExecNow` 6605
- `agendaDecide` 6629
- `agendaExpire` 6643
- `agendaOutcome` 6650
- `agendaHistLine` 6655
- `renderAgenda` 6660
- `agendaFacts` 6731

**6741** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6742
- `applyExternalReply` 6752

**6783** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6789
- `idxPct` 6790
- `loadMarketQuotes` 6791
- `renderIdxBar` 6798
- `renderIndexTab` 6809
- `renderIndexToolbar` 6818
- `idxEnter` 6827
- `idxExit` 6848
- `marketFacts` 6859

**6863** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6866
- `invLevOf` 6867
- `invHeld` 6868
- `invDecision` 6870
- `invEvaluate` 6888
- `invExec` 6902
- `invBacktest` 6916
- `invBtLine` 6951
- `renderInv` 6953
- `invFacts` 6997
- `invChecks` 7010

**7029** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 7030
- `renderManage` 7041
- `manageFacts` 7058

**7062** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 7064
- `newsAgo` 7070
- `renderNewsTicker` 7071
- `topNewsFacts` 7091

**7094** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 7095

**7102** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 7105
- `waitCodes` 7121
- `renderWait` 7122
- `waitAlerts` 7135

**7141** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 7144

**7175** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 7178
- `savePhone` 7179
- `phoneNotify` 7181
- `renderPhone` 7189

**7221** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 7225
- `tgReply` 7230
- `agShort` 7234
- `agByShort` 7235
- `tgHandle` 7238
- `tgStart` 7309
- `savePin` 7317
- `chatSend` 7322
- `convoNext` 7348
- `convoToggle` 7354
- `voiceSel` 7370
- `stopSpeaking` 7372
- `speechChunks` 7379
- `pcmToWavBlob` 7386
- `audioBlob` 7394
- `speakText` 7399
- `browserSpeak` 7433
- `micToggle` 7447
- `silenceMs` 7456
- `endWait` 7461
- `startSR` 7469
- `startRecorder` 7520

**7592** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7600
- `mlpForward` 7605
- `aucOf` 7610
- `trainStyle` 7618
- `retrainStyle` 7669
- `predictWin` 7682
- `predictBin` 7689
- `styleProfile` 7696
- `renderStyle` 7705

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `phOn`, `phCap`, `phDays`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`, `holidays`

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
