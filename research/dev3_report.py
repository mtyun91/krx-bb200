import os, pandas as pd, numpy as np
df = pd.read_pickle(os.path.join(os.path.dirname(__file__), 'dev3.pkl'))


def pf(r):
    r = r.dropna()
    if len(r) < 5:
        return f'{len(r)}건'
    g = r[r > 0].sum(); b = -r[r < 0].sum()
    return f'PF {g / b:4.2f} 평균 {r.mean() * 100:+5.2f}% 승률 {(r > 0).mean() * 100:3.0f}% {len(r):5d}건'


def split(x, col='r0'):
    a, b = x[x.yr <= 2020][col], x[x.yr >= 2021][col]
    return f'{pf(x[col])}  | ~2020 {pf(a)[:7]} / 2021~ {pf(b)[:7]}'


U = {
    '모든 돌파': df,
    '수축(폭25·횡보60)': df[(df.wp <= .25) & (df.rng <= .6)],
    '지금 스퀴즈(폭15·하락30·횡보60·저가권50)': df[(df.wp <= .15) & (df.dd >= .3) & (df.rng <= .6) & (df.zone <= .5)],
}
print('=== 1. 돌파 종가 매수(E0) vs 매수 대기 → 5일선 지지 매수 ===')
for k, x in U.items():
    print(f'\n[{k}]')
    print(' E0 돌파 종가      ', split(x, 'r0'))
    print(' E1 5일선 지지 종가 ', split(x, 'r1'), f' 체결 {x.r1.notna().mean() * 100:.0f}%')
    print(' E1b 장중 5일선    ', split(x, 'r1b'), f' 체결 {x.r1b.notna().mean() * 100:.0f}%')
    print(' 신호당 평균(못 사면 0): E0 %+.2f%%  E1 %+.2f%%  E1b %+.2f%%' % (x.r0.mean() * 100, x.r1.fillna(0).mean() * 100, x.r1b.fillna(0).mean() * 100))
    print(' E1b로 못 산 신호의 E0 성과', pf(x[x.r1b.isna()].r0), ' / 산 신호의 E0 성과', pf(x[x.r1b.notna()].r0))

print('\n=== 2. 중심선 안착 ===')
for k, x in U.items():
    print(f'\n[{k}]')
    for lab, m in [('직전20일 중심선 위 <50%', x.set20 < .5), ('50~80%', (x.set20 >= .5) & (x.set20 < .8)), ('80~99%', (x.set20 >= .8) & (x.set20 < 1)), ('100% (20일 내내 위)', x.set20 >= 1)]:
        print(f' {lab:22s}', split(x[m]))
    for lab, m in [('중심선 아래였던 게 5일 안', x.below_last <= 5), ('6~10일 전', (x.below_last > 5) & (x.below_last <= 10)), ('11~20일 전', (x.below_last > 10) & (x.below_last <= 20)), ('21~60일 전', (x.below_last > 20) & (x.below_last <= 60)), ('60일 넘게 위', x.below_last > 60)]:
        print(f' {lab:22s}', split(x[m]))

print('\n=== 3. 시가총액 × 전고점(상단 찌르고 음봉으로 밀린 봉 이후 최고가) ===')
cap = pd.cut(df.cap, [0, 5e11, 2e12, 1e20], labels=['소형(<5천억)', '중형(5천억~2조)', '대형(2조+)'])
for k, x in U.items():
    print(f'\n[{k}]')
    cx = cap[x.index]
    for cl in ['대형(2조+)', '중형(5천억~2조)', '소형(<5천억)']:
        y = x[cx == cl]
        print(f' {cl}  전체 {pf(y.r0)}')
        for st, lab in [('none', '전고점 없음'), ('broke', '전고점 뚫음'), ('below', '전고점 아래')]:
            print(f'    {lab:8s}', split(y[y.ph == st]))
