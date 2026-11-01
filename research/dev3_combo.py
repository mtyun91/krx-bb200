import os, pandas as pd
df = pd.read_pickle(os.path.join(os.path.dirname(__file__), 'dev3.pkl'))


def pf(r):
    r = r.dropna()
    if len(r) < 5:
        return f'{len(r)}건'
    g = r[r > 0].sum(); b = -r[r < 0].sum()
    return f'PF {g / b:4.2f} 평균 {r.mean() * 100:+5.2f}% {len(r):5d}건'


def sp(x, col='r0'):
    return f'{pf(x[col])} | ~2020 {pf(x[x.yr <= 2020][col])[:7]} / 2021~ {pf(x[x.yr >= 2021][col])[:7]}'


U = {
    '모든 돌파': df,
    '수축(폭25·횡보60)': df[(df.wp <= .25) & (df.rng <= .6)],
    '지금 스퀴즈': df[(df.wp <= .15) & (df.dd >= .3) & (df.rng <= .6) & (df.zone <= .5)],
}
print('--- 장대양봉(상승 7%+) 돌파만: 돌파 매수 vs 5일선 지지 ---')
for k, x in U.items():
    y = x[x.chg >= .07]
    print(k, 'E0', pf(y.r0), '| E1', pf(y.r1), '| E1b', pf(y.r1b))
print('\n--- 2. 중심선 아래에서 빠르게 올라온 돌파 빼기: 며칠 안 중심선 아래였으면 제외 ---')
for k, x in U.items():
    print(k)
    for n in (0, 3, 5, 10):
        print(f'  {n}일 안 제외', sp(x[x.below_last > n]))
small = df.cap < 5e11
mid = (df.cap >= 5e11) & (df.cap < 2e12)
print('\n--- 3. 소형주는 전고점(앞선 상단 시도) 있어야 ---')
for k, x in U.items():
    s = small[x.index]; m = mid[x.index]
    print(k)
    print('  그대로          ', sp(x))
    print('  소형 전고점 없음 제외', sp(x[~(s & (x.ph == 'none'))]))
    print('  중소형 전고점 없음 제외', sp(x[~((s | m) & (x.ph == 'none'))]))
print('\n--- 2 + 3 같이 (5일 안 중심선 아래 제외 + 소형 전고점 없음 제외) ---')
for k, x in U.items():
    s = small[x.index]
    y = x[(x.below_last > 5) & ~(s & (x.ph == 'none'))]
    print(k, '\n  그대로', sp(x), '\n  2+3   ', sp(y), f'  남는 비율 {len(y) / len(x) * 100:.0f}%')
