# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,872줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.37 · 2026-11-04 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**366** · 1. 설정 · 상태
- `tfInfo` 480
- `applySynced` 515
- `loadStore` 536
- `loadToken` 553
- `saveToken` 554
- `saveStore` 555
- `bgRun` 568
- `bgWorker` 569
- `bgEvery` 570

**573** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 575
- `hmToMin` 586

**587** · ---- 휴장일: 한국거래소 공휴일·연말 휴장 (2026~2027) + 설정 '휴장일 더하기' — 휴장일에는 장중 판단·시세 재조회를 하지 않음
- `userHolidays` 590
- `isHoliday` 591
- `isTradingDay` 592
- `marketOpenNow` 593
- `tickSize` 598
- `tickFloor` 607
- `tickCeil` 608
- `won` 609
- `pct` 610
- `fmtDate` 611
- `nameOf` 612
- `esc` 613
- `toast` 615

**630** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridgeTimeout` 634
- `bridge` 635
- `db` 655
- `cacheGet` 666
- `cachePut` 672
- `cacheAllDaily` 679
- `modeKey` 696
- `lastFinalClose` 699
- `isStale` 711
- `weekdaysSince` 717
- `fetchDaily` 727
- `isCore` 757
- `applyDaily` 761
- `bucketOf` 768
- `aggregateDaily` 774
- `chartWant` 788
- `fetchChart` 789

**818** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 820
- `priceBroken` 857

**862** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 864
- `loadCaps` 865
- `codeOfBars` 873
- `capOf` 879
- `breadthAt` 883
- `bbCross` 909
- `structWhy` 922
- `baseBreakout` 938
- `widthLow` 945
- `isAccum` 953
- `accSqueeze` 961
- `squeezeCore` 971
- `sqKey` 986
- `isSqueeze` 988
- `squeezeSetup` 996
- `isLongCandle` 1004
- `waitOk` 1015
- `phInfo` 1024
- `waitBase` 1036
- `waitFrom` 1037
- `above5` 1049
- `isBreakout` 1050
- `reBreakFrom` 1056
- `sqFollowFrom` 1073
- `rawSignal` 1087
- `entryLabel` 1096
- `rawLabel` 1100

**1107** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1112
- `stratText` 1114
- `costBuy` 1118
- `costSell` 1119
- `newSeq` 1121
- `seqBuy` 1134
- `tpTarget` 1148
- `seqSellHalf` 1149
- `seqSellAll` 1160
- `maN` 1169
- `stepSeq` 1175
- `seqResult` 1211
- `rankScore` 1219

**1225** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1227

**1312** · 7. 종목 목록
- `marketCodes` 1315
- `screenPass` 1322
- `universeCodes` 1331
- `rowInfo` 1343
- `renderSymbols` 1359
- `renderScrBar` 1400

**1409** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1414
- `chartBars` 1417
- `setChart` 1423
- `loadChart` 1431
- `chartGeom` 1483
- `axisTag` 1492
- `drawChart` 1501
- `drawChartNow` 1506
- `renderTfBar` 1698
- `updateBarCount` 1703
- `renderChartHeader` 1707
- `selectCode` 1728
- `setTf` 1741
- `rightPad` 1749
- `setViewEnd` 1750
- `curEnd` 1760
- `stopGlide` 1761
- `zoom` 1827
- `pan` 1838

**1847** · 9. 백테스트 패널
- `recomputeAll` 1849
- `runBt` 1855
- `renderBt` 1862
- `drawEquity` 1895

**1918** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1920
- `plog` 1924
- `lastPrice` 1929

**1936** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1940
- `sessionDate` 1949
- `buyRate` 1956
- `sellRate` 1957
- `manualValue` 1958
- `reservedCash` 1959
- `reservedQty` 1960
- `strategyReserve` 1962
- `buyingPower` 1963
- `sellable` 1964
- `liveQuote` 1966
- `fillBuy` 1973
- `fillSell` 1990
- `submitOrder` 2013
- `cancelOrder` 2049
- `matchOrders` 2057
- `expireOrders` 2073
- `orderWatchTick` 2082

**2096** · ---- 주문창
- `ticketSync` 2099
- `renderTicket` 2109
- `ticketPct` 2135
- `stepPrice` 2143
- `withTodayBar` 2152
- `refreshQuotes` 2163
- `paperSellHalf` 2178
- `paperExit` 2189
- `paperDecide` 2203
- `renderPaper` 2290
- `scheduler` 2352

**2376** · 11. 설정 패널

**2378** · ---- 설정 찾기 · 바뀐 값 표시: 위 검색칸에 낱말을 넣으면 그 항목만, '바꾼 것만'을 켜면 기본값과 다른 항목만 보임 (● = 기본값과 다름)
- `sameVal` 2380
- `renderSettings` 2382
- `readSettings` 2421
- `setLabelOf` 2435

**2454** · 12. 이벤트 · 초기화
- `setTab` 2456
- `applyPanes` 2466
- `bindResizer` 2478
- `openHolding` 2525
- `sellNow` 2533
- `renderHoldInfo` 2553
- `toggleWatch` 2609
- `setMaster` 2621
- `loadMaster` 2629
- `searchMatches` 2639
- `renderSearch` 2667
- `openFromSearch` 2675

**2691** · ---- 단축키 (? 로 안내): / 검색 · 1~4 오른쪽 탭 · [ ] 패널 · S 관심 · D W M 주기 · + − 확대 · End 최신 · R 리서치 센터
- `showKeys` 2693
- `popOpen` 2696
- `connectBridge` 2729

**2771** · ---- 중계기 연결 감시: 20초마다 확인 → 두 번 연속 응답이 없으면 '끊김'으로 표시하고, 다시 켜지면 저절로 이어 붙음
- `connWatch` 2773
- `loadSaved` 2802
- `syncData` 2820
- `liveTick` 2874

**2915** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2920
- `rtStop` 2926
- `rtLoop` 2931
- `rtWanted` 2959
- `rtSubscribe` 2967
- `rtMsg` 2980
- `applyTick` 2988
- `updateMinuteBar` 3021
- `renderRtBadge` 3035
- `prevClose` 3047
- `chgTag` 3053
- `renderBook` 3054

**3107** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 3112
- `sync` 3119
- `saveSync` 3126
- `syncPayload` 3129
- `hasActivity` 3132
- `syncHash` 3137
- `syncMark` 3144
- `applyRemote` 3151
- `syncPush` 3163
- `syncPull` 3185
- `renderSync` 3209

**3241** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3250
- `sgn` 3274
- `pctTxt` 3275
- `evidenceAt` 3278
- `computeResearch` 3333
- `refreshResearch` 3364
- `regimeChip` 3373
- `researchChart` 3378
- `renderResearch0` 3389
- `renderResearch` 3437

**3445** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3488
- `setSectors` 3495
- `loadSectors` 3500
- `sectorOf` 3508
- `scenarioCodes` 3570

**3572** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3573
- `aboveMa` 3579
- `median` 3587
- `avg` 3588
- `sectorStats` 3590

**3608** · ---- 뉴스
- `getNews` 3610
- `agoTxt` 3617
- `newsList` 3618

**3622** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3624
- `loadScenarioNews` 3634

**3644** · ---- 화면
- `chg` 3646
- `heat` 3647
- `stockLink` 3648
- `renderSectorTab` 3650
- `renderSectorDetail` 3672
- `renderScenarioTab` 3688
- `renderNewsTab` 3715
- `renderCenter` 3723
- `openCenter` 3737
- `runNews` 3746
- `fetchSector` 3754

**3811** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3822
- `liveBar` 3834
- `winRange` 3840
- `winLog` 3843
- `winScan` 3848
- `winEvaluate` 3865
- `winStep` 3894
- `winFinish` 3970
- `windowTick` 3991
- `renderWindow` 4012
- `loadMoreBars` 4020

**4026** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 4032
- `briefFacts` 4050
- `loadAi` 4071
- `renderBriefTab` 4085

**4129** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 4133
- `saveAiCfg` 4139
- `aiReady` 4143
- `aiPayload` 4146
- `renderAiBox` 4149
- `modelKind` 4164
- `readAiBox` 4170

**4229** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 4234
- `pushFeed` 4235
- `aiAuto` 4240
- `askAi` 4241

**4247** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 4248
- `entryCtx` 4263

**4268** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4278
- `btTrades` 4308
- `myTrades` 4321
- `journal` 4324
- `statLine` 4331

**4341** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4342
- `showGuard` 4386
- `guardedSubmit` 4402

**4408** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4409
- `briefLines` 4436
- `assistOnSelect` 4449

**4466** · ---- 체결 직후 코멘트
- `assistOnTrade` 4467

**4482** · ---- 화면
- `renderAssistStrip` 4483
- `tableOf` 4490
- `renderAssist` 4502
- `foldOpen` 4533
- `fold` 4534
- `runAsk` 4567
- `calDays` 4585

**4591** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4596
- `marketRadarFacts` 4598
- `assistFacts` 4615
- `renderChat` 4633

**4647** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4648
- `grabActs` 4659
- `splitActions` 4674
- `plainSay` 4692
- `describeAct` 4696
- `findCode` 4718
- `confirmAct` 4727
- `runAction` 4742
- `settingAct` 4887
- `orderAct` 4911
- `runActions` 4925

**4935** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4939
- `saveCustom` 4943
- `safeId` 4946
- `attr` 4947
- `splitBlocks` 4949
- `applyBlocks` 4957
- `applyCss` 4985
- `calcInd` 4998
- `drawCustomInd` 5007
- `jsonSafe` 5052
- `widgetData` 5053
- `renderWidgets` 5084
- `renderCustomBox` 5123
- `customFacts` 5145

**5153** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 5156
- `realConfirm` 5165
- `realSubmit` 5183
- `realCancel` 5214
- `realArm` 5220
- `realKill` 5230
- `renderReal` 5235
- `realFacts` 5271

**5277** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5280
- `setRangeMode` 5285
- `analyzeRange` 5293
- `similarSpots` 5322
- `startRange` 5347
- `endRange` 5354
- `openRangeCard` 5364
- `renderRangeCard` 5370
- `rangeFacts` 5393
- `saveMark` 5399
- `drawRanges` 5433
- `openMark` 5472
- `marksFacts` 5479
- `marksFold` 5484
- `verTxt` 5499
- `checkPageVersion` 5503

**5523** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5542
- `runRule` 5545
- `computeRules` 5555
- `dataSig` 5570
- `ruleTick` 5572
- `stopPrice` 5579
- `exitOrStop` 5584
- `exitSignal` 5589
- `btBrief` 5596
- `btDiff` 5597
- `selSignals` 5603
- `setRule` 5610
- `renderRules` 5620
- `rulesFacts` 5654
- `drawStrategyMarks` 5659

**5696** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5699
- `saveAlertCfg` 5700
- `alertSeen` 5701
- `alertOnce` 5702
- `raiseAlert` 5709
- `flushSay` 5719
- `showAlertCard` 5726
- `hm2min` 5738
- `alertTick` 5740
- `realFillCheck` 5779
- `renderAlertBtn` 5788

**5801** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5802
- `backtestWithRule` 5815
- `halfStats` 5832
- `setLabel` 5877
- `compareVariants` 5879
- `variantsFrom` 5909
- `runCompare` 5914
- `tableHtml` 5924

**5925** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5939
- `markIndex` 5940
- `roundT` 5949
- `extractRule` 5950
- `runExtract` 5999
- `extractFacts` 6029

**6030** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 6032

**6042** · ---- 엑셀로 저장: 백테스트 거래 · 매매 일지 · 모의 매매 기록을 CSV로 (엑셀에서 한글이 깨지지 않게 BOM 포함)
- `downloadCsv` 6043
- `ymdDot` 6059
- `kstTime` 6060
- `exportBtCsv` 6061
- `exportJournalCsv` 6068
- `importRecords` 6073

**6094** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 6095

**6132** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 6134
- `drawAct` 6135
- `drawClearAct` 6154
- `drawUserDraw` 6161
- `drawLegend` 6189
- `drawFacts` 6194

**6196** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 6198
- `journalAdd` 6199
- `journalWhyAct` 6213
- `journalFold` 6221
- `journalFacts` 6249

**6261** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 6264
- `cl` 6275
- `indDef` 6338
- `indLabel` 6339
- `clone` 6342
- `normalizeLook` 6343
- `lookSubs` 6361
- `lookSeries` 6364
- `strokeSeries` 6372
- `fillBetween` 6379

**6389** · ---- 매물대: 가격대별 거래량 — 봉마다 거래량을 저가~고가에 고르게 나눠 칸에 쌓음 (양봉 거래량 · 음봉 거래량 따로)
- `vpBins` 6390
- `drawVP` 6405
- `vpFacts` 6429
- `drawLookOverlays` 6438
- `drawLookSubs` 6451
- `numShort` 6490
- `lookLegend` 6491
- `renderLookCard` 6499
- `lookChanged` 6519
- `openLook` 6524
- `lkSet` 6530
- `lookAct` 6561
- `lookFacts` 6604

**6606** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6609
- `agendaKey` 6610
- `agendaFind` 6611
- `equityNow` 6612
- `freeCash` 6613
- `planBuyQty` 6614
- `agendaChecks` 6619
- `agendaCreate` 6663
- `agendaBrief` 6678
- `agendaGate` 6693
- `agendaDone` 6701
- `winActiveFor` 6702
- `paperBuyNow` 6704
- `agendaExecNow` 6722
- `agendaDecide` 6748
- `agendaExpire` 6762
- `agendaOutcome` 6769
- `agendaHistLine` 6774
- `renderAgenda` 6779
- `agendaFacts` 6850

**6860** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6861
- `applyExternalReply` 6871

**6902** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6908
- `idxPct` 6909
- `loadMarketQuotes` 6910
- `renderIdxBar` 6917
- `renderIndexTab` 6928
- `renderIndexToolbar` 6937
- `idxEnter` 6946
- `idxExit` 6967
- `marketFacts` 6978

**6982** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6985
- `invLevOf` 6986
- `invHeld` 6987
- `invDecision` 6989
- `invEvaluate` 7007
- `invExec` 7021
- `invBacktest` 7035
- `invBtLine` 7070
- `renderInv` 7072
- `invFacts` 7116
- `invChecks` 7129

**7148** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 7149
- `renderManage` 7162
- `manageFacts` 7179

**7183** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 7185
- `newsAgo` 7191
- `renderNewsTicker` 7192
- `topNewsFacts` 7212

**7215** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 7216

**7223** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 7226
- `waitCodes` 7242
- `renderWait` 7243
- `waitAlerts` 7256

**7262** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 7265

**7296** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 7299
- `savePhone` 7300
- `phoneNotify` 7302
- `renderPhone` 7310

**7342** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 7346
- `tgReply` 7351
- `agShort` 7355
- `agByShort` 7356
- `tgHandle` 7359
- `tgStart` 7430
- `savePin` 7438
- `chatSend` 7443
- `convoNext` 7469
- `convoToggle` 7475
- `voiceSel` 7491
- `stopSpeaking` 7493
- `speechChunks` 7500
- `pcmToWavBlob` 7507
- `audioBlob` 7515
- `speakText` 7520
- `browserSpeak` 7554
- `micToggle` 7568
- `silenceMs` 7577
- `endWait` 7582
- `startSR` 7590
- `startRecorder` 7641

**7713** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7721
- `mlpForward` 7726
- `aucOf` 7731
- `trainStyle` 7739
- `retrainStyle` 7790
- `predictWin` 7803
- `predictBin` 7810
- `styleProfile` 7817
- `renderStyle` 7826

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `phOn`, `phCap`, `phDays`, `brOn`, `brMin`, `sigCap`, `obvNeed`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `tpPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`, `holidays`, `stratV`

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
