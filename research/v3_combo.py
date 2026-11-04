# v3_report.py 뒤에 붙여 실행: python -c "exec(open('research/v3_report.py',encoding='utf-8').read()); exec(open('research/v3_combo.py',encoding='utf-8').read())"
print('\n== 조합 ==')
C = {
    '2판': X.cpos > -1,
    '+ 종가 위쪽 80%': X.cpos >= .8,
    '+ OBV 250일 신고가': X.obvhi250,
    '+ 둘 다': (X.cpos >= .8) & X.obvhi250,
    '+ 둘 다 + 당일 3% 이상': (X.cpos >= .8) & X.obvhi250 & (X.chg >= .03),
    '+ 종가 위쪽 75% + OBV250': (X.cpos >= .75) & X.obvhi250,
}
for k, m in C.items():
    for col, nm in [('p10b', '+10%절반'), ('p8b', '+8%절반'), ('pt', '+10%절반+시간손절'), ('r20', '20일선만')]:
        print(line(f'{k} · {nm}', X[m], col))
x = X[(X.cpos >= .8) & X.obvhi250]
print('\n-- 둘 다 · 연도별 (+10% 절반) --')
for y, g in x.groupby('yr'):
    r = g.p10b.dropna()
    print(f'  {y}: {len(r):4d}건 승률 {(r > 0).mean() * 100:4.1f}% 평균 {r.mean() * 100:+5.2f}% PF {pfac(r):4.2f}')
wk = pd.to_datetime(x.date).dt.to_period('W').value_counts()
allw = pd.period_range(pd.to_datetime(df.date).min(), pd.to_datetime(df.date).max(), freq='W')
cnt = wk.reindex(allw, fill_value=0)
print(f'  주별 신호: 0개 {(cnt == 0).mean() * 100:.0f}% · 2개 이상 {(cnt >= 2).mean() * 100:.0f}%')
