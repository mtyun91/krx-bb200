# v2_report.py 에 이어서 실행되는 조합 표 (python research/v2_report.py research/v2_combo.py)
print('\n-- 조합 (기본 = 지금 규칙 + 매집 경로) --')
br4, br5 = B.breadth >= .4, B.breadth >= .5
cap2 = B.cap >= 2000
combos = {
    '체력40': br4,
    '체력40 + 시총2천억': br4 & cap2,
    '체력40 + 시총2천억 + OBV신고가': br4 & cap2 & B.obvhi,
    '체력50 + 시총2천억': br5 & cap2,
    '체력45 + 시총2천억': (B.breadth >= .45) & cap2,
    '체력40 + 거래대금50억': br4 & (B.amt >= 50),
}
for k, m in combos.items():
    x = B[m]
    for col, nm in [('r10', '10일선'), ('r20', '20일선'), ('p10b', '절반+10%·본전·20일선')]:
        print(line(f'{k} · {nm}', x, col))
    wk = pd.to_datetime(x.date).dt.to_period('W').value_counts()
    allw = pd.period_range(pd.to_datetime(df.date).min(), pd.to_datetime(df.date).max(), freq='W')
    cnt = wk.reindex(allw, fill_value=0)
    print(f'    주별 신호: 0개 {(cnt == 0).mean() * 100:.0f}% · 1개 {(cnt == 1).mean() * 100:.0f}% · 2개 이상 {(cnt >= 2).mean() * 100:.0f}% · 중앙값 {cnt.median():.0f}')
print('\n-- 연도별 (체력40 + 시총2천억 · 20일선) --')
x = B[br4 & cap2]
for y, g in x.groupby('yr'):
    r = g.r20.dropna()
    print(f'  {y}: {len(r):4d}건 승률 {(r > 0).mean() * 100:4.1f}% 평균 {r.mean() * 100:+5.2f}% PF {pfac(r):4.2f}')
print('\n-- 시장 체력 구간별 (기본 신호 · 20일선) --')
for lo, hi in [(0, .3), (.3, .4), (.4, .5), (.5, .6), (.6, 1.01)]:
    g = B[(B.breadth >= lo) & (B.breadth < hi)].r20.dropna()
    print(f'  {lo:.1f}~{hi:.1f}: {len(g):4d}건 승률 {(g > 0).mean() * 100:4.1f}% 평균 {g.mean() * 100:+5.2f}% PF {pfac(g):4.2f}')
