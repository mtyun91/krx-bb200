# 사용자 아이디어 3가지 검증용 기록 만들기
#  1) 돌파 뒤 '매수 대기' → 5일선 지지 때 매수 (종가 확인형 / 장중 5일선 지정가형)
#  2) 중심선 아래에서 짧게 상단까지 뚫은 돌파 vs 중심선 안착 뒤 돌파
#  3) 시가총액(대형·중형·소형)별로 '전고점(상단을 찔렀다가 음봉으로 밀린 봉의 고가)'이 있을 때/뚫을 때/없을 때
import os, glob, warnings, json
import numpy as np, pandas as pd
warnings.filterwarnings('ignore')
H0 = os.path.dirname(__file__)
D = os.path.join(H0, 'data')
COST = 0.0032
LST = os.path.join(H0, 'listing.json')
if not os.path.exists(LST):
    import FinanceDataReader as fdr
    L = fdr.StockListing('KRX')
    json.dump({r.Code: [int(r.Stocks), r.Market] for r in L.itertuples() if r.Stocks and r.Stocks == r.Stocks}, open(LST, 'w'))
SH = json.load(open(LST))


def exit_from(c, m10, start, px, stop, n):
    for j in range(start, min(n, start + 500)):
        if c[j] < stop or c[j] < m10[j]:
            return c[j] / px * (1 - COST) - 1, j
    return None, None


R = []
for f in glob.glob(os.path.join(D, '*.csv')):
    code = os.path.basename(f)[:6]
    if code not in SH:
        continue
    shares = SH[code][0]
    d = pd.read_csv(f)
    d = d[(d.Volume > 0) & (d.Open > 0)].reset_index(drop=True)
    if len(d) < 800:
        continue
    o, h, l, c, v = (d[k].values.astype(float) for k in ['Open', 'High', 'Low', 'Close', 'Volume'])
    if np.any(np.abs(c[1:] / c[:-1] - 1) > 0.305):
        continue
    yr = d.Date.str[:4].astype(int).values
    n = len(c)
    s = pd.Series(c)
    mid = s.rolling(200).mean().values; sd = s.rolling(200).std(ddof=0).values
    up = mid + 2 * sd; w = 4 * sd / mid
    m5 = s.rolling(5).mean().values; m10 = s.rolling(10).mean().values
    sum4 = s.rolling(4).sum().shift(1).values   # 전 4일 종가 합 → 5일선과 같아지는 가격 = sum4/4
    amt = pd.Series(c * v).rolling(20).mean().values
    wp = pd.Series(w).rolling(750, min_periods=500).apply(lambda x: (x[:-1] < x[-1]).mean(), raw=True).values
    above = (c >= mid).astype(float)
    for i in range(760, n - 1):
        if not (c[i] > up[i] and c[i - 1] <= up[i - 1] and c[i] > o[i] and amt[i] > 30e8):
            continue
        p = i - 1
        hh = h[p - 499:p + 1].max(); ll = l[p - 249:p + 1].min()
        h1 = h[p - 119:p + 1].max(); l1 = l[p - 119:p + 1].min()
        H = h[p - 749:p + 1].max(); L = l[p - 749:p + 1].min()
        # 중심선 안착
        set20 = above[i - 20:i].mean()                      # 직전 20일 중 종가가 중심선 위인 비율
        below_last = next((k for k in range(1, 121) if c[i - k] < mid[i - k]), 121)   # 마지막으로 중심선 아래였던 게 며칠 전
        # 전고점: 직전 120일(최근 2일 제외) 안에 고가가 상단을 찔렀는데 음봉으로 끝난 봉 → 그 이후 최고가
        ks = [k for k in range(i - 120, i - 2) if h[k] >= up[k] and c[k] < o[k]]
        if ks:
            ph = h[ks[0]:i].max()
            ph_state = 'broke' if c[i] > ph else 'below'
        else:
            ph, ph_state = None, 'none'
        stop = l[i]
        # E0: 돌파 종가 매수
        r0, j0 = exit_from(c, m10, i + 1, c[i], stop, n)
        if r0 is None:
            continue
        # E1: 10일 안 첫 5일선 지지(저가 ≤ 5일선, 종가 > 5일선) 종가 매수 — 그 전에 손절선 아래 종가면 취소
        r1 = r1b = None
        for j in range(i + 1, min(n - 1, i + 11)):
            if c[j] < stop:
                break
            if l[j] <= m5[j] and c[j] > m5[j]:
                r1, _ = exit_from(c, m10, j + 1, c[j], stop, n)
                break
        # E1b: 10일 안 장중 5일선(전 4일 평균 가격)에 닿으면 그 값에 매수(시가가 아래면 시가) — 그날 종가부터 매도 판단
        for j in range(i + 1, min(n - 1, i + 11)):
            lv = sum4[j] / 4
            if l[j] <= lv:
                px = min(o[j], lv)
                if px < stop:
                    break
                r1b, _ = exit_from(c, m10, j, px * (1 + 0.0) , stop, n)
                break
            if c[j] < stop:
                break
        R.append(dict(code=code, yr=yr[i], cap=c[i] * shares, mkt=SH[code][1], r0=r0, r1=r1, r1b=r1b,
                      wp=wp[p], dd=1 - ll / hh, rng=h1 / l1 - 1, zone=(c[i] - L) / (H - L),
                      set20=set20, below_last=below_last, ph=ph_state, chg=c[i] / c[i - 1] - 1))
df = pd.DataFrame(R)
df.to_pickle(os.path.join(H0, 'dev3.pkl'))
print(len(df))
