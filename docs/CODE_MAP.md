# 코드 지도 (자동 생성 — 손으로 고치지 말고 `python tools/make_handoff.py`)

## partisan_investment.html

총 7,886줄. `<script>` 하나에 전부 들어 있음 (빌드 없음).

화면 버전: v1.39 · 2026-11-05 (pre-commit 훅이 자동으로 올림)

### 구역과 함수 (줄 번호)


**366** · 1. 설정 · 상태
- `tfInfo` 482
- `applySynced` 517
- `loadStore` 548
- `loadToken` 565
- `saveToken` 566
- `saveStore` 567
- `bgRun` 580
- `bgWorker` 581
- `bgEvery` 582

**585** · 2. 공통 유틸 — 한국 시간 · 호가 단위 · 숫자 표시
- `kstNow` 587
- `hmToMin` 598

**599** · ---- 휴장일: 한국거래소 공휴일·연말 휴장 (2026~2027) + 설정 '휴장일 더하기' — 휴장일에는 장중 판단·시세 재조회를 하지 않음
- `userHolidays` 602
- `isHoliday` 603
- `isTradingDay` 604
- `marketOpenNow` 605
- `tickSize` 610
- `tickFloor` 619
- `tickCeil` 620
- `won` 621
- `pct` 622
- `fmtDate` 623
- `nameOf` 624
- `esc` 625
- `toast` 627

**642** · 3. 중계기 통신 · 시세 저장소(IndexedDB)
- `bridgeTimeout` 646
- `bridge` 647
- `db` 667
- `cacheGet` 678
- `cachePut` 684
- `cacheAllDaily` 691
- `modeKey` 708
- `lastFinalClose` 711
- `isStale` 723
- `weekdaysSince` 729
- `fetchDaily` 739
- `isCore` 769
- `applyDaily` 773
- `bucketOf` 780
- `aggregateDaily` 786
- `chartWant` 800
- `fetchChart` 801

**830** · 4. 지표 — BB · 이동평균 · 거래량 평균 · ADX(14)
- `computeInd` 832
- `priceBroken` 869

**874** · ---- 시가총액(상장주식수 × 가격) — 중계기가 하루 한 번 공개 상장주식수 자료를 받아 줌. 모르면 소형주 조건은 안 봄
- `caps` 876
- `loadCaps` 877
- `codeOfBars` 885
- `capOf` 891
- `breadthAt` 895
- `bbCross` 921
- `structWhy` 934
- `baseBreakout` 951
- `widthLow` 958
- `isAccum` 966
- `accSqueeze` 974
- `squeezeCore` 984
- `sqKey` 999
- `isSqueeze` 1001
- `squeezeSetup` 1009
- `isLongCandle` 1017
- `waitOk` 1028
- `phInfo` 1037
- `waitBase` 1049
- `waitFrom` 1050
- `above5` 1062
- `isBreakout` 1063
- `reBreakFrom` 1069
- `sqFollowFrom` 1086
- `rawSignal` 1100
- `entryLabel` 1109
- `rawLabel` 1113

**1120** · 5. 전략 엔진 — 백테스트와 모의투자가 같은 함수를 씀
- `slotPctNow` 1125
- `stratText` 1127
- `costBuy` 1131
- `costSell` 1132
- `newSeq` 1134
- `seqBuy` 1147
- `tpTarget` 1161
- `seqSellHalf` 1162
- `seqSellAll` 1173
- `maN` 1182
- `stepSeq` 1188
- `seqResult` 1224
- `rankScore` 1232

**1238** · 6. 포트폴리오 백테스트 — 날짜별로 보유 종목 처리 → 신호 종목 신규 진입 (자리·현금 한도)
- `runBacktest` 1240

**1325** · 7. 종목 목록
- `marketCodes` 1328
- `screenPass` 1335
- `universeCodes` 1344
- `rowInfo` 1356
- `renderSymbols` 1372
- `renderScrBar` 1413

**1422** · 8. 차트 — 분(1·3·5·10·15·30·60) · 일 · 주 · 월봉
- `fmtT` 1427
- `chartBars` 1430
- `setChart` 1436
- `loadChart` 1444
- `chartGeom` 1496
- `axisTag` 1505
- `drawChart` 1514
- `drawChartNow` 1519
- `renderTfBar` 1711
- `updateBarCount` 1716
- `renderChartHeader` 1720
- `selectCode` 1741
- `setTf` 1754
- `rightPad` 1762
- `setViewEnd` 1763
- `curEnd` 1773
- `stopGlide` 1774
- `zoom` 1840
- `pan` 1851

