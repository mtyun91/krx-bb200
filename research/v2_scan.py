# 2026-11-04 전략 v2 검증용 기록 — 승률을 올리고 주 2~3종목을 만들 수 있는 조합 찾기
#  A) 200일 상단 돌파 (종가 매수) — 신호마다 특징을 기록
#  B) 돌파 직전 매집 선취매 — 상단 아래 5% 안 + 수축 + 매집일 때 미리 삼
#  매도 방식 여러 개를 같은 신호에 적용: 10일선 / 20일선 / 절반 익절(+10·+15%) 뒤 본전 손절 + 10일선
#  시장 체력 = 그날 200일선 위에 있는 종목 비율 (자료 안의 종목으로 계산)
import os, glob, warnings, json
import numpy as np, pandas as pd
warnings.filterwarnings('ignore')
H0 = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H0, 'data')
COST = 0.0032
LST = os.path.join(H0, 'listing.json')
if not os.path.exists(LST):
    import FinanceDataReader as fdr
    L = fdr.StockListing('KRX')
    json.dump({r.Code: [int(r.Stocks), r.Market] for r in L.itertuples() if r.Stocks and r.Stocks == r.Stocks}, open(LST, 'w'))
SH = json.load(open(LST))


def run_exit(o, h, l, c, ma, start, px, stop, n, tp=None, be=True):
    """start 봉부터 종가 판단. tp 가 있으면 장중 고가가 +tp 닿을 때 절반 익절, 그 뒤 손절선을 본전으로."""
    half = 0.0; got = False
    for j in range(start, min(n, start + 500)):
        if tp is not None and not got and h[j] >= px * (1 + tp):
            fill = max(px * (1 + tp), o[j])
            half = fill / px * (1 - COST) - 1
            got = True
            if be:
                stop = max(stop, px)
        if c[j] < stop or c[j] < ma[j]:
            r = c[j] / px * (1 - COST) - 1
            return (0.5 * half + 0.5 * r if got else r), j - start + 1
    return None, None


