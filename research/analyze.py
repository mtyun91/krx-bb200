# BB200 상단 돌파: 장대양봉 · 200일 스퀴즈 · 확장 중 재돌파 가설 검증
import os, glob, sys
import numpy as np, pandas as pd, warnings
warnings.filterwarnings("ignore")

D = os.path.join(os.path.dirname(__file__), 'data')
COST = (0.01 + 0.05 + 0.01 + 0.20 + 0.05) / 100   # 앱 백테스트와 같은 왕복 비용
MIN_AMT = 30e8                                     # 그때 기준 60일 평균 거래대금 30억 이상만

def roll_mean(x, n):
    s = pd.Series(x).rolling(n).mean().values
    return s

def segments(df):
    c = df.Close.values
    r = np.abs(c[1:] / c[:-1] - 1)
    cut = [0] + list(np.where(r > 0.305)[0] + 1) + [len(c)]   # 가격제한폭 넘는 점프 = 액면분할 등 → 끊어서
    for a, b in zip(cut[:-1], cut[1:]):
        if b - a >= 800:
            yield df.iloc[a:b]

def ma_exit(c, ma, i0, cap=400):
    for j in range(i0 + 1, min(len(c), i0 + cap)):
        if not np.isnan(ma[j]) and c[j] < ma[j]:
            return j
    return None

sigs, trades = [], {k: [] for k in ['S0', 'S1', 'S2A', 'S2B', 'S3', 'S4']}

for f in glob.glob(os.path.join(D, '*.csv')):
    df0 = pd.read_csv(f, parse_dates=['Date'])
    df0 = df0[(df0.Volume > 0) & (df0.Open > 0)]
    for df in segments(df0.reset_index(drop=True)):
        o, h, l, c, v = (df[k].values.astype(float) for k in ['Open', 'High', 'Low', 'Close', 'Volume'])
        t = df.Date.values
        n = len(c)
        mid = roll_mean(c, 200)
        sd = pd.Series(c).rolling(200).std(ddof=0).values
        up, lo = mid + 2 * sd, mid - 2 * sd
        wid = (up - lo) / mid
        mas = {k: roll_mean(c, k) for k in (5, 10, 20, 60, 120)}
        tr = np.maximum(h - l, np.maximum(np.abs(h - np.r_[c[0], c[:-1]]), np.abs(l - np.r_[c[0], c[:-1]])))
        atr = roll_mean(tr, 20)
        amt = roll_mean(c * v, 60)
        vma = roll_mean(v, 20)
        wser = pd.Series(wid)
        wpct = wser.rolling(750, min_periods=500).apply(lambda x: (x[:-1] < x[-1]).mean(), raw=True).values
        hh120 = pd.Series(h).rolling(120).max().values; ll120 = pd.Series(l).rolling(120).min().values
        hh500 = pd.Series(h).rolling(500, min_periods=300).max().values
        ll250 = pd.Series(l).rolling(250).min().values
        spread = (np.nanmax(np.vstack([mas[k] for k in (5, 20, 60, 120)]), 0) / np.nanmin(np.vstack([mas[k] for k in (5, 20, 60, 120)]), 0) - 1)

        info = {}
        for i in range(260, n - 1):
            if not (c[i] > up[i] and c[i - 1] <= up[i - 1] and c[i] > o[i]) or np.isnan(wpct[i - 1]) or amt[i - 1] < MIN_AMT:
                continue
            body = c[i] - o[i]
            lc = (body >= 2 * atr[i - 1] or c[i] / c[i - 1] - 1 >= 0.07) and body / max(h[i] - l[i], 1e-9) >= 0.6
            sq_core = wpct[i - 1] <= 0.15
            decline = ll250[i - 1] / hh500[i - 1] <= 0.7 if not np.isnan(hh500[i - 1]) else False
            side = hh120[i - 1] / ll120[i - 1] <= 1.6
            sq_full = sq_core and decline and side
            ex = wpct[i - 1] >= 0.5
            typ = 'SQ' if sq_full else 'EX' if ex else 'MID'
            fw = lambda k: c[i + k] / c[i] - 1 if i + k < n else np.nan
            # 장대양봉 뒤 N자: 15일 안에 몸통 절반 반납 → 그 뒤 40일 안에 장대양봉 고가 위 종가
            half = c[i] - body / 2
            pb = next((j for j in range(i + 1, min(n, i + 16)) if c[j] < half), None)
            rb = next((j for j in range(pb + 1, min(n, pb + 41)) if c[j] > h[i]), None) if pb else None
            sigs.append(dict(date=t[i], lc=lc, sq_core=sq_core, sq=sq_full, typ=typ, wpct=wpct[i - 1], spread=spread[i - 1],
                             r5=fw(5), r20=fw(20), r60=fw(60), r120=fw(120),
                             mx120=(h[i + 1:i + 121].max() / c[i] - 1) if i + 121 < n else np.nan,
                             pull=pb is not None, nre=rb is not None))
            info[i] = (lc, typ, body, half)

        # ---- 전략별 거래 (종목당 한 번에 하나) ----
        def run(name, entry_fn, exit_ma_fn):
            busy = -1
            for i in sorted(info):
                if i <= busy:
                    continue
                e = entry_fn(i)
                if e is None or e <= busy:
                    continue
                j = ma_exit(c, mas[exit_ma_fn(i)], e)
                if j is None:
                    continue
                trades[name].append(dict(date=t[e], typ=info[i][1], lc=info[i][0], ret=c[j] / c[e] * (1 - COST) - 1, hold=j - e))
                busy = j

        def wait_a(i):   # 장대양봉: 3일 이상 쉬며 종가가 장대양봉 종가 아래로 눌린 뒤, 거래량 줄고, 양봉으로 전날 고가 돌파
            lc, typ, body, half = info[i]
            dipped = False
            for j in range(i + 1, min(n, i + 16)):
                if c[j] < half:
                    return None
                if c[j] < c[i]:
                    dipped = True
                if j - i >= 3 and dipped and c[j] > h[j - 1] and c[j] > o[j] and v[i + 1:j].mean() < v[i] * 0.6:
                    return j
            return None

        def wait_b(i):   # 장대양봉: 3일 이상 지나 눌림이 있었고, 장대양봉 고가 위 종가
            lc, typ, body, half = info[i]
            dipped = False
            for j in range(i + 1, min(n, i + 16)):
                if c[j] < half:
                    return None
                if c[j] < c[i]:
                    dipped = True
                if j - i >= 3 and dipped and c[j] > h[i]:
                    return j
            return None

        same = lambda i: i
        ex10 = lambda i: 10
        bytype = lambda i: {'SQ': 20, 'EX': 5, 'MID': 10}[info[i][1]]
        run('S0', same, ex10)
        run('S1', lambda i: None if info[i][0] else i, ex10)
        run('S2A', lambda i: wait_a(i) if info[i][0] else i, ex10)
        run('S2B', lambda i: wait_b(i) if info[i][0] else i, ex10)
        run('S3', same, bytype)
        run('S4', lambda i: (wait_a(i) if info[i][0] and info[i][1] != 'SQ' else i), bytype)

S = pd.DataFrame(sigs)
S.to_pickle(os.path.join(os.path.dirname(__file__), 'sigs.pkl'))
pd.to_pickle(trades, os.path.join(os.path.dirname(__file__), 'trades.pkl'))
print('signals', len(S))
