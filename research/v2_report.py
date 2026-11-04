# v2_scan.py 결과 표 — 조건 조합별 거래 수·주당 신호·승률·평균·PF (2020까지 / 2021부터)
import os, sys
import numpy as np, pandas as pd
H0 = os.path.dirname(os.path.abspath(__file__))
df = pd.read_pickle(os.path.join(H0, 'v2_break.pkl'))
pf = pd.read_pickle(os.path.join(H0, 'v2_pre.pkl'))
YEARS = df.yr.max() - df.yr.min() + 1


def pfac(r):
    g, l = r[r > 0].sum(), -r[r < 0].sum()
    return g / l if l > 0 else np.nan


def line(name, x, col='r10'):
    r = x[col].dropna()
    if len(r) < 20:
        return f'{name:<44} {len(r):>5}  (적음)'
    wk = pd.to_datetime(x.date).dt.to_period('W')
    per_wk = len(r) / (YEARS * 52)
    a, b = x[x.yr <= 2020][col].dropna(), x[x.yr >= 2021][col].dropna()
    return (f'{name:<44} {len(r):>5} 주{per_wk:4.1f} 승률{(r > 0).mean() * 100:5.1f}% 평균{r.mean() * 100:+6.2f}% '
            f'PF{pfac(r):5.2f} ({pfac(a):4.2f}/{pfac(b):4.2f})')


sq = (df.wp <= .15) & (df.dd >= .30) & (df.rng <= .60)
settle = df.below_last > 5
smallok = ~((df.cap < 5000) & (df.ph == 'none'))
phpath = (df.ph == 'broke') & (df.cap >= 5000)
acc = (df.wp <= .25) & (df.flat120 <= .15) & df.obvhi & (df.cmf >= .1)
cur = settle & smallok & ((sq & (df.zone <= .5)) | phpath)

print('== A. 200일 상단 돌파 (종가 매수 · 돌파봉 저가 손절 · 10일선 매도) ==')
print(line('모든 돌파', df))
print(line('지금 앱 규칙 (스퀴즈 아래절반 | 전고점5천억)', df[cur]))
print(line('  스퀴즈 아래 1/3 로', df[settle & smallok & ((sq & (df.zone <= .33)) | phpath)]))
print(line('  + 매집 경로', df[settle & smallok & ((sq & (df.zone <= .5)) | phpath | acc)]))
base = settle & smallok & ((sq & (df.zone <= .5)) | phpath | acc)
B = df[base]
print('\n-- 기본(지금 + 매집 경로)에 조건 하나씩 더하기 --')
filt = {
    '시장 체력 ≥ 50%': B.breadth >= .5,
    '시장 체력 ≥ 40%': B.breadth >= .4,
    '거래량 ≥ 20일 평균 1.5배': B.volr >= 1.5,
    '거래량 ≥ 2배': B.volr >= 2,
    'CMF > 0': B.cmf > 0,
    'OBV 120일 신고가': B.obvhi,
    '60일선 위로 향함': B.ma60up,
    '상단 위 3% 이내 (안 뻗친 돌파)': B.ext <= .03,
    '상단 위 5% 이내': B.ext <= .05,
    '손절폭 7% 이내': B.stoppct >= -.07,
    '당일 상승 10% 이하': B.chg <= .10,
    '시총 2천억 이상': B.cap >= 2000,
    '시총 1조 이상': B.cap >= 10000,
    '거래대금 50억 이상': B.amt >= 50,
}
for k, m in filt.items():
    print(line('+ ' + k, B[m]))

print('\n-- 매도 방식 (기본 신호) --')
for col, nm in [('r10', '10일선'), ('r20', '20일선'), ('p10', '+10% 절반 익절·본전 손절·10일선'), ('p15', '+15% 절반 익절·본전 손절·10일선'), ('p10b', '+10% 절반 익절·본전 손절·20일선')]:
    print(line(nm, B, col))

if len(sys.argv) > 1:
    exec(open(sys.argv[1], encoding='utf-8').read())

print('\n== B. 돌파 직전 매집 선취매 (상단 아래 5% · 수축 · OBV 신고가 · CMF≥0.1 · 20일 저점 손절 · 20일선 매도) ==')
print(line('전체', pf, 'rb'))
print(line('  절반 +10% 익절', pf, 'pb'))
print(line('  시장 체력 ≥ 50%', pf[pf.breadth >= .5], 'rb'))
print(line('  시총 5천억 이상', pf[pf.cap >= 5000], 'rb'))
print(f'  20일 안에 실제로 상단 돌파한 비율 {pf.broke20.mean() * 100:.0f}%')
