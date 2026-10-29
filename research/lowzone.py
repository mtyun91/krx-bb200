# 저가권 스퀴즈 돌파 + 운용(손절·추가 매수·매도선) 검증
#  저가권: 돌파 가격이 2년 고점보다 얼마나 아래인지 / 3년 가격 범위에서 어디쯤인지
#  운용: 매도선(5·10·20일선), 실패 돌파 손절(돌파봉 저가·횡보 박스 저가), 절반 익절 뒤 나머지 추세 매도
import os, glob, warnings
import numpy as np, pandas as pd
warnings.filterwarnings('ignore')
D = os.path.join(os.path.dirname(__file__), 'data')
COST = 0.0032
MIN_AMT = 30e8
SIG = []


def seg(df):
    c = df.Close.values
    cut = [0] + list(np.where(np.abs(c[1:] / c[:-1] - 1) > 0.305)[0] + 1) + [len(c)]
    for a, b in zip(cut[:-1], cut[1:]):
        if b - a >= 800:
            yield df.iloc[a:b]


def run_exit(o, h, l, c, mas, e, rule, stopv):
    """e일 종가 매수 → (수익률, 보유일). rule: ('ma', n) / ('half', 익절%, n)"""
    n = len(c)
    px = c[e]
    if rule[0] == 'ma':
        m = mas[rule[1]]
        for j in range(e + 1, min(n, e + 500)):
            if stopv is not None and c[j] < stopv:
                return c[j] / px * (1 - COST) - 1, j - e
            if c[j] < m[j]:
                return c[j] / px * (1 - COST) - 1, j - e
        return None
    _, tp, mn = rule
    m = mas[mn]
    half = None
    for j in range(e + 1, min(n, e + 500)):
        if half is None:
            if stopv is not None and c[j] < stopv:
                return c[j] / px * (1 - COST) - 1, j - e
            if h[j] >= px * (1 + tp):
                half = px * (1 + tp)
                stopv = px   # 절반 익절 뒤에는 본전 아래로 안 내려가게
                continue
            if c[j] < m[j]:
                return c[j] / px * (1 - COST) - 1, j - e
        else:
            if c[j] < max(m[j], stopv):
                r = (0.5 * half + 0.5 * c[j]) / px
                return r * (1 - COST) - 1, j - e
    return None


