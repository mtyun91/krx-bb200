# 신호가 너무 적을 때: 스퀴즈 기준 완화 + 돌파 뒤 '전고점 돌파' 후속 매수 검증
#  셋업 = 200일 밴드 상단 첫 돌파 양봉 중 스퀴즈(밴드 폭 하위 sqPct%·하락 흔적·120일 횡보) + 저가권(3년 범위 아래 zone)
#  후속 매수 = 셋업 뒤 2일 이상 지나 follow일 안에, 종가가 셋업 이후 최고가(전고점)를 처음 넘는 양봉
#  매도 = 종가 10일선 이탈 (+ 손절: 종가가 셋업 봉 저가 아래)
import os, glob, warnings
import numpy as np, pandas as pd
warnings.filterwarnings('ignore')
D = os.path.join(os.path.dirname(__file__), 'data')
COST, MIN_AMT = 0.0032, 30e8
R = []


def seg(df):
    c = df.Close.values
    cut = [0] + list(np.where(np.abs(c[1:] / c[:-1] - 1) > 0.305)[0] + 1) + [len(c)]
    for a, b in zip(cut[:-1], cut[1:]):
        if b - a >= 800:
            yield df.iloc[a:b]


VARIANTS = [  # 이름, sqPct, zone(아래 몇 %), 첫 봉 매수, 후속 매수, follow 일
    ('지금: 스퀴즈15·저가권33·첫 봉', 0.15, 0.33, True, False, 0),
    ('저가권50·첫 봉', 0.15, 0.50, True, False, 0),
    ('폭25·저가권50·첫 봉', 0.25, 0.50, True, False, 0),
    ('저가권33·전고점 돌파만(20일)', 0.15, 0.33, False, True, 20),
    ('저가권33·첫 봉+전고점(20일)', 0.15, 0.33, True, True, 20),
    ('저가권50·첫 봉+전고점(20일)', 0.15, 0.50, True, True, 20),
    ('저가권50·첫 봉+전고점(40일)', 0.15, 0.50, True, True, 40),
    ('폭25·저가권50·첫 봉+전고점(20일)', 0.25, 0.50, True, True, 20),
    ('폭25·저가권50·첫 봉+전고점(40일)', 0.25, 0.50, True, True, 40),
    ('저가권 없음·첫 봉+전고점(20일)', 0.15, 1.01, True, True, 20),
]

for f in glob.glob(os.path.join(D, '*.csv')):
    d0 = pd.read_csv(f)
    d0 = d0[(d0.Volume > 0) & (d0.Open > 0)].reset_index(drop=True)
    for df in seg(d0):
        o, h, l, c, v = (df[k].values.astype(float) for k in ['Open', 'High', 'Low', 'Close', 'Volume'])
        yr = df.Date.str[:4].astype(int).values
        n = len(c)
        S = lambda k: pd.Series(c).rolling(k).mean().values
        ma10 = S(10)
        mid = S(200); sd = pd.Series(c).rolling(200).std(ddof=0).values
        up = mid + 2 * sd
        wpct = pd.Series(4 * sd / mid).rolling(750, min_periods=500).apply(lambda x: (x[:-1] < x[-1]).mean(), raw=True).values
        hh500 = pd.Series(h).rolling(500, min_periods=300).max().values; ll250 = pd.Series(l).rolling(250).min().values
        hh120 = pd.Series(h).rolling(120).max().values; ll120 = pd.Series(l).rolling(120).min().values
        hh750 = pd.Series(h).rolling(750, min_periods=500).max().values; ll750 = pd.Series(l).rolling(750, min_periods=500).min().values
        amt = pd.Series(c * v).rolling(60).mean().values
        setups = []   # (i, wpct, zone)
        for i in range(260, n - 2):
            if not (c[i] > up[i] and c[i - 1] <= up[i - 1] and c[i] > o[i]) or np.isnan(wpct[i - 1]) or amt[i - 1] < MIN_AMT:
                continue
            if not (ll250[i - 1] / hh500[i - 1] <= 0.7 and hh120[i - 1] / ll120[i - 1] <= 1.6):
                continue
            setups.append((i, wpct[i - 1], (c[i] - ll750[i - 1]) / max(hh750[i - 1] - ll750[i - 1], 1e-9)))

        def exit_from(e, stop):
            for j in range(e + 1, min(n, e + 400)):
                if c[j] < stop or c[j] < ma10[j]:
                    return c[j] / c[e] * (1 - COST) - 1, j - e, j
            return None

        for name, sp, zone, first, follow, fdays in VARIANTS:
            busy = -1
            for (i, wp, z) in setups:
                if wp > sp or z > zone:
                    continue
                entries = []
                if first:
                    entries.append((i, '첫 봉'))
                if follow:
                    hh = h[i]
                    for j in range(i + 1, min(n - 1, i + fdays + 1)):
                        if j - i >= 2 and c[j] > hh and c[j] > o[j]:
                            entries.append((j, '전고점'))
                            break
                        hh = max(hh, h[j])
                for e, kind in entries:
                    if e <= busy:
                        continue
                    r = exit_from(e, l[i])
                    if not r:
                        continue
                    R.append(dict(v=name, kind=kind, ret=r[0], hold=r[1], per='~2020' if yr[e] <= 2020 else '2021~'))
                    busy = r[2]

T = pd.DataFrame(R)


def st(g):
    r = g.ret
    return pd.Series({'거래': len(g), '승률%': (r > 0).mean() * 100, '평균%': r.mean() * 100, 'PF': r[r > 0].sum() / max(-r[r < 0].sum(), 1e-9), '보유일': g.hold.mean()})


pd.set_option('display.width', 220)
rows = []
for name, *_ in VARIANTS:
    g = T[T.v == name]
    a = st(g); a.name = name; rows.append(a)
    for p, y in g.groupby('per'):
        b = st(y); b.name = f'   {p}'; rows.append(b)
    if g.kind.nunique() > 1:
        for k, y in g.groupby('kind'):
            b = st(y); b.name = f'   └ {k}'; rows.append(b)
print(pd.DataFrame(rows).round(2).to_string())