**1860** · 9. 백테스트 패널
- `recomputeAll` 1862
- `runBt` 1868
- `renderBt` 1875
- `drawEquity` 1908

**1931** · 10. 모의 자동매매 — 같은 전략 엔진, 가상 계좌
- `paper` 1933
- `plog` 1937
- `lastPrice` 1942

**1949** · 10-1. 자체 모의 거래소 — 직접 넣는 주문(시장가·지정가)을 실시간 시세로 가상 체결
- `acct` 1953
- `sessionDate` 1962
- `buyRate` 1969
- `sellRate` 1970
- `manualValue` 1971
- `reservedCash` 1972
- `reservedQty` 1973
- `strategyReserve` 1975
- `buyingPower` 1976
- `sellable` 1977
- `liveQuote` 1979
- `fillBuy` 1986
- `fillSell` 2003
- `submitOrder` 2026
- `cancelOrder` 2062
- `matchOrders` 2070
- `expireOrders` 2086
- `orderWatchTick` 2095

**2109** · ---- 주문창
- `ticketSync` 2112
- `renderTicket` 2122
- `ticketPct` 2148
- `stepPrice` 2156
- `withTodayBar` 2165
- `refreshQuotes` 2176
- `paperSellHalf` 2191
- `paperExit` 2202
- `paperDecide` 2216
- `renderPaper` 2303
- `scheduler` 2365

**2389** · 11. 설정 패널

**2391** · ---- 설정 찾기 · 바뀐 값 표시: 위 검색칸에 낱말을 넣으면 그 항목만, '바꾼 것만'을 켜면 기본값과 다른 항목만 보임 (● = 기본값과 다름)
- `sameVal` 2393
- `renderSettings` 2395
- `readSettings` 2434
- `setLabelOf` 2448

**2467** · 12. 이벤트 · 초기화
- `setTab` 2469
- `applyPanes` 2479
- `bindResizer` 2491
- `openHolding` 2538
- `sellNow` 2546
- `renderHoldInfo` 2566
- `toggleWatch` 2622
- `setMaster` 2634
- `loadMaster` 2642
- `searchMatches` 2652
- `renderSearch` 2680
- `openFromSearch` 2688

**2704** · ---- 단축키 (? 로 안내): / 검색 · 1~4 오른쪽 탭 · [ ] 패널 · S 관심 · D W M 주기 · + − 확대 · End 최신 · R 리서치 센터
- `showKeys` 2706
- `popOpen` 2709
- `connectBridge` 2742

**2784** · ---- 중계기 연결 감시: 20초마다 확인 → 두 번 연속 응답이 없으면 '끊김'으로 표시하고, 다시 켜지면 저절로 이어 붙음
- `connWatch` 2786
- `loadSaved` 2815
- `syncData` 2833
- `liveTick` 2887

**2928** · 13. 실시간 (HTS 방식) — 중계기 스트림으로 체결가·호가를 받아 틱마다 현재가·오늘 봉·분봉·호가창·모의 체결 갱신
- `rtStart` 2933
- `rtStop` 2939
- `rtLoop` 2944
- `rtWanted` 2972
- `rtSubscribe` 2980
- `rtMsg` 2993
- `applyTick` 3001
- `updateMinuteBar` 3034
- `renderRtBadge` 3048
- `prevClose` 3060
- `chgTag` 3066
- `renderBook` 3067

**3120** · 14. 계좌 동기화 — 중계기 폴더의 krx_state.json 하나로 맥·윈도우가 같은 계좌를 이어서 씀
- `device` 3125
- `sync` 3132
- `saveSync` 3139
- `syncPayload` 3142
- `hasActivity` 3145
- `syncHash` 3150
- `syncMark` 3157
- `applyRemote` 3164
- `syncPush` 3176
- `syncPull` 3198
- `renderSync` 3222

**3254** · 15. 시장 리서치 — 시장 국면(상승·중립·하락)을 여러 근거로 판정 (인버스 엔진의 기준)
- `rollStats` 3263
- `sgn` 3287
- `pctTxt` 3288
- `evidenceAt` 3291
- `computeResearch` 3346
- `refreshResearch` 3377
- `regimeChip` 3386
- `researchChart` 3391
- `renderResearch0` 3402
- `renderResearch` 3450

