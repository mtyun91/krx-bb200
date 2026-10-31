# 200일 밴드 상단 돌파에 '거래량 누적(OBV 신고가)' 조건을 붙이면 나아지나 — 매도 10일선, 돌파봉 저가 손절
import os, glob, warnings
import numpy as np, pandas as pd
warnings.filterwarnings('ignore')
D = os.path.join(os.path.dirname(__file__), 'data')
COST = 0.0032
R = []
for f in glob.glob(os.path.join(D, '*.csv')):
    d = pd.read_csv(f)
    d = d[(d.Volume > 0) & (d.Open > 0)].reset_index(drop=True)
    if len(d) < 800:
        continue
    o, h, l, c, v = (d[k].values.astype(float) for k in ['Open', 'High', 'Low', 'Close', 'Volume'])
    if np.any(np.abs(c[1:] / c[:-1] - 1) > 0.305):
        continue
    s = pd.Series(c)
    ma = s.rolling(200).mean().values; sd = s.rolling(200).std(ddof=0).values
    up = ma + 2 * sd; w = 4 * sd / ma
    m10 = s.rolling(10).mean().values
    obv = np.cumsum(np.sign(np.diff(c, prepend=c[0])) * v)
    ob = pd.Series(obv)
    obv_hi = (ob >= ob.rolling(120).max()).values
    mf = np.where(h > l, ((c - l) - (h - c)) / np.where(h > l, h - l, 1), 0) * v
    cmf = (pd.Series(mf).rolling(20).sum() / pd.Series(v).rolling(20).sum()).values
    amt = pd.Series(c * v).rolling(20).mean().values
    wp = pd.Series(w).rolling(750, min_periods=500).apply(lambda x: (x[:-1] < x[-1]).mean(), raw=True).values
    for i in range(760, len(c) - 1):
        if not (c[i] > up[i] and c[i - 1] <= up[i - 1] and c[i] > o[i] and amt[i] > 30e8):
            continue
        p = i - 1
        hh = h[max(0, p - 499):p + 1].max(); ll = l[max(0, p - 249):p + 1].min()
        h1 = h[p - 119:p + 1].max(); l1 = l[p - 119:p + 1].min()
        H = h[p - 749:p + 1].max(); L = l[p - 749:p + 1].min()
        stop = l[i]; ret = None
        for j in range(i + 1, min(len(c), i + 500)):
            if c[j] < stop or c[j] < m10[j]:
                ret = c[j] / c[i] * (1 - COST) - 1; break
        if ret is None:
            continue
        R.append(dict(ret=ret, wp=wp[p], dd=1 - ll / hh, rng=h1 / l1 - 1, zone=(c[i] - L) / (H - L),
                      obvhi=obv_hi[i], obv_up=obv[i] - obv[i - 120] > 0, px_flat=abs(c[i] / c[i - 120] - 1) < 0.15, cmf=cmf[i]))
df = pd.DataFrame(R)


def pf(x):
    g = x.ret[x.ret > 0].sum(); b = -x.ret[x.ret < 0].sum()
    return f'PF {g / b:.2f}  승률 {(x.ret > 0).mean() * 100:.0f}%  평균 {x.ret.mean() * 100:+.1f}%  {len(x)}건'


sq = (df.wp <= 0.15) & (df.dd >= 0.30) & (df.rng <= 0.60)
acc = df.obvhi & df.px_flat & (df.cmf > 0.1)
print('모든 돌파                      ', pf(df))
print('OBV 120일 신고가               ', pf(df[df.obvhi]))
print('OBV 신고가 + 가격 횡보 + CMF>0.1 (매집)', pf(df[acc]))
print('지금 스퀴즈(폭15·하락30·횡보60)   ', pf(df[sq]))
print('지금 스퀴즈 + 저가권 50         ', pf(df[sq & (df.zone <= 0.5)]))
print('지금 스퀴즈 + 매집              ', pf(df[sq & acc]))
print('폭 25 + 횡보60 + 매집 (하락 조건 없이)', pf(df[(df.wp <= 0.25) & (df.rng <= 0.60) & acc]))
print('폭 15 + 매집 (하락 조건 없이)    ', pf(df[(df.wp <= 0.15) & acc]))
print('스퀴즈 OR (폭25+매집)           ', pf(df[sq & (df.zone <= 0.5) | ((df.wp <= 0.25) & (df.rng <= 0.60) & acc)]))
df.to_pickle(os.path.join(os.path.dirname(__file__), 'obv.pkl'))