R, P = [], []
breadth = {}
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
    dates = d.Date.str[:10].values
    yr = d.Date.str[:4].astype(int).values
    n = len(c)
    s = pd.Series(c)
    mid = s.rolling(200).mean().values; sd = s.rolling(200).std(ddof=0).values
    up = mid + 2 * sd; w = 4 * sd / mid
    m10 = s.rolling(10).mean().values; m20 = s.rolling(20).mean().values; m60 = s.rolling(60).mean().values
    amt = pd.Series(c * v).rolling(20).mean().values
    vma = pd.Series(v).rolling(20).mean().shift(1).values
    rngHL = np.where(h > l, h - l, np.nan)
    mfm = np.nan_to_num(((c - l) - (h - c)) / rngHL)
    cmf = pd.Series(mfm * v).rolling(20).sum().values / pd.Series(v).rolling(20).sum().values
    obv = np.cumsum(np.r_[0, np.sign(np.diff(c))] * v)
    obvmax = pd.Series(obv).rolling(120).max().values
    for i in range(200, n):
        if not np.isnan(mid[i]):
            b = breadth.setdefault(dates[i], [0, 0]); b[0] += c[i] > mid[i]; b[1] += 1

    def feats(i):
        p = i - 1
        hh = h[p - 499:p + 1].max(); ll = l[p - 249:p + 1].min()
        h1 = h[p - 119:p + 1].max(); l1 = l[p - 119:p + 1].min()
        H = h[p - 749:p + 1].max(); L = l[p - 749:p + 1].min()
        wp = (w[p - 749:p] < w[p]).mean()
        below_last = next((k for k in range(1, 121) if c[i - k] < mid[i - k]), 121)
        ks = [k for k in range(i - 120, i - 2) if h[k] >= up[k] and c[k] < o[k]]
        ph = 'none'
        if ks:
            ph = 'broke' if c[i] > h[ks[0]:i].max() else 'below'
        return dict(code=code, date=dates[i], yr=yr[i], cap=c[i] * shares / 1e8, mkt=SH[code][1],
                    wp=wp, dd=1 - ll / hh, rng=h1 / l1 - 1, zone=(c[i] - L) / (H - L), below_last=below_last, ph=ph,
                    chg=c[i] / c[i - 1] - 1, volr=v[i] / vma[i] if vma[i] else np.nan, cmf=cmf[i],
                    obvhi=bool(obv[i] >= obvmax[i] * 0.999 if obvmax[i] > 0 else obv[i] >= obvmax[i]),
                    flat120=abs(c[i - 1] / c[i - 121] - 1), ma60up=bool(m60[i] > m60[i - 20]),
                    ext=c[i] / up[i] - 1, amt=amt[i] / 1e8,
                    # 2026-11-04 추가 후보: 봉 안 종가 위치 · 윗꼬리 · 갭 · 60일 수익률 · 1년 고점 대비 · 밴드 폭(%) · 20일 변동성
                    cpos=(c[i] - l[i]) / (h[i] - l[i]) if h[i] > l[i] else 1.0, gap=o[i] / c[i - 1] - 1,
                    r60=c[i] / c[i - 60] - 1, hi250=c[i] / h[i - 250:i].max() - 1, bw=w[p],
                    vol20=float(np.std(np.diff(np.log(c[i - 20:i + 1])))), obvhi250=bool(obv[i] >= obv[i - 249:i + 1].max()),
                    m20up=bool(m20[i] > m20[i - 5]), above60=bool(c[i] > m60[i]))

    # A) 상단 돌파
    for i in range(760, n - 1):
        if not (c[i] > up[i] and c[i - 1] <= up[i - 1] and c[i] > o[i] and amt[i] > 30e8):
            continue
        stop = l[i]
        r10, h10 = run_exit(o, h, l, c, m10, i + 1, c[i], stop, n)
        if r10 is None:
            continue
        r20, h20 = run_exit(o, h, l, c, m20, i + 1, c[i], stop, n)
        p10, _ = run_exit(o, h, l, c, m10, i + 1, c[i], stop, n, tp=0.10)
        p15, _ = run_exit(o, h, l, c, m10, i + 1, c[i], stop, n, tp=0.15)
        p10b, hp = run_exit(o, h, l, c, m20, i + 1, c[i], stop, n, tp=0.10)
        p8b, _ = run_exit(o, h, l, c, m20, i + 1, c[i], stop, n, tp=0.08)
        p12b, _ = run_exit(o, h, l, c, m20, i + 1, c[i], stop, n, tp=0.12)
        p15b, _ = run_exit(o, h, l, c, m20, i + 1, c[i], stop, n, tp=0.15)
        p10n, _ = run_exit(o, h, l, c, m20, i + 1, c[i], stop, n, tp=0.10, be=False)
        # 시간 손절: 10일 안에 +5%를 한 번도 못 넘으면 10일째 종가에 정리 (그 전에는 절반 익절·20일선 그대로)
        j10 = min(n - 1, i + 10)
        if hp is not None and hp > 10 and h[i + 1:j10 + 1].max() < c[i] * 1.05:
            pt = c[j10] / c[i] * (1 - COST) - 1
        else:
            pt = p10b
        # 최대 상승·하락 (20일)
        j2 = min(n, i + 21)
        R.append({**feats(i), 'r10': r10, 'hold': h10, 'r20': r20, 'h20': h20, 'hp': hp, 'p10': p10, 'p15': p15, 'p10b': p10b, 'p8b': p8b, 'p12b': p12b, 'p15b': p15b, 'p10n': p10n, 'pt': pt,
                  'mfe20': h[i + 1:j2].max() / c[i] - 1, 'mae20': l[i + 1:j2].min() / c[i] - 1, 'stoppct': stop / c[i] - 1})

    # B) 돌파 직전 선취매 — 종가가 상단 아래 0~5% (20일 안 처음), 양봉, 매집(OBV 120일 신고가·CMF≥0.1), 수축(폭 하위 25%·120일 횡보 ±15%)
    last = -99
    for i in range(760, n - 1):
        if not (up[i] * 0.95 <= c[i] < up[i] and c[i] > o[i] and amt[i] > 30e8 and c[i] > mid[i]):
            continue
        if i - last < 20:
            continue
        if not (obv[i] >= obvmax[i] and cmf[i] >= 0.1):
            continue
        fx = feats(i)
        if fx['wp'] > 0.25 or fx['flat120'] > 0.15:
            continue
        last = i
        box = l[i - 20:i].min()
        rb, hb = run_exit(o, h, l, c, m20, i + 1, c[i], box, n)
        if rb is None:
            continue
        pb, _ = run_exit(o, h, l, c, m20, i + 1, c[i], box, n, tp=0.10)
        broke = bool((c[i + 1:min(n, i + 21)] > up[i + 1:min(n, i + 21)]).any())
        P.append({**fx, 'rb': rb, 'hold': hb, 'pb': pb, 'broke20': broke, 'stoppct': box / c[i] - 1})

br = pd.Series({k: v[0] / v[1] for k, v in breadth.items() if v[1] >= 200}).sort_index()
df = pd.DataFrame(R); df['breadth'] = df.date.map(br)
pf = pd.DataFrame(P)
if len(pf):
    pf['breadth'] = pf.date.map(br)
df.to_pickle(os.path.join(H0, 'v2_break.pkl')); pf.to_pickle(os.path.join(H0, 'v2_pre.pkl')); br.to_pickle(os.path.join(H0, 'v2_breadth.pkl'))
print(len(df), len(pf))