**3458** · 16. 리서치 센터 — 섹터 분석 · 시나리오 가이드 · 뉴스 (큰 창)
- `classify` 3501
- `setSectors` 3508
- `loadSectors` 3513
- `sectorOf` 3521
- `scenarioCodes` 3583

**3585** · ---- 계산 도우미 (저장된 일봉 기준)
- `retN` 3586
- `aboveMa` 3592
- `median` 3600
- `avg` 3601
- `sectorStats` 3603

**3621** · ---- 뉴스
- `getNews` 3623
- `agoTxt` 3630
- `newsList` 3631

**3635** · ---- 시나리오: 지금 뉴스량 + 가격 반영 여부
- `scenarioEval` 3637
- `loadScenarioNews` 3647

**3657** · ---- 화면
- `chg` 3659
- `heat` 3660
- `stockLink` 3661
- `renderSectorTab` 3663
- `renderSectorDetail` 3685
- `renderScenarioTab` 3701
- `renderNewsTab` 3728
- `renderCenter` 3736
- `openCenter` 3750
- `runNews` 3759
- `fetchSector` 3767

**3824** · 17. 매매 시간대 (기본 15:00~15:20) — 종가 동시호가 전에 '좋은 자리'에서 체결
- `nearCodes` 3835
- `liveBar` 3847
- `winRange` 3853
- `winLog` 3856
- `winScan` 3861
- `winEvaluate` 3878
- `winStep` 3907
- `winFinish` 3983
- `windowTick` 4004
- `renderWindow` 4025
- `loadMoreBars` 4033

**4039** · 18. 리서치 센터 첫 화면 — 시장 브리핑 (한눈에 보는 지금 시장)
- `loadBriefNews` 4045
- `briefFacts` 4063
- `loadAi` 4084
- `renderBriefTab` 4098

**4142** · 19. AI 분석 설정 — 제공사(Claude·Gemini) · 모델 · 키. 키는 '기억'을 켤 때만 이 브라우저에 저장
- `aiCfg` 4146
- `saveAiCfg` 4152
- `aiReady` 4156
- `aiPayload` 4159
- `renderAiBox` 4162
- `modelKind` 4177
- `readAiBox` 4183

**4242** · 20. AI 비서 — 선택·주문·체결마다 코멘트, 주문 전 실수 방지 점검, 매매 기록·전략 과거 데이터 패턴 분석
- `saveFeed` 4247
- `pushFeed` 4248
- `aiAuto` 4253
- `askAi` 4254

**4260** · ---- 진입 시점 상황 기록 (나중에 '어떤 조건에서 산 매매가 나빴나'를 계산하는 재료)
- `featuresAt` 4261
- `entryCtx` 4276

**4281** · ---- 매매 분석: 조건별로 묶어 승률·평균 수익률 비교 → 나쁜 조건 찾기
- `analyzeTrades` 4291
- `btTrades` 4321
- `myTrades` 4334
- `journal` 4337
- `statLine` 4344

**4354** · ---- 주문 전 실수 방지 점검
- `guardCheck` 4355
- `showGuard` 4399
- `guardedSubmit` 4415

**4421** · ---- 종목 선택: 숫자 브리프 + (자동) AI 코멘트
- `stockFacts` 4422
- `briefLines` 4449
- `assistOnSelect` 4462

**4479** · ---- 체결 직후 코멘트
- `assistOnTrade` 4480

**4495** · ---- 화면
- `renderAssistStrip` 4496
- `tableOf` 4503
- `renderAssist` 4515
- `foldOpen` 4546
- `fold` 4547
- `runAsk` 4580
- `calDays` 4598

**4604** · 21. 비서와 대화 — 이어지는 대화 · 음성 입력(Gemini 받아쓰기 / 브라우저 음성 인식) · 음성 답변(브라우저 TTS)
- `saveChat` 4609
- `marketRadarFacts` 4611
- `assistFacts` 4628
- `renderChat` 4646

