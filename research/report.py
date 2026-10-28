import os
import numpy as np, pandas as pd, warnings
warnings.filterwarnings("ignore")
B = os.path.dirname(__file__)
S = pd.read_pickle(os.path.join(B, 'sigs.pkl'))
T = pd.read_pickle(os.path.join(B, 'trades.pkl'))
pd.set_option('display.width', 200)

def fwd(g):
    return pd.Series({'n': len(g), 'r20평균%': g.r20.mean() * 100, 'r20중앙%': g.r20.median() * 100, 'r60평균%': g.r60.mean() * 100,
                      'r120평균%': g.r120.mean() * 100, '120일최고중앙%': g.mx120.median() * 100, '20일뒤오름%': (g.r20 > 0).mean() * 100})

print('== 1. 장대양봉 돌파 vs 일반 돌파 ==')
print(S.groupby('lc').apply(fwd).round(1).to_string())
L = S[S.lc]
print(f'장대양봉 돌파 {len(L)}건: 15일 안에 몸통 절반 반납 {L.pull.mean()*100:.0f}% → 그 뒤 고가 재돌파(N자) {L[L.pull].nre.mean()*100:.0f}%')
N = S[~S.lc]
print(f'일반 돌파 {len(N)}건: 같은 기준 반납 {N.pull.mean()*100:.0f}%')

print('\n== 2. 밴드 상태별 (200일 밴드 폭 백분위 = 최근 3년 중 위치) ==')
S['폭구간'] = pd.cut(S.wpct, [-0.01, 0.05, 0.15, 0.3, 0.5, 0.7, 1.0], labels=['최저5%', '5~15%', '15~30%', '30~50%', '50~70%', '70%~'])
print(S.groupby('폭구간').apply(fwd).round(1).to_string())
print('\n유형: SQ=스퀴즈(폭 하위15%+하락 흔적+120일 횡보) / EX=벌어진 상태 / MID=중간')
print(S.groupby('typ').apply(fwd).round(1).to_string())
print('\n스퀴즈 조건 나눠 보기')
S['sqpart'] = np.where(S.sq, '전부 충족', np.where(S.sq_core, '폭만 좁음', '아님'))
print(S.groupby('sqpart').apply(fwd).round(1).to_string())
print('\n유형 × 장대양봉')
print(S.groupby(['typ', 'lc']).apply(fwd).round(1).to_string())

def st(g):
    r = g.ret
    return pd.Series({'거래': len(g), '승률%': (r > 0).mean() * 100, '평균%': r.mean() * 100, '중앙%': r.median() * 100,
                      'PF': r[r > 0].sum() / -r[r < 0].sum(), '평균보유일': g.hold.mean(), '합계%': r.sum() * 100})

NAMES = {'S0': '지금 전략(돌파 즉시·10일선)', 'S1': '장대양봉 돌파는 건너뜀', 'S2A': '장대양봉→눌림 끝 반등 매수', 'S2B': '장대양봉→고가 재돌파 매수',
         'S3': '유형별 매도(스퀴즈 20·확장 5·중간 10일선)', 'S4': 'S2A + 유형별 매도(스퀴즈는 기다림 예외)'}
print('\n== 3. 전략 비교 (종목당 한 번에 하나, 비용 포함) ==')
rows = []
for k, v in T.items():
    g = pd.DataFrame(v)
    g['기간'] = np.where(pd.to_datetime(g.date).dt.year <= 2020, '앞(~2020)', '뒤(2021~)')
    a = st(g); a.name = NAMES[k]; rows.append(a)
    for p, gg in g.groupby('기간'):
        b = st(gg); b.name = f'   {p}'; rows.append(b)
print(pd.DataFrame(rows).round(2).to_string())
g = pd.DataFrame(T['S3'])
print('\nS3 유형별')
print(g.groupby('typ').apply(st).round(2).to_string())
g = pd.DataFrame(T['S0'])
print('\nS0 유형별')
print(g.groupby('typ').apply(st).round(2).to_string())
