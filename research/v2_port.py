# 포트폴리오로 굴려 보기 — 자리(최대 보유)·자금 한도 안에서 실제로 몇 종목을 사고 계좌가 어떻게 되나
#  신호 날 종가 매수, 기록된 보유일 뒤 그 수익률로 정리. 종목당 = 평가자산 ÷ 최대 보유 (복리). 같은 날 신호가 많으면 거래대금 큰 순
import os
import numpy as np, pandas as pd
H0 = os.path.dirname(os.path.abspath(__file__))
df = pd.read_pickle(os.path.join(H0, 'v2_break.pkl'))
br = pd.read_pickle(os.path.join(H0, 'v2_breadth.pkl'))
cal = list(br.index); pos_of = {d: k for k, d in enumerate(cal)}
sq = (df.wp <= .15) & (df.dd >= .30) & (df.rng <= .60)
settle = df.below_last > 5
smallok = ~((df.cap < 5000) & (df.ph == 'none'))
phpath = (df.ph == 'broke') & (df.cap >= 5000)
acc = (df.wp <= .25) & (df.flat120 <= .15) & df.obvhi & (df.cmf >= .1)
cur = settle & smallok & ((sq & (df.zone <= .5)) | phpath)
base = settle & smallok & ((sq & (df.zone <= .5)) | phpath | acc)


def sim(sig, rcol, hcol, maxpos):
    sig = sig.dropna(subset=[rcol, hcol]).copy()
    sig = sig[sig.date.isin(pos_of)]
    sig['k'] = sig.date.map(pos_of)
    by = {k: g.sort_values('amt', ascending=False) for k, g in sig.groupby('k')}
    eq, cash, held, trades, peak, mdd = 1.0, 1.0, [], 0, 1.0, 0
    k0 = min(by) if by else 0
    curve = []
    for k in range(k0, len(cal)):
        still = []
        for (ek, amt, r, code) in held:
            if ek <= k:
                cash += amt * (1 + r)
            else:
                still.append((ek, amt, r, code))
        held = still
        eq = cash + sum(a for _, a, _, _ in held)   # 보유분은 원가로 (단순화)
        if k in by:
            codes = {c for *_, c in held}
            for row in by[k].itertuples():
                if len(held) >= maxpos or row.code in codes:
                    continue
                amt = min(eq / maxpos, cash)
                if amt <= eq / maxpos * 0.5:
                    break
                cash -= amt
                held.append((k + int(getattr(row, hcol)), amt, getattr(row, rcol), row.code))
                trades += 1
        peak = max(peak, eq); mdd = max(mdd, 1 - eq / peak)
        curve.append(eq)
    yrs = (len(cal) - k0) / 245
    cagr = eq ** (1 / yrs) - 1
    return trades, trades / yrs / 52, cagr, mdd


print('조건 · 매도 · 최대보유 → 거래 · 주당 · 연수익(복리) · 최대낙폭')
for nm, m in [('지금 규칙', cur), ('기본+체력40+시총2천억', base & (df.breadth >= .4) & (df.cap >= 2000)),
              ('기본+체력40+시총2천억+OBV', base & (df.breadth >= .4) & (df.cap >= 2000) & df.obvhi)]:
    for rc, hc, en in [('r10', 'hold', '10일선'), ('r20', 'h20', '20일선'), ('p10b', 'hp', '절반+10%·20일선')]:
        for mp in (5, 8, 10):
            t, w, cg, dd = sim(df[m], rc, hc, mp)
            print(f'{nm:<22} {en:<12} {mp:>2}종목 → {t:5d}건 주{w:4.1f} 연{cg * 100:+6.1f}% 낙폭-{dd * 100:4.1f}%')