**4660** · ---- AI 비서 화면 조작: 답 끝의 '<<명령>> [...]'을 실행 — 보기 변경은 바로, 주문·즉시매도·설정은 확인 창을 거쳐서
- `screenFacts` 4661
- `grabActs` 4672
- `splitActions` 4687
- `plainSay` 4705
- `describeAct` 4709
- `findCode` 4731
- `confirmAct` 4740
- `runAction` 4755
- `settingAct` 4900
- `orderAct` 4924
- `runActions` 4938

**4948** · ---- AI가 만드는 내 도구: 위젯(떠 있는 창) · 차트 지표 · 화면 스타일
- `custom` 4952
- `saveCustom` 4956
- `safeId` 4959
- `attr` 4960
- `splitBlocks` 4962
- `applyBlocks` 4970
- `applyCss` 4998
- `calcInd` 5011
- `drawCustomInd` 5020
- `jsonSafe` 5065
- `widgetData` 5066
- `renderWidgets` 5097
- `renderCustomBox` 5136
- `customFacts` 5158

**5166** · ---- 실계좌 주문 (중계기를 'python nh_bridge.py --ask --trade' 로 켰을 때만)
- `realRefresh` 5169
- `realConfirm` 5178
- `realSubmit` 5196
- `realCancel` 5227
- `realArm` 5233
- `realKill` 5243
- `renderReal` 5248
- `realFacts` 5284

**5290** · ---- 차트 구간 표시: 매수~매도 구간을 드래그로 찍어 수치 분석 · AI 의견 · 내 예시로 학습
- `rangeIdx` 5293
- `setRangeMode` 5298
- `analyzeRange` 5306
- `similarSpots` 5335
- `startRange` 5360
- `endRange` 5367
- `openRangeCard` 5377
- `renderRangeCard` 5383
- `rangeFacts` 5406
- `saveMark` 5412
- `drawRanges` 5446
- `openMark` 5485
- `marksFacts` 5492
- `marksFold` 5497
- `verTxt` 5512
- `checkPageVersion` 5516

**5536** · ---- 내 매매 규칙: 비서가 말로 들은 매수·매도 조건을 코드로 만들어 신호·백테스트·자동매매·차트에 바로 적용
- `ruleOn` 5555
- `runRule` 5558
- `computeRules` 5568
- `dataSig` 5583
- `ruleTick` 5585
- `stopPrice` 5592
- `exitOrStop` 5597
- `exitSignal` 5602
- `btBrief` 5609
- `btDiff` 5610
- `selSignals` 5616
- `setRule` 5623
- `renderRules` 5633
- `rulesFacts` 5667
- `drawStrategyMarks` 5672

**5709** · ---- 먼저 말 거는 비서: 장중에 상황이 바뀌면 비서가 먼저 알림 (화면 카드 + 대화창 + 음성 + 창이 가려져 있으면 OS 알림)
- `alertCfg` 5712
- `saveAlertCfg` 5713
- `alertSeen` 5714
- `alertOnce` 5715
- `raiseAlert` 5722
- `flushSay` 5732
- `showAlertCard` 5739
- `hm2min` 5751
- `alertTick` 5753
- `realFillCheck` 5792
- `renderAlertBtn` 5801

**5814** · ---- 조건 비교 실험실: 여러 설정을 나란히 백테스트 + 기간을 앞·뒤로 나눠 '앞에서 좋았던 게 뒤에서도 통하나' 확인
- `backtestWith` 5815
- `backtestWithRule` 5828
- `halfStats` 5845
- `setLabel` 5890
- `compareVariants` 5892
- `variantsFrom` 5922
- `runCompare` 5927
- `tableHtml` 5937

**5938** · ---- 표시한 구간에서 규칙 뽑기: 👍 예시들의 매수일 공통점을 찾아 매수 규칙 초안을 만들고 숫자로 검증
- `featRow` 5952
- `markIndex` 5953
- `roundT` 5962
- `extractRule` 5963
- `runExtract` 6012
- `extractFacts` 6042

**6043** · ---- 기록 내보내기·불러오기 — 설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림을 파일 하나로
- `exportRecords` 6045

**6055** · ---- 엑셀로 저장: 백테스트 거래 · 매매 일지 · 모의 매매 기록을 CSV로 (엑셀에서 한글이 깨지지 않게 BOM 포함)
- `downloadCsv` 6056
- `ymdDot` 6072
- `kstTime` 6073
- `exportBtCsv` 6074
- `exportJournalCsv` 6081
- `importRecords` 6086

