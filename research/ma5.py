# 돌파 뒤 '5일선 안착'에 사는 방식 검증 (모든 돌파 / 200일 스퀴즈 돌파)
import os, glob, warnings
import numpy as np, pandas as pd
warnings.filterwarnings('ignore')
D = os.path.join(os.path.dirname(__file__), 'data')
COST = 0.0032
MIN_AMT = 30e8
R = []

def seg(df):
    c = df.Close.values
    cut = [0] + list(np.where(np.abs(c[1:] / c[:-1] - 1) > 0.305)[0] + 1) + [len(c)]
    for a, b in zip(cut[:-1], cut[1:]):
        if b - a >= 800:
            yield df.iloc[a:b]

for f in glob.glob(os.path.join(D, '*.csv')):
    d0 = pd.read_csv(f)
    d0 = d0[(d0.Volume > 0) & (d0.Open > 0)].reset_index(drop=True)
    for df in seg(d0):
        o, h, l, c, v = (df[k].values.astype(float) for k in ['Open', 'High', 'Low', 'Close', 'Volume'])
        yr = df.Date.str[:4].astype(int).values
        n = len(c)
        S = lambda k: pd.Series(c).rolling(k).mean().values
        ma5, ma10, ma20 = S(5), S(10), S(20)
        mid = S(200); sd = pd.Series(c).rolling(200).std(ddof=0).values
        up, lo = mid + 2 * sd, mid - 2 * sd
        wid = (up - lo) / mid
        wpct = pd.Series(wid).rolling(750, min_periods=500).apply(lambda x: (x[:-1] < x[-1]).mean(), raw=True).values
        hh500 = pd.Series(h).rolling(500, min_periods=300).max().values; ll250 = pd.Series(l).rolling(250).min().values
        hh120 = pd.Series(h).rolling(120).max().values; ll120 = pd.Series(l).rolling(120).min().values
        amt = pd.Series(c * v).rolling(60).mean().values

        def exit10(e, px):
            for j in range(e + 1, min(n, e + 400)):
                if c[j] < ma10[j]:
                    return c[j] / px * (1 - COST) - 1, j - e, j
            return None

        busy = {k: -1 for k in ('E0', 'E1', 'E2', 'E3')}
        for i in range(260, n - 2):
            if not (c[i] > up[i] and c[i - 1] <= up[i - 1] and c[i] > o[i]) or np.isnan(wpct[i - 1]) or amt[i - 1] < MIN_AMT:
                continue
            sq = wpct[i - 1] <= 0.15 and ll250[i - 1] / hh500[i - 1] <= 0.7 and hh120[i - 1] / ll120[i - 1] <= 1.6
            ent = {'E0': (i, c[i])}
            # E1 종가 안착: 돌파 뒤 10일 안에 저가가 5일선 +1% 안까지 내려왔다가 종가는 5일선 위 양봉 (그날 종가 매수)
            # E2 장중 안착: 저가가 5일선을 건드리고 5일선 +0.5% 위로 반등하면 그 가격에 매수 (봉 안 순서는 모름 — 근사)
            # E3 다음 날부터 연속 안착: 돌파 다음 날·그다음 날 종가가 모두 5일선 위면 둘째 날 종가 매수
            for j in range(i + 1, min(n - 1, i + 11)):
                if c[j] < ma20[j]:
                    break
                if 'E1' not in ent and l[j] <= ma5[j] * 1.01 and c[j] > ma5[j] and c[j] > o[j]:
                    ent['E1'] = (j, c[j])
                if 'E2' not in ent and l[j] <= ma5[j] and h[j] >= ma5[j] * 1.005:
                    ent['E2'] = (j, max(o[j], ma5[j] * 1.005) if o[j] > ma5[j] else ma5[j] * 1.005)
            if i + 2 < n and c[i + 1] > ma5[i + 1] and c[i + 2] > ma5[i + 2]:
                ent['E3'] = (i + 2, c[i + 2])
            for k, (e, px) in ent.items():
                if e <= busy[k]:
                    continue
                r = exit10(e, px)
                if not r:
                    continue
                busy[k] = r[2]
                R.append(dict(k=k, sq=sq, ret=r[0], hold=r[1], wait=e - i, per='~2020' if yr[e] <= 2020 else '2021~'))

T = pd.DataFrame(R)
T.to_pickle(os.path.join(os.path.dirname(__file__), 'ma5.pkl'))
def st(g):
    r = g.ret
    return pd.Series({'거래': len(g), '승률%': (r > 0).mean() * 100, '평균%': r.mean() * 100, 'PF': r[r > 0].sum() / -r[r < 0].sum(), '보유일': g.hold.mean(), '대기일': g.wait.mean()})
NM = {'E0': '돌파 당일 종가(지금)', 'E1': '5일선 눌림 뒤 종가 안착', 'E2': '5일선 닿고 반등 시 장중', 'E3': '다음 2일 연속 5일선 위'}
pd.set_option('display.width', 200)
for sq in (False, True):
    print('\n==', '200일 스퀴즈 돌파만' if sq else '모든 돌파', '==')
    g = T[T.sq] if sq else T
    rows = []
    for k in NM:
        x = g[g.k == k]
        a = st(x); a.name = NM[k]; rows.append(a)
        for p, y in x.groupby('per'):
            b = st(y); b.name = f'   {p}'; rows.append(b)
    print(pd.DataFrame(rows).round(2).to_string())
