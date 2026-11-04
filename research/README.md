# research — 실제 일봉으로 전략 가설 검증

결과 요약은 `docs/STRATEGY.md`. 데이터·결과 파일(`data/`, `*.pkl`, `report.txt`)은 git에 넣지 않는다.

```bash
pip install finance-datareader pandas numpy
python research/fetch.py     # 코스피·코스닥 보통주 일봉(2013~)을 research/data/ 에 (약 2,500종목, 10~20분)
python research/analyze.py   # 돌파 유형(장대양봉·200일 스퀴즈·밴드 상태)별 이후 수익 + 전략 6가지 비교 → sigs.pkl, trades.pkl
python research/report.py    # 위 결과 표 출력
python research/ma5.py       # 돌파 뒤 5일선 안착 매수 시점 비교
python research/v2_scan.py   # 전략 2판: 돌파마다 특징(시장 체력·시총·OBV 등)과 매도 방식 5가지 + 돌파 직전 선취매 → v2_*.pkl
python research/v2_report.py research/v2_combo.py   # 조건 하나씩·조합·연도별·시장 체력 구간별 표
python research/v2_port.py   # 최대 보유·자금 한도 안에서 포트폴리오로 굴려 보기
```

- 공통 조건: 그때 기준 60일 평균 거래대금 30억 이상, 액면분할 같은 30% 넘는 점프에서 구간을 끊음, 종목당 한 번에 한 포지션, 앱 백테스트와 같은 왕복 비용 0.32%.
- 앱의 `isSqueeze`·`isLongCandle`과 같은 정의를 쓴다 (000100 종목으로 스퀴즈 날짜가 일치하는 것을 확인함). 정의를 바꾸면 양쪽을 함께 바꿀 것.