**6107** · ---- 말로 종목 찾기: 비서가 조건을 코드로 짜면 불러온 모든 종목의 최근 일봉에서 맞는 종목을 표로
- `runScreen` 6108

**6145** · ---- 비서가 차트에 그리기: 가격선(지지·저항 등)과 날짜 메모. 종목별로 저장·동기화
- `drawColor` 6147
- `drawAct` 6148
- `drawClearAct` 6167
- `drawUserDraw` 6174
- `drawLegend` 6202
- `drawFacts` 6207

**6209** · ---- 매매 일지: 모든 주문(모의·자동·실계좌)을 이유와 함께 남기고, 매도하면 그 매수 대비 수익을 붙임
- `lastUserText` 6211
- `journalAdd` 6212
- `journalWhyAct` 6226
- `journalFold` 6234
- `journalFacts` 6262

**6274** · ---- 차트 꾸미기: 봉·볼린저·이평선 색, 이평선 기간, 보조지표 (차트 위 겹쳐 그리기 / 아래 칸)
- `lookColor` 6277
- `cl` 6288
- `indDef` 6351
- `indLabel` 6352
- `clone` 6355
- `normalizeLook` 6356
- `lookSubs` 6374
- `lookSeries` 6377
- `strokeSeries` 6385
- `fillBetween` 6392

**6402** · ---- 매물대: 가격대별 거래량 — 봉마다 거래량을 저가~고가에 고르게 나눠 칸에 쌓음 (양봉 거래량 · 음봉 거래량 따로)
- `vpBins` 6403
- `drawVP` 6418
- `vpFacts` 6442
- `drawLookOverlays` 6451
- `drawLookSubs` 6464
- `numShort` 6503
- `lookLegend` 6504
- `renderLookCard` 6512
- `lookChanged` 6532
- `openLook` 6537
- `lkSet` 6543
- `lookAct` 6574
- `lookFacts` 6617

**6619** · ---- 투자위원회 결재: 신호 → 안건 상정 → 리스크 점검표 + AI 리스크 브리핑(꼭 읽기) → 비서와 토론 → 내 결재 → 실행 → 사후 평가
- `agendaOn` 6622
- `agendaKey` 6623
- `agendaFind` 6624
- `equityNow` 6625
- `freeCash` 6626
- `planBuyQty` 6627
- `agendaChecks` 6632
- `agendaCreate` 6677
- `agendaBrief` 6692
- `agendaGate` 6707
- `agendaDone` 6715
- `winActiveFor` 6716
- `paperBuyNow` 6718
- `agendaExecNow` 6736
- `agendaDecide` 6762
- `agendaExpire` 6776
- `agendaOutcome` 6783
- `agendaHistLine` 6788
- `renderAgenda` 6793
- `agendaFacts` 6864

**6874** · ---- 비서 단축 버튼 · 외부 Gemini 대화창 연동(지금 상황 복사 📋 / 받은 답 붙여 넣어 실행 📥)
- `copyGeminiBrief` 6875
- `applyExternalReply` 6885

**6916** · ---- 주요 지수: 위쪽 지수 띠(코스피·코스닥·미국 지수·환율) + 리서치센터 '지수 차트' (메인 차트를 그대로 옮겨 와 같은 차트로 봄)
- `idxNum` 6922
- `idxPct` 6923
- `loadMarketQuotes` 6924
- `renderIdxBar` 6931
- `renderIndexTab` 6942
- `renderIndexToolbar` 6951
- `idxEnter` 6960
- `idxExit` 6981
- `marketFacts` 6992

**6996** · ---- 인버스 — 하락장 대응: 인버스 ETF 목록 관리 + 시장 국면이 하락이면 인버스(1배·2배) 안건 → 결재 → 실행, 국면 회복·반등·보유 기한이면 정리 안건
- `invList` 6999
- `invLevOf` 7000
- `invHeld` 7001
- `invDecision` 7003
- `invEvaluate` 7021
- `invExec` 7035
- `invBacktest` 7049
- `invBtLine` 7084
- `renderInv` 7086
- `invFacts` 7130
- `invChecks` 7143

**7162** · ---- 운용 현황: 전략으로 산 종목마다 지금 단계 · 손절선 · 매도선 · 다음 할 일 (산 뒤의 대응이 이 매매의 핵심)
- `manageRows` 7163
- `renderManage` 7176
- `manageFacts` 7193

