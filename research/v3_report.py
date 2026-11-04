# 2판 신호(기본 + 체력40 + 시총2천억 + OBV)에 조건을 하나씩 더해 보기 — 앞(2020까지)·뒤(2021부터) 모두 좋아지는 것만 채택 후보
import os
import numpy as np, pandas as pd
H0 = os.path.dirname(os.path.abspath(__file__))
df = pd.read_pickle(os.path.join(H0, 'v2_break.pkl'))
br = pd.read_pickle(os.path.join(H0, 'v2_breadth.pkl'))
br20 = br.shift(20); br5 = br.shift(5)
df['br_d20'] = df.breadth - df.date.map(br20)
df['br_d5'] = df.breadth - df.date.map(br5)
YEARS = df.yr.max() - df.yr.min() + 1


def pfac(r):
    g, l = r[r > 0].sum(), -r[r < 0].sum()
    return g / l if l > 0 else np.nan


def st(x, col):
    r = x[col].dropna()
    a, b = x[x.yr <= 2020][col].dropna(), x[x.yr >= 2021][col].dropna()
    return len(r), (r > 0).mean() * 100, r.mean() * 100, pfac(r), pfac(a), pfac(b)


def line(name, x, col='p10b', ref=None):
    n, w, m, p, pa, pb = st(x, col)
    mark = ''
    if ref is not None:
        mark = ' ★' if (pa > ref[4] and pb > ref[5] and w >= ref[1]) else ''
    return f'{name:<40} {n:>5} 주{n / (YEARS * 52):4.1f} 승률{w:5.1f}% 평균{m:+6.2f}% PF{p:5.2f} ({pa:4.2f}/{pb:4.2f}){mark}'


sq = (df.wp <= .15) & (df.dd >= .30) & (df.rng <= .60)
settle = df.below_last > 5
smallok = ~((df.cap < 5000) & (df.ph == 'none'))
phpath = (df.ph == 'broke') & (df.cap >= 5000)
acc = (df.wp <= .25) & (df.flat120 <= .15) & df.obvhi & (df.cmf >= .1)
base = settle & smallok & ((sq & (df.zone <= .5)) | phpath | acc)
V2 = df[base & (df.breadth >= .4) & (df.cap >= 2000) & df.obvhi]
ref = st(V2, 'p10b')
print('== 2판 신호 · 매도 방식 ==')
for col, nm in [('p10b', '2판: +10% 절반·본전·20일선'), ('p8b', '+8% 절반·본전·20일선'), ('p12b', '+12% 절반'), ('p15b', '+15% 절반'),
                ('p10n', '+10% 절반·본전 안 올림'), ('pt', '+10% 절반 + 10일 안 +5% 못 넘으면 정리'), ('r20', '익절 없이 20일선')]:
    print(line(nm, V2, col))
print('\n== 2판 신호에 조건 하나 더 (매도는 2판) ★ = 앞·뒤 기간 PF와 승률이 모두 나아짐 ==')
X = V2
F = {
    '시장 체력 60% 미만 (과열 제외)': X.breadth < .6,
    '시장 체력 20일 전보다 오름': X.br_d20 > 0,
    '시장 체력 5일 전보다 오름': X.br_d5 > 0,
    '종가가 봉 위쪽 70% 이상 (윗꼬리 짧음)': X.cpos >= .7,
    '종가가 봉 위쪽 80% 이상': X.cpos >= .8,
    '갭 상승 3% 이하': X.gap <= .03,
    '당일 상승 15% 이하': X.chg <= .15,
    '당일 상승 3% 이상': X.chg >= .03,
    '상단 위 8% 이내': X.ext <= .08,
    '60일 수익률 30% 이하': X.r60 <= .30,
    '60일 수익률 0% 이상': X.r60 >= 0,
    '1년 고점 아래 10% 안': X.hi250 >= -.10,
    '1년 고점 돌파': X.hi250 >= 0,
    '거래량 1.5배 이상': X.volr >= 1.5,
    '거래량 3배 이하': X.volr <= 3,
    'OBV 250일 신고가': X.obvhi250,
    '20일선 위로 향함': X.m20up,
    '60일선 위': X.above60,
    'CMF 0.05 이상': X.cmf >= .05,
    '20일 변동성 3.5% 이하': X.vol20 <= .035,
    '손절폭 8% 이내': X.stoppct >= -.08,
    '시총 5천억 이상': X.cap >= 5000,
    '코스피만': X.mkt == 'KOSPI',
}
print(line('2판 (기준)', X))
for k, m in F.items():
    print(line('+ ' + k, X[m], ref=ref))

import sys
if len(sys.argv) > 1:
    exec(open(sys.argv[1], encoding='utf-8').read())
