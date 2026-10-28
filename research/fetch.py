# 코스피·코스닥 보통주 일봉(2014~) 받아서 종목별 csv로 저장
import os, json, sys, socket
socket.setdefaulttimeout(20)
from concurrent.futures import ThreadPoolExecutor
import FinanceDataReader as fdr

OUT = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(OUT, exist_ok=True)
items = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'krx_master.json'), encoding='utf-8'))['items']
codes = [c for c, n, m in items if m in ('코스피', '코스닥') and c.isdigit() and c.endswith('0')
         and not any(k in n for k in ('스팩', '리츠', 'ETN', '우B'))]
print(len(codes), flush=True)

def get(c):
    p = os.path.join(OUT, c + '.csv')
    if os.path.exists(p):
        return 1
    try:
        d = fdr.DataReader(c, '2013-01-01')
        if len(d) > 300:
            d[['Open', 'High', 'Low', 'Close', 'Volume']].to_csv(p)
        return 1
    except Exception:
        return 0

with ThreadPoolExecutor(1) as ex:
    ok = 0
    for k, r in enumerate(ex.map(get, codes)):
        ok += r
        if k % 200 == 0:
            print(k, ok, flush=True)
print('done', len(os.listdir(OUT)), flush=True)