**7197** · ---- 주요 뉴스 띠: 지수 띠 오른쪽에 지금 가장 많이 다뤄지는 경제(또는 종합) 뉴스 제목을 6초마다 넘겨 보여 줌 · 3분마다 새로 받음
- `loadTopNews` 7199
- `newsAgo` 7205
- `renderNewsTicker` 7206
- `topNewsFacts` 7226

**7229** · ---- 시장 국면 기준 한 줄: 왼쪽 위 '시장 국면' 칸 아래에 판정 기준과 가장 큰 근거를 보여 줌
- `regimeNote` 7230

**7237** · ---- 1. 돌파 대기 목록: 저가권 200일 스퀴즈 상태인데 아직 상단 아래 — 상단까지 가까운 순, 가까워지면 알림
- `waitList` 7240
- `waitCodes` 7256
- `renderWait` 7257
- `waitAlerts` 7270

**7276** · ---- 2. 장중 돌파 감시: 장중(매매 시간대 전)에 대기 종목이 상단을 뚫으면 바로 알리고, 결재 안건을 미리 올려 둠
- `intradayWatch` 7279

**7310** · ---- 3. 폰 알림(텔레그램): 결재 안건 · 장중 돌파 · 매도/손절 조건 같은 중요한 알림을 폰으로
- `phone` 7313
- `savePhone` 7314
- `phoneNotify` 7316
- `renderPhone` 7324

**7356** · ---- 텔레그램 명령: 폰에서 보낸 말을 중계기가 받아 여기로 전달 → 조회 · 비서 대화 · 모의 결재(리스크 브리핑 읽기 + PIN + 이유) → 답을 폰으로
- `pinHash` 7360
- `tgReply` 7365
- `agShort` 7369
- `agByShort` 7370
- `tgHandle` 7373
- `tgStart` 7444
- `savePin` 7452
- `chatSend` 7457
- `convoNext` 7483
- `convoToggle` 7489
- `voiceSel` 7505
- `stopSpeaking` 7507
- `speechChunks` 7514
- `pcmToWavBlob` 7521
- `audioBlob` 7529
- `speakText` 7534
- `browserSpeak` 7568
- `micToggle` 7582
- `silenceMs` 7591
- `endWait` 7596
- `startSR` 7604
- `startRecorder` 7655

**7727** · 22. 매매 스타일 학습 — 작은 신경망(입력 9 → 은닉 12 → 출력 1)으로 '진입 조건 → 수익 여부'를 학습
- `featVec` 7735
- `mlpForward` 7740
- `aucOf` 7745
- `trainStyle` 7753
- `retrainStyle` 7804
- `predictWin` 7817
- `predictBin` 7824
- `styleProfile` 7831
- `renderStyle` 7840

### 설정 키 (`DEFAULTS` — `SETTING_DEFS`에 화면 항목)

`capital`, `slotPct`, `maxPos`, `slotAuto`, `approval`, `invOn`, `invEntry`, `invExit`, `invLev`, `invLevScore`, `invPct`, `invMaxDays`, `invExitMa`, `inv1`, `inv2`, `entryMode`, `sqPct`, `sqDrop`, `sqRange`, `sqZone`, `sqFollow`, `sqFollowDays`, `waitPct`, `waitAlertPct`, `lcWait`, `lcAtr`, `lcChg`, `lcDays`, `ma5Confirm`, `accOn`, `accPct`, `accDays`, `accFlat`, `accCmf`, `midSettleDays`, `smallPH`, `smallCap`, `phOn`, `phCap`, `phDays`, `brOn`, `brMin`, `sigCap`, `obvNeed`, `obvDays`, `closeTop`, `bbPeriod`, `bbStd`, `exitMa`, `pullbackPct`, `stopMode`, `tpPct`, `w1`, `w2`, `w3`, `scrMarket`, `scrMinValue`, `scrMinPrice`, `mktBars`, `nearPct`, `winStart`, `winEnd`, `volFilter`, `volMult`, `adxFilter`, `adxMin`, `rank`, `buyFee`, `sellFee`, `taxPct`, `slipPct`, `barCount`, `minCount`, `liveSec`, `listMin`, `rtMax`, `decisionTime`, `pollMin`, `holidays`, `stratV`

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