for f in glob.glob(os.path.join(D, '*.csv')):
    d0 = pd.read_csv(f)
    d0 = d0[(d0.Volume > 0) & (d0.Open > 0)].reset_index(drop=True)
    for df in seg(d0):
        o, h, l, c, v = (df[k].values.astype(float) for k in ['Open', 'High', 'Low', 'Close', 'Volume'])
        yr = df.Date.str[:4].astype(int).values
        n = len(c)
        S = lambda k: pd.Series(c).rolling(k).mean().values
        mas = {k: S(k) for k in (5, 10, 20)}
        mid = S(200); sd = pd.Series(c).rolling(200).std(ddof=0).values
        up, lo = mid + 2 * sd, mid - 2 * sd
        wid = (up - lo) / mid
        wpct = pd.Series(wid).rolling(750, min_periods=500).apply(lambda x: (x[:-1] < x[-1]).mean(), raw=True).values
        hh500 = pd.Series(h).rolling(500, min_periods=300).max().values
        ll250 = pd.Series(l).rolling(250).min().values
        hh120 = pd.Series(h).rolling(120).max().values; ll120 = pd.Series(l).rolling(120).min().values
        hh750 = pd.Series(h).rolling(750, min_periods=500).max().values; ll750 = pd.Series(l).rolling(750, min_periods=500).min().values
        ll60 = pd.Series(l).rolling(60).min().values
        amt = pd.Series(c * v).rolling(60).mean().values
        busy = {}
        for i in range(260, n - 2):
            if not (c[i] > up[i] and c[i - 1] <= up[i - 1] and c[i] > o[i]) or np.isnan(wpct[i - 1]) or amt[i - 1] < MIN_AMT:
                continue
            sq = wpct[i - 1] <= 0.15 and ll250[i - 1] / hh500[i - 1] <= 0.7 and hh120[i - 1] / ll120[i - 1] <= 1.6
            below2y = 1 - c[i] / hh500[i - 1]                        # 2년 고점보다 몇 % 아래
            pos3y = (c[i] - ll750[i - 1]) / max(hh750[i - 1] - ll750[i - 1], 1e-9)   # 3년 범위에서 위치 (0=바닥, 1=꼭대기)
            row = dict(sq=sq, below2y=below2y, pos3y=pos3y, per='~2020' if yr[i] <= 2020 else '2021~')
            for name, rule, stop in [('5일선', ('ma', 5), None), ('10일선', ('ma', 10), None), ('20일선', ('ma', 20), None),
                                     ('돌파봉저가손절+10일선', ('ma', 10), l[i]), ('돌파봉저가손절+20일선', ('ma', 20), l[i]),
                                     ('박스저가손절+20일선', ('ma', 20), ll60[i - 1]),
                                     ('절반익절20%+20일선(돌파봉저가손절)', ('half', 0.2, 20), l[i]),
                                     ('절반익절30%+20일선(돌파봉저가손절)', ('half', 0.3, 20), l[i])]:
                if i <= busy.get(name, -1):
                    continue
                r = run_exit(o, h, l, c, mas, i, rule, stop)
                if r:
                    SIG.append({**row, 'exit': name, 'ret': r[0], 'hold': r[1]})
                    busy[name] = i + r[1]

T = pd.DataFrame(SIG)
T.to_pickle(os.path.join(os.path.dirname(__file__), 'lowzone.pkl'))


def st(g):
    r = g.ret
    return pd.Series({'거래': len(g), '승률%': (r > 0).mean() * 100, '평균%': r.mean() * 100, 'PF': r[r > 0].sum() / max(-r[r < 0].sum(), 1e-9), '보유일': g.hold.mean()})


pd.set_option('display.width', 220)
base = T[T.exit == '10일선']
print('== 저가권 조건별 (매도 10일선) ==')
F = [('모든 돌파', base), ('스퀴즈', base[base.sq]),
     ('스퀴즈 + 2년 고점보다 20%↓', base[base.sq & (base.below2y >= 0.2)]), ('스퀴즈 + 30%↓', base[base.sq & (base.below2y >= 0.3)]), ('스퀴즈 + 40%↓', base[base.sq & (base.below2y >= 0.4)]),
     ('스퀴즈 + 3년 범위 아래 절반', base[base.sq & (base.pos3y <= 0.5)]), ('스퀴즈 + 아래 1/3', base[base.sq & (base.pos3y <= 0.33)]),
     ('모든 돌파 중 고가권(2년 고점 10% 안)', base[base.below2y < 0.1])]
rows = []
for nm, g in F:
    a = st(g); a.name = nm; rows.append(a)
    for p, y in g.groupby('per'):
        b = st(y); b.name = f'   {p}'; rows.append(b)
print(pd.DataFrame(rows).round(2).to_string())
for nm, cond in [('스퀴즈', lambda x: x.sq), ('스퀴즈 + 2년 고점보다 30%↓', lambda x: x.sq & (x.below2y >= 0.3)), ('스퀴즈 + 3년 범위 아래 절반', lambda x: x.sq & (x.pos3y <= 0.5))]:
    print(f'\n== 운용(매도·손절) 비교 — {nm} ==')
    g = T[cond(T)]
    rows = []
    for ex, y in g.groupby('exit', sort=False):
        a = st(y); a.name = ex; rows.append(a)
        for p, z in y.groupby('per'):
            b = st(z); b.name = f'   {p}'; rows.append(b)
    print(pd.DataFrame(rows).round(2).to_string())
