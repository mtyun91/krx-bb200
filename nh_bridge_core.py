"""
나무증권(NH투자증권) PLUG OpenAPI 로컬 중계기 — 파르티잔 인베스트먼트 화면(partisan_investment.html)이 시세를 받을 때 사용.

- 앱키·시크릿은 이 PC의 환경변수에만 두고, 브라우저에는 전달하지 않는다.
- 127.0.0.1 에서만 열리며, 실행 시 출력되는 토큰이 있어야 요청을 처리한다.
- 시세 조회(기간별 분·일·주·월봉 · ETF 구성종목)와 실시간 체결·호가(웹소켓)를 중계한다.
- 실계좌 주문은 실행기를 --trade 로 켰을 때만 — 계좌번호·서버·한도는 실행기에서만 정하고, 켤 때마다 '정지' 상태로 시작 (화면의 모의투자는 가상 계좌).
- 접근토큰은 24시간 유효 → 메모리에 보관하고 만료 1시간 전에만 다시 발급.

보통은 실행기(nh_bridge.py)가 이 파일을 띄운다 — 키는 실행기에서 한 번만 입력하고,
이 파일을 고치면 실행기가 알아채서 중계기만 다시 띄운다 (키 재입력 불필요).
    python nh_bridge.py --ask      (실제 시세)
    python nh_bridge.py --demo     (가짜 시세)
"""
import hashlib
import hmac
import json
import math
import os
import random
import secrets
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = int(os.environ.get("BRIDGE_PORT", "8766"))
NH_REST = os.environ.get("NH_BASE_URL", "https://api.nhplug.com:8443")
APPKEY = os.environ.get("NH_APPKEY", "")
APPSECRET = os.environ.get("NH_APPSECRET", "")
TOKEN_FILE = os.path.join(os.path.expanduser("~"), ".nh_bridge_token")


def _load_token():
    # 환경변수 > 사용자 폴더의 토큰 파일 > 새로 만들어 파일에 저장 → 다시 실행해도 같은 토큰이라 화면에 재입력 불필요
    if os.environ.get("BRIDGE_TOKEN"):
        return os.environ["BRIDGE_TOKEN"]
    try:
        with open(TOKEN_FILE, encoding="utf-8") as f:
            saved = f.read().strip()
        if len(saved) >= 16:
            return saved
    except OSError:
        pass
    token = secrets.token_urlsafe(18)
    try:
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(token)
        os.chmod(TOKEN_FILE, 0o600)
    except OSError:
        pass
    return token


TOKEN = _load_token()
DEMO = "--demo" in sys.argv
KST = timezone(timedelta(hours=9))

# 시세 TR 은 초당 5건 제한 → 호출 사이 최소 간격
MIN_GAP = 0.22
_last_call = 0.0
_call_lock = threading.Lock()
_token = {"value": "", "expires": 0.0}
_token_lock = threading.Lock()


def origin_allowed(origin):
    # file:// 로 연 HTML은 Origin이 "null"; 그 외에는 localhost 계열만 허용
    if origin is None or origin == "null":
        return True
    return origin.startswith(("http://localhost", "http://127.0.0.1", "https://localhost"))


def _throttle():
    global _last_call
    with _call_lock:
        wait = _last_call + MIN_GAP - time.time()
        if wait > 0:
            time.sleep(wait)
        _last_call = time.time()


def access_token():
    with _token_lock:
        if _token["value"] and time.time() < _token["expires"] - 3600:
            return _token["value"]
        body = urllib.parse.urlencode({
            "appkey": APPKEY, "appsecretkey": APPSECRET,
            "grant_type": "client_credentials", "scope": "oob",
        }).encode()
        req = urllib.request.Request(NH_REST + "/oauth2/token", data=body, method="POST",
                                     headers={"content-type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read())
        except urllib.error.HTTPError as err:
            # 증권사 응답 본문(오류 코드·메시지)을 그대로 보여줌 — 키 값은 포함되지 않음
            raise RuntimeError(f"접근토큰 발급 실패 HTTP {err.code}: {err.read()[:300].decode('utf-8', 'replace')}")
        if "access_token" not in data:
            raise RuntimeError(f"접근토큰 발급 실패: {json.dumps(data, ensure_ascii=False)[:300]}")
        _token["value"] = data["access_token"]
        _token["expires"] = time.time() + float(data.get("expires_in", 86400))
        print(f"[{time.strftime('%H:%M:%S')}] 접근토큰 발급 (유효 {int(float(data.get('expires_in', 86400)) / 3600)}시간)")
        return _token["value"]


def token_invalidate(used):
    """증권사가 토큰을 거부하면 버리고 다음 요청에서 새로 발급 — 1분에 한 번까지만
    (같은 앱키로 다른 컴퓨터에서 중계기를 켜면 서로 토큰을 무효화하므로 무한 재발급을 막음)"""
    with _token_lock:
        if _token["value"] != used:
            return True   # 이미 다른 요청이 새로 받음
        if time.time() - _token.get("reissued", 0) < 60:
            return False
        _token["value"], _token["reissued"] = None, time.time()
        print(f"[{time.strftime('%H:%M:%S')}] 접근토큰이 무효가 되어 새로 발급합니다 "
              "(같은 앱키로 다른 컴퓨터에서 중계기를 켜면 이렇게 됩니다 — 중계기는 한 컴퓨터에서만 실행하세요)")
        return True


def nh_post(path, payload, cts="", retry=True):
    _throttle()
    tok = access_token()
    headers = {
        "content-type": "application/json;charset=utf-8",
        "Authorization": "Bearer " + tok,
        "cts_flag": "Y" if cts else "N",
    }
    if cts:
        headers["cts"] = cts
    req = urllib.request.Request(NH_REST + path, data=json.dumps(payload).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read())
            next_cts = res.headers.get("cts", "") if res.headers.get("cts_flag", "N") == "Y" else ""
    except urllib.error.HTTPError as err:
        body = err.read()[:300].decode('utf-8', 'replace')
        if retry and "IGW4004" in body and token_invalidate(tok):   # 유효하지 않은·만료된 토큰
            return nh_post(path, payload, cts, retry=False)
        raise RuntimeError(f"HTTP {err.code}: {body}")
    if data.get("rsp_cd") not in (None, "00000"):
        raise RuntimeError(f"{data.get('rsp_cd')} {data.get('rsp_msg')}")
    return data, next_cts


def _num(v):
    try:
        return float(str(v).replace(",", "") or 0)
    except ValueError:
        return 0.0


TF_MINUTES = ("1", "3", "5", "10", "15", "30", "60")
TF_ALL = TF_MINUTES + ("D", "W", "M")


def _period_rows(inp, count):
    """기간별 시세 연속조회 — Output_0(현재가 정보)와 Output_1 행들을 count 개까지"""
    rows, cts, quote = [], "", None
    while len(rows) < count:
        data, cts = nh_post("/krstock/quote/v1/period", {"Input_0": {**inp, "array_cnt": str(min(500, count - len(rows)))}}, cts)
        if quote is None:
            quote = data.get("Output_0") or {}
        page = data.get("Output_1") or []
        rows.extend(page)
        if not cts or not page:
            break
    return rows, quote or {}


def _bars(rows, minute=False):
    # 분봉은 날짜+시각(YYYYMMDDHHMM), 일·주·월봉은 날짜(YYYYMMDD) 를 키로 오래된 것부터 정렬
    bars = {}
    for r in rows:
        o, h, l, c = (_num(r.get(k)) for k in ("stck_oprc", "stck_hgpr", "stck_lwpr", "stck_prpr"))
        if o <= 0 or h <= 0 or l <= 0 or c <= 0:
            continue  # 장 시작 전 당일 행 (시가 0) 등은 제외
        t = r.get("bsop_date", "") + (str(r.get("bsop_time", "")).zfill(6)[:4] if minute else "")
        bars[t] = {"t": t, "o": o, "h": h, "l": l, "c": c, "v": _num(r.get("vol"))}
    return [bars[k] for k in sorted(bars)]


def nh_chart(code, tf, count):
    """분봉(gubun 5 · xtick 분) · 주봉(2) · 월봉(3) — 차트 표시용, 수정주가"""
    minute = tf in TF_MINUTES
    inp = {"market_cd": "KRX", "iem_cd": code, "gubun": "5" if minute else {"W": "2", "M": "3"}[tf], "view_main_yn": "Y"}
    if minute:
        inp.update({"xtick": tf, "today_cls_code": "0", "fake_tick": "1"})
    rows, _ = _period_rows(inp, count)
    return {"code": code, "tf": tf, "bars": _bars(rows, minute)}


def nh_daily(code, count):
    """기간별 시세(일봉, 수정주가) — 연속조회로 count 개까지, 오래된 것부터 정렬해 반환"""
    rows, q = _period_rows({"market_cd": "KRX", "iem_cd": code, "gubun": "1", "view_main_yn": "Y"}, count)
    bars = _bars(rows)
    return {
        "code": code,
        "name": q.get("iem_nm", "").lstrip("*#"),
        "sector": q.get("bstp_kor_isnm", ""),
        "quote": {
            "date": q.get("bsop_date", ""), "time": q.get("qry_time", ""),
            "price": _num(q.get("stck_prpr")), "open": _num(q.get("stck_oprc")),
            "high": _num(q.get("stck_hgpr")), "low": _num(q.get("stck_lwpr")),
            "vol": _num(q.get("acml_vol")), "upper": _num(q.get("stck_mxpr")), "lower": _num(q.get("stck_llam")),
        },
        "bars": bars,
    }


def nh_components(etf):
    data, _ = nh_post("/krstock/quote/v1/etfComponents", {"Input_0": {"iem_cd": etf}})
    return [{"code": r["iem_cd"], "name": r.get("iem_nm", "")} for r in data.get("Output_0") or [] if r.get("iem_cd")]


# ---------------------------------------------------------------------------
# 데모 모드: 종목코드로 고정 시드를 만든 가짜 일봉 (실제 시세 아님 — 화면 확인용)
# ---------------------------------------------------------------------------
DEMO_SETS = {
    "069500": [("005930", "삼성전자"), ("000660", "SK하이닉스"), ("373220", "LG에너지솔루션"), ("207940", "삼성바이오로직스"),
               ("005380", "현대차"), ("000270", "기아"), ("068270", "셀트리온"), ("035420", "NAVER"), ("105560", "KB금융"),
               ("055550", "신한지주"), ("012330", "현대모비스"), ("035720", "카카오"), ("051910", "LG화학"), ("006400", "삼성SDI"),
               ("028260", "삼성물산"), ("066570", "LG전자"), ("003550", "LG"), ("032830", "삼성생명"), ("015760", "한국전력"),
               ("017670", "SK텔레콤")],
    "229200": [("247540", "에코프로비엠"), ("086520", "에코프로"), ("196170", "알테오젠"), ("028300", "HLB"), ("058470", "리노공업"),
               ("039030", "이오테크닉스"), ("240810", "원익IPS"), ("036930", "주성엔지니어링"), ("263750", "펄어비스"), ("293490", "카카오게임즈")],
}
DEMO_NAMES = {c: n for lst in DEMO_SETS.values() for c, n in lst}


# ---------------------------------------------------------------------------
# 전체 종목 목록 (검색용) — 한국거래소 공개 종목 찾기 목록 (키 불필요, 공개 데이터)
# 주식(코스피·코스닥·코넥스) + ETF·ETN (ELW 제외). 하루 한 번만 새로 받고 krx_master.json 에 보관.
# ---------------------------------------------------------------------------
MASTER_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "krx_master.json")
MASTER_LOCK = threading.Lock()
KRX_FINDER = "https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd"
MARKET_KO = {"KOSPI": "코스피", "KOSDAQ": "코스닥", "KOSDAQ GLOBAL": "코스닥", "KONEX": "코넥스"}


def _krx_finder(bld):
    body = urllib.parse.urlencode({"bld": bld, "locale": "ko_KR", "mktsel": "ALL", "typeNo": "0", "searchText": ""}).encode()
    req = urllib.request.Request(KRX_FINDER, data=body, method="POST", headers={
        "User-Agent": "Mozilla/5.0", "Referer": "https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"})
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.loads(res.read()).get("block1") or []


def krx_master(force=False):
    """[[코드, 이름, 시장], ...] — 저장분이 20시간 안이면 그대로, 아니면 새로 받음 (실패하면 저장분 사용)"""
    with MASTER_LOCK:
        saved = None
        try:
            with open(MASTER_FILE, encoding="utf-8") as f:
                saved = json.load(f)
        except (OSError, ValueError):
            pass
        if saved and not force and time.time() - saved.get("at", 0) < 20 * 3600:
            return saved
        try:
            items, seen = [], set()
            for r in _krx_finder("dbms/comm/finder/finder_stkisu"):
                c = r.get("short_code", "")
                if len(c) == 6 and c not in seen:
                    seen.add(c)
                    items.append([c, r.get("codeName", ""), MARKET_KO.get(r.get("marketEngName", ""), r.get("marketName", ""))])
            for r in _krx_finder("dbms/comm/finder/finder_secuprodisu"):
                c, nm = r.get("short_code", ""), r.get("codeName", "")
                if nm.endswith("콜") or nm.endswith("풋"):   # ELW(워런트)는 제외
                    continue
                if len(c) == 6 and c not in seen:
                    seen.add(c)
                    items.append([c, nm, "ETN" if "ETN" in nm else "ETF"])
            if len(items) < 1000:
                raise RuntimeError(f"종목 수가 너무 적음 ({len(items)})")
            out = {"at": time.time(), "items": items}
            tmp = MASTER_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False)
            os.replace(tmp, MASTER_FILE)
            print(f"[{time.strftime('%H:%M:%S')}] 전체 종목 목록 {len(items)}개 받음")
            return out
        except Exception as err:
            print(f"[{time.strftime('%H:%M:%S')}] 전체 종목 목록 받기 실패: {err}")
            if saved:
                return saved
            if DEMO:
                return {"at": 0, "items": [[c, n, "데모"] for c, n in DEMO_NAMES.items()]}
            raise


# ---------------------------------------------------------------------------
# 업종 정보 (섹터 분석용) — 한국거래소 KIND 상장법인 목록: 종목별 업종(표준산업분류)·주요제품. 하루 한 번
# ---------------------------------------------------------------------------
SECTOR_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "krx_sectors.json")
SECTOR_LOCK = threading.Lock()


def krx_sectors(force=False):
    """[[코드, 업종, 주요제품], ...]"""
    import html as _html
    import re as _re
    with SECTOR_LOCK:
        saved = None
        try:
            with open(SECTOR_FILE, encoding="utf-8") as f:
                saved = json.load(f)
        except (OSError, ValueError):
            pass
        if saved and not force and time.time() - saved.get("at", 0) < 20 * 3600:
            return saved
        try:
            req = urllib.request.Request("https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13",
                                         headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as res:
                raw = res.read().decode("euc-kr", "replace")
            items = []
            for row in _re.findall(r"<tr>(.*?)</tr>", raw, _re.S)[1:]:
                cs = [_html.unescape(_re.sub(r"<.*?>", "", c)).strip() for c in _re.findall(r"<td[^>]*>(.*?)</td>", row, _re.S)]
                if len(cs) > 4 and len(cs[2]) == 6:
                    items.append([cs[2], cs[3], cs[4][:60]])
            if len(items) < 1000:
                raise RuntimeError(f"종목 수가 너무 적음 ({len(items)})")
            out = {"at": time.time(), "items": items}
            tmp = SECTOR_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False)
            os.replace(tmp, SECTOR_FILE)
            print(f"[{time.strftime('%H:%M:%S')}] 업종 정보 {len(items)}종목 받음")
            return out
        except Exception as err:
            print(f"[{time.strftime('%H:%M:%S')}] 업종 정보 받기 실패: {err}")
            if saved:
                return saved
            raise


# ---------------------------------------------------------------------------
# 뉴스 — 구글 뉴스 RSS 검색 (키 불필요, 개인용 피드 읽기 용도). 같은 검색어는 10분간 저장분 사용
# ---------------------------------------------------------------------------
NEWS_CACHE = {}
NEWS_LOCK = threading.Lock()


# ---------------------------------------------------------------------------
# 주요 지수 — 코스피·코스닥·미국 지수·VIX·원/달러 (야후 파이낸스 공개 차트 · 키 없음 · 15~20분 늦을 수 있음)
# ---------------------------------------------------------------------------
MARKET_IDX = [("^KS11", "코스피"), ("^KQ11", "코스닥"), ("^GSPC", "S&P500"), ("^IXIC", "나스닥"), ("^DJI", "다우"), ("^SOX", "반도체"), ("^VIX", "VIX"), ("KRW=X", "원/달러")]
MARKET_NAMES = dict(MARKET_IDX)
MARKET_CACHE = {}
MARKET_LOCK = threading.Lock()


def _yahoo_chart(sym, rng, interval):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?range={rng}&interval={interval}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as res:
        return json.load(res)["chart"]["result"][0]


def market_index(sym, rng="10y"):
    if sym not in MARKET_NAMES:
        raise RuntimeError("모르는 지수입니다")
    rng = rng if rng in ("1y", "2y", "5y", "10y", "max") else "10y"
    key = ("idx", sym, rng)
    with MARKET_LOCK:
        hit = MARKET_CACHE.get(key)
        if hit and time.time() - hit[0] < 600:
            return hit[1]
    if DEMO:
        out = {"sym": sym, "name": MARKET_NAMES[sym], "bars": demo_daily(sym, 2500)["bars"], "demo": True}
    else:
        d = _yahoo_chart(sym, rng, "1d")
        off = d["meta"].get("gmtoffset", 0)
        q = d["indicators"]["quote"][0]
        cols = [q.get(k) or [] for k in ("open", "high", "low", "close", "volume")]
        bars = []
        for i, ts in enumerate(d.get("timestamp") or []):
            o, h, l, c, v = (a[i] if i < len(a) else None for a in cols)
            if None in (o, h, l, c):
                continue
            t = datetime.fromtimestamp(ts + off, timezone.utc).strftime("%Y%m%d")
            bar = {"t": t, "o": round(o, 2), "h": round(h, 2), "l": round(l, 2), "c": round(c, 2), "v": int(v or 0)}
            if bars and bars[-1]["t"] == t:
                bars[-1] = bar
            else:
                bars.append(bar)
        out = {"sym": sym, "name": MARKET_NAMES[sym], "bars": bars, "price": d["meta"].get("regularMarketPrice")}
    with MARKET_LOCK:
        MARKET_CACHE[key] = (time.time(), out)
    return out


def market_quotes():
    with MARKET_LOCK:
        hit = MARKET_CACHE.get("quotes")
        if hit and time.time() - hit[0] < 30:
            return hit[1]
    items = []
    for sym, name in MARKET_IDX:
        try:
            if DEMO:
                b = demo_daily(sym, 3)["bars"]
                price, prev, tm = b[-1]["c"], b[-2]["c"], ""
            else:
                m = _yahoo_chart(sym, "1d", "5m")["meta"]
                price, prev = m.get("regularMarketPrice"), m.get("chartPreviousClose") or m.get("previousClose")
                rt = m.get("regularMarketTime")
                tm = datetime.fromtimestamp(rt + m.get("gmtoffset", 0), timezone.utc).strftime("%m.%d %H:%M") if rt else ""
            items.append({"sym": sym, "name": name, "price": price, "prev": prev, "chg": (price / prev - 1) * 100 if price and prev else None, "time": tm})
        except Exception as e:
            items.append({"sym": sym, "name": name, "error": str(e)[:80]})
    out = {"items": items, "at": int(time.time() * 1000)}
    with MARKET_LOCK:
        MARKET_CACHE["quotes"] = (time.time(), out)
    return out


def news_search(q, n=20):
    import xml.etree.ElementTree as ET
    from email.utils import parsedate_to_datetime
    key = q.strip()
    with NEWS_LOCK:
        hit = NEWS_CACHE.get(key)
        if hit and time.time() - hit[0] < 600:
            return hit[1][:n]
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": key + " when:7d", "hl": "ko", "gl": "KR", "ceid": "KR:ko"})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as res:
        root = ET.fromstring(res.read())
    items = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        src = (it.findtext("source") or "").strip()
        if src and title.endswith(" - " + src):
            title = title[: -len(src) - 3]
        try:
            ts = int(parsedate_to_datetime(it.findtext("pubDate") or "").timestamp() * 1000)
        except (TypeError, ValueError):
            ts = 0
        items.append({"title": title, "source": src, "link": it.findtext("link") or "", "at": ts})
    items.sort(key=lambda x: -x["at"])
    with NEWS_LOCK:
        NEWS_CACHE[key] = (time.time(), items)
        if len(NEWS_CACHE) > 300:
            NEWS_CACHE.pop(next(iter(NEWS_CACHE)))
    return items[:n]


# 주요 뉴스 — 구글 뉴스 경제(BUSINESS) · 종합(TOP) 헤드라인 (3분 저장)
TOP_NEWS_URL = {"BUSINESS": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko", "TOP": "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"}


def news_top(kind="BUSINESS"):
    import xml.etree.ElementTree as ET
    from email.utils import parsedate_to_datetime
    kind = kind if kind in TOP_NEWS_URL else "BUSINESS"
    key = "top:" + kind
    with NEWS_LOCK:
        hit = NEWS_CACHE.get(key)
        if hit and time.time() - hit[0] < 180:
            return hit[1]
    req = urllib.request.Request(TOP_NEWS_URL[kind], headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as res:
        root = ET.fromstring(res.read())
    items = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        src = (it.findtext("source") or "").strip()
        if src and title.endswith(" - " + src):
            title = title[: -len(src) - 3]
        try:
            ts = int(parsedate_to_datetime(it.findtext("pubDate") or "").timestamp() * 1000)
        except (TypeError, ValueError):
            ts = 0
        items.append({"title": title, "source": src, "link": it.findtext("link") or "", "at": ts})
    items = items[:30]   # 구글 뉴스가 정한 순서(지금 많이 다루는 순) 그대로
    with NEWS_LOCK:
        NEWS_CACHE[key] = (time.time(), items)
    return items


# 폰 알림 — 텔레그램 봇. 토큰·채팅 번호는 화면이 요청마다 보내고 여기서는 저장·출력하지 않음
def _tg_token_ok(token):
    a, sep, b = str(token).partition(":")
    return bool(sep) and a.isdigit() and len(b) >= 30 and all(ch.isalnum() or ch in "_-" for ch in b)


def _tg_call(token, method, data=None, timeout=15):
    if not _tg_token_ok(token):
        raise RuntimeError("봇 토큰 형식이 아니에요 (숫자:영문 형태)")
    body = urllib.parse.urlencode(data).encode() if data else None
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/{method}", data=body)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            r = json.load(res)
    except urllib.error.HTTPError as e:
        try:
            r = json.load(e)
        except ValueError:
            raise RuntimeError(f"텔레그램 오류 {e.code}") from None
    if not r.get("ok"):
        raise RuntimeError(f"텔레그램: {r.get('description', '실패')}")
    return r.get("result")


def telegram_send(token, chat, text):
    chat = str(chat).strip()
    if not chat.lstrip("-").isdigit():
        raise RuntimeError("채팅 번호가 없어요 — 내 봇에게 아무 말이나 보낸 뒤 '찾기'를 누르세요")
    _tg_call(token, "sendMessage", {"chat_id": chat, "text": str(text)[:3500]})
    return {"ok": True}


def telegram_chat(token):
    if TG['gen_active']:
        raise RuntimeError("명령 받기가 켜져 있는 동안은 '찾기'를 쓸 수 없어요 — 명령 받기를 잠시 끄고 찾기")
    for u in reversed(_tg_call(token, "getUpdates") or []):
        m = u.get("message") or u.get("channel_post") or {}
        ch = m.get("chat")
        if ch:
            return {"chat": ch["id"], "name": ch.get("first_name") or ch.get("title") or ""}
    raise RuntimeError("봇에게 먼저 아무 말이나 보내 주세요 (그 뒤 '찾기')")


# 폰 명령 — 등록한 내 대화방에서 온 말만 화면 스트림으로 넘김 (토큰·채팅 번호는 이 메모리에만, 화면이 켤 때마다 다시 등록)
TG = {"token": "", "chat": "", "offset": 0, "gen": 0, "gen_active": False, "err": ""}
TG_LOCK = threading.Lock()


def _tg_poll(gen):
    while True:
        with TG_LOCK:
            if TG["gen"] != gen:
                return
            token, chat, offset = TG["token"], TG["chat"], TG["offset"]
        try:
            ups = _tg_call(token, "getUpdates", {"timeout": 25, "offset": offset, "allowed_updates": '["message"]'}, timeout=40) or []
            for u in ups:
                with TG_LOCK:
                    TG["offset"] = max(TG["offset"], u["update_id"] + 1)
                m = u.get("message") or {}
                if str((m.get("chat") or {}).get("id")) != str(chat):
                    continue   # 내 대화방이 아니면 무시
                text = (m.get("text") or "").strip()
                if not text:
                    continue
                with HUB.lock:
                    n = len(HUB.clients)
                if not n:
                    telegram_send(token, chat, "[파르티잔] PC에서 앱 화면이 꺼져 있어요 — 화면을 켜 두면 명령을 받을 수 있어요.")
                    continue
                HUB.publish({"type": "tg", "text": text[:600], "id": u["update_id"]})
            TG["err"] = ""
        except Exception as e:
            TG["err"] = str(e)[:120]
            time.sleep(5)


def tg_start(token, chat):
    chat = str(chat).strip()
    if not chat.lstrip("-").isdigit():
        raise RuntimeError("채팅 번호가 없어요")
    ups = _tg_call(token, "getUpdates", {"timeout": 0}) or []   # 켜기 전에 쌓인 말은 건너뜀
    with TG_LOCK:
        if TG["gen_active"] and TG["token"] == token and TG["chat"] == chat:
            return {"ok": True, "running": True}
        TG.update(token=token, chat=chat, offset=(ups[-1]["update_id"] + 1) if ups else 0, gen=TG["gen"] + 1, gen_active=True)
        gen = TG["gen"]
    threading.Thread(target=_tg_poll, args=(gen,), daemon=True).start()
    return {"ok": True}


def tg_stop():
    with TG_LOCK:
        TG.update(token="", chat="", gen=TG["gen"] + 1, gen_active=False)
    return {"ok": True}


# ---------------------------------------------------------------------------
# AI 시장 코멘트 (선택) — Claude API 로 화면이 모은 시장 데이터·뉴스 제목을 요약·해석
# 키는 실행기가 환경변수 ANTHROPIC_API_KEY 로만 넘김 (파일 저장 없음). 같은 데이터면 1시간 동안 저장분 사용
# ---------------------------------------------------------------------------
AI_MODEL = "claude-opus-5-5"
AI_CACHE = {"at": 0, "text": "", "model": ""}
AI_LOCK = threading.Lock()
AI_SYSTEM = (
    "너는 한국 주식시장 리서치센터의 시황 애널리스트다. 사용자가 보낸 JSON(시장 국면 근거, 섹터 수익률, 시나리오 신호, 뉴스 제목, 모의 계좌)만 근거로 "
    "지금 시장 상황을 한국어로 요약·해석한다.\n"
    "- 수치는 JSON에 있는 값만 쓰고, 없는 사실이나 숫자를 지어내지 않는다. 뉴스는 제목만 있으므로 제목에서 확인되는 범위로만 말한다.\n"
    "- 특정 종목을 사라·팔라고 권유하지 않는다. 대신 무엇을 확인해야 하는지 말한다.\n"
    "- 형식(마크다운 기호 없이, 각 줄은 줄바꿈으로 구분):\n"
    "  1줄: 지금 시장을 한 문장으로 요약한 헤드라인\n"
    "  [시장 흐름] 2~3문장 — 국면 판정과 그 근거가 서로 어떻게 맞물리는지\n"
    "  [주요 이슈] • 로 시작하는 3개 이하 — 뉴스와 시나리오 신호를 묶어서\n"
    "  [섹터] 1~2문장 — 강한 쪽·약한 쪽과 그 의미\n"
    "  [체크포인트] • 로 시작하는 2~3개 — 다음 거래일에 확인할 것\n"
    "  [내 계좌] 1문장 — 보유 종목이 있으면 매도 기준(5일선)과의 거리 등 현재 상태만"
)


def ai_available():
    """실행기에서 받은 Claude 키가 있는지 (화면 설정에서 키를 보내면 그 키를 우선 사용)"""
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))


def _ask_claude(system, prompt, key, model, max_tokens, history=None):
    try:
        import anthropic
    except ImportError:
        raise RuntimeError("anthropic 패키지가 없습니다 — pip install anthropic")
    client = anthropic.Anthropic(api_key=key) if key else anthropic.Anthropic()
    try:
        resp = client.beta.messages.create(
            model=model or AI_MODEL,
            max_tokens=max_tokens,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "medium"},
            system=system,
            messages=_claude_msgs(history, prompt),
        )
    except anthropic.AuthenticationError:
        raise RuntimeError("Claude API 키가 맞지 않습니다")
    except anthropic.PermissionDeniedError:
        raise RuntimeError("이 Claude API 키로는 이 모델을 쓸 수 없습니다")
    except anthropic.NotFoundError:
        raise RuntimeError(f"Claude 모델을 찾을 수 없습니다: {model}")
    except anthropic.RateLimitError:
        raise RuntimeError("Claude API 사용량 한도에 걸렸습니다 — 잠시 후 다시 시도하세요")
    except anthropic.APIStatusError as err:
        raise RuntimeError(f"Claude API 오류 {err.status_code}: {err.message}")
    except anthropic.APIConnectionError:
        raise RuntimeError("Claude API 에 연결하지 못했습니다 (네트워크 확인)")
    if resp.stop_reason == "refusal":
        raise RuntimeError("AI 가 이 요청에 답하지 않았습니다")
    text = "".join(b.text for b in resp.content if b.type == "text").strip()
    return text, resp.model, f"입력 {resp.usage.input_tokens} · 출력 {resp.usage.output_tokens} 토큰"


def _ask_gemini(system, prompt, key, model, max_tokens, history=None, parts=None, fast=False):
    """Gemini API (REST) — 키는 요청 헤더로만 보냄 (주소에 넣지 않음)"""
    if not key:
        raise RuntimeError("Gemini API 키가 필요합니다")
    model = model or "gemini-3.5-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{urllib.parse.quote(model)}:generateContent"
    body = {"systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "model" if h["role"] == "assistant" else "user", "parts": [{"text": h["text"]}]} for h in _clean_history(history)]
                        + [{"role": "user", "parts": parts or [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens}}
    if fast:   # 받아쓰기처럼 생각할 필요 없는 일 — 모델의 생각 단계를 최소로 (모델이 거부하면 빼고 다시)
        body["generationConfig"]["thinkingConfig"] = {"thinkingLevel": "minimal"}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    data = None
    for attempt in range(3):   # 일시 과부하(503)·한도(429)는 잠깐 기다렸다 다시
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                data = json.loads(res.read())
            break
        except urllib.error.HTTPError as err:
            try:
                msg = json.loads(err.read()).get("error", {}).get("message", "")
            except ValueError:
                msg = ""
            if err.code in (400, 401, 403) and "API key" in msg:
                raise RuntimeError("Gemini API 키가 맞지 않습니다")
            # 시스템 지시문을 받지 않는 모델(받아쓰기 전용 등) → 지시문을 사용자 입력 앞에 합쳐서 다시
            if err.code == 400 and ("developer instruction" in msg.lower() or "system instruction" in msg.lower()) and "systemInstruction" in body and attempt < 2:
                sys_text = body.pop("systemInstruction")["parts"][0]["text"]
                last = body["contents"][-1]["parts"]
                txt = [x for x in last if "text" in x]
                if txt:
                    txt[-1]["text"] = sys_text + chr(10) * 2 + txt[-1]["text"]
                else:
                    last.append({"text": sys_text})
                req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                             headers={"Content-Type": "application/json", "x-goog-api-key": key})
                continue
            if err.code == 400 and ("audio" in msg.lower() and "support" in msg.lower()):
                raise RuntimeError(f"이 모델({model})은 음성 입력을 받지 않습니다 — 받아쓰기 모델을 바꾸세요")
            if err.code == 400 and ("text" in msg.lower() and "output" in msg.lower() and "support" in msg.lower()):
                raise RuntimeError(f"이 모델({model})은 글로 답하지 않는 모델입니다 (음성·이미지 전용) — 대화 모델을 바꾸세요")
            if err.code == 400 and "thinking" in msg.lower() and "thinkingConfig" in body["generationConfig"] and attempt < 2:
                body["generationConfig"].pop("thinkingConfig")
                req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                             headers={"Content-Type": "application/json", "x-goog-api-key": key})
                continue
            if err.code in (429, 500, 503) and attempt < 2:
                time.sleep(3 * (attempt + 1))
                continue
            if err.code == 503:
                raise RuntimeError(f"Gemini 모델({model})이 지금 붐벼서 응답하지 못했습니다 — 잠시 후 다시 시도하거나 다른 모델을 넣으세요")
            if err.code == 429:
                raise RuntimeError(f"Gemini 모델({model}) 사용량 한도에 걸렸습니다 — 무료 등급에서 막힌 모델일 수 있으니 다른 모델을 쓰거나 잠시 후 다시 시도하세요")
            raise RuntimeError(f"Gemini API 오류 {err.code}: {msg[:200]}")
        except TimeoutError:
            raise RuntimeError(f"Gemini 모델({model})이 2분 안에 응답하지 않았습니다 — 붐비는 중일 수 있으니 다른 모델을 고르세요")
        except urllib.error.URLError as err:
            if isinstance(getattr(err, "reason", None), TimeoutError):
                raise RuntimeError(f"Gemini 모델({model})이 2분 안에 응답하지 않았습니다 — 붐비는 중일 수 있으니 다른 모델을 고르세요")
            raise RuntimeError("Gemini API 에 연결하지 못했습니다 (네트워크 확인)")
    cands = data.get("candidates") or []
    if not cands:
        reason = (data.get("promptFeedback") or {}).get("blockReason", "")
        raise RuntimeError(f"Gemini 가 답하지 않았습니다 {reason}".strip())
    parts_out = (cands[0].get("content") or {}).get("parts", [])
    text = "".join(pt.get("text", "") for pt in parts_out if not pt.get("thought")).strip()   # 생각 요약 부분은 빼고
    if not text and parts_out is not None:
        reason = cands[0].get("finishReason", "")
        if reason and reason != "STOP":
            raise RuntimeError(f"Gemini 모델({model})이 답을 끝내지 못했습니다 ({reason})")
    u = data.get("usageMetadata") or {}
    return text, data.get("modelVersion") or model, f"입력 {u.get('promptTokenCount', '?')} · 출력 {u.get('candidatesTokenCount', '?')} 토큰"


GEMINI_TTS_MODELS = ("gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts")
TTS_STICKY = {"model": None}   # 한 번 된 모델을 계속 씀 — 모델이 바뀌면 같은 목소리 이름이라도 소리가 달라짐


def gemini_tts(text, key, model="", voice="Kore"):
    """Gemini 음성 합성 — 자연스러운 목소리로 읽은 PCM(16비트) 오디오를 base64 로 돌려줌.
    마지막으로 된 모델을 먼저 쓰고(한도 초과면 잠깐 쉬고 한 번 더), 그래도 안 될 때만 다른 TTS 모델로 넘어감"""
    if not key:
        raise RuntimeError("Gemini API 키가 필요합니다")
    text = str(text)[:1500]
    last = None
    order = [x for x in [TTS_STICKY["model"], model] if x] + list(GEMINI_TTS_MODELS)
    order = list(dict.fromkeys(order))
    order = order[:1] + order   # 첫 모델은 두 번까지 시도
    for n, m in enumerate(order):
        if n == 1 and m == order[0] and last and not any(c in last for c in (": 429", ": 503", "timed out")):
            continue   # 한도·일시 오류가 아니면 재시도 의미 없음
        if n == 1 and m == order[0]:
            time.sleep(1.0)
        body = {"contents": [{"role": "user", "parts": [{"text": text}]}],   # 읽을 문장만 — 지시문을 붙이면 그것까지 소리 내 읽음
                "generationConfig": {"responseModalities": ["AUDIO"],
                                     "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice or "Kore"}}}}}
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{urllib.parse.quote(m)}:generateContent",
                                     data=json.dumps(body).encode(), method="POST",
                                     headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                data = json.loads(res.read())
        except urllib.error.HTTPError as err:
            try:
                msg = json.loads(err.read()).get("error", {}).get("message", "")
            except ValueError:
                msg = ""
            if err.code in (400, 401, 403) and "API key" in msg:
                raise RuntimeError("Gemini API 키가 맞지 않습니다")
            last = f"{m}: {err.code} {msg[:120]}"
            continue
        except (urllib.error.URLError, TimeoutError) as err:
            last = f"{m}: {err}"
            continue
        for c in data.get("candidates") or []:
            for pt in (c.get("content") or {}).get("parts", []):
                inl = pt.get("inlineData") or pt.get("inline_data")
                if inl and inl.get("data"):
                    mime = inl.get("mimeType") or inl.get("mime_type") or ""
                    rate = 24000
                    for seg in mime.split(";"):
                        if seg.strip().startswith("rate="):
                            rate = int(seg.strip()[5:] or 24000)
                    TTS_STICKY["model"] = m
                    return {"audio": inl["data"], "mime": mime, "rate": rate, "model": m}
        last = f"{m}: 음성이 없는 응답"
    raise RuntimeError(f"Gemini 음성 합성에 실패했습니다 ({last})")


def gemini_models(key):
    if not key:
        raise RuntimeError("Gemini API 키가 필요합니다")
    req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", headers={"x-goog-api-key": key})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read())
    except urllib.error.HTTPError as err:
        raise RuntimeError("Gemini API 키가 맞지 않습니다" if err.code in (400, 401, 403) else f"Gemini 모델 목록 오류 {err.code}")
    out = []
    for m in data.get("models") or []:
        if "generateContent" in (m.get("supportedGenerationMethods") or []):
            out.append({"id": (m.get("name") or "").replace("models/", ""), "name": m.get("displayName") or ""})
    return [x for x in out if x["id"].startswith("gemini")]


def _clean_history(history):
    """사용자→비서 순서로 번갈아 오는 최근 대화만 (첫 메시지는 사용자)"""
    out = []
    for h in (history or [])[-20:]:
        if not isinstance(h, dict) or h.get("role") not in ("user", "assistant") or not str(h.get("text") or "").strip():
            continue
        if not out and h["role"] != "user":
            continue
        if out and out[-1]["role"] == h["role"]:
            out[-1] = {"role": h["role"], "text": out[-1]["text"] + "\n" + str(h["text"])[:2000]}
        else:
            out.append({"role": h["role"], "text": str(h["text"])[:2000]})
    if out and out[-1]["role"] == "user":   # 마지막은 비서 답이어야 이번 질문과 번갈아짐
        out.pop()
    return out


def _claude_msgs(history, prompt):
    return [{"role": h["role"], "content": h["text"]} for h in _clean_history(history)] + [{"role": "user", "content": prompt}]


def _ask(provider, system, prompt, key, model, max_tokens, history=None, fast=False):
    if provider == "gemini":
        return _ask_gemini(system, prompt, key, model, max_tokens, history, None, fast)
    if not key and not ai_available():
        raise RuntimeError("Claude API 키가 필요합니다 — 설정 탭의 AI 분석에서 넣으세요")
    return _ask_claude(system, prompt, key, model, max_tokens, history)


def ai_brief(facts, force=False, provider="claude", key="", model=""):
    with AI_LOCK:
        tag = f"{provider}:{model}"
        if not force and AI_CACHE["text"] and AI_CACHE.get("tag") == tag and time.time() - AI_CACHE["at"] < 3600:
            return {"text": AI_CACHE["text"], "at": int(AI_CACHE["at"] * 1000), "cached": True, "model": AI_CACHE["model"]}
        text, used, usage = _ask(provider, AI_SYSTEM, "다음은 지금 시장 데이터다. 형식에 맞춰 브리핑해 줘.\n\n" + json.dumps(facts, ensure_ascii=False), key, model, 16000)
        if not text:
            raise RuntimeError("AI 응답이 비어 있습니다")
        AI_CACHE.update(at=time.time(), text=text, model=used, tag=tag)
        print(f"[{time.strftime('%H:%M:%S')}] AI 시장 코멘트 생성 ({used}, {usage})")
        return {"text": text, "at": int(AI_CACHE["at"] * 1000), "cached": False, "model": used}


def ai_test(provider="claude", key="", model=""):
    text, used, _ = _ask(provider, "짧게 답한다.", "연결 확인입니다. '연결됨' 한 단어로만 답하세요.", key, model, 1024)
    return {"ok": True, "model": used, "reply": text[:40]}


# ---------------------------------------------------------------------------
# AI 비서 — 용도별 짧은 코멘트 (종목 선택 · 체결 직후 · 매매 분석 · 자유 질문)
# 공통 원칙: 화면이 보낸 수치만 근거, 추천은 근거 수치·위험과 함께(보장 표현 금지, 결정은 사용자 결재), 실수 방지와 데이터 해석에 집중
# ---------------------------------------------------------------------------
ASK_COMMON = (
    "너는 사용자의 개인 트레이딩 비서다. 한국어로, 짧고 구체적으로 말한다.\n"
    "- 근거는 사용자가 보낸 JSON 수치뿐이다. 없는 숫자·사실·뉴스를 지어내지 않는다.\n"
    "- 종목을 추천해도 된다(사용자가 원함). 추천할 때는 ① 사용자의 전략 신호·화면 데이터에서 근거를 찾고 그 수치를 함께 말한다 ② 틀릴 수 있는 이유와 위험(매도선까지 예상 손실 등)을 같이 말한다 ③ 반드시 오른다·확실하다 같은 보장 표현은 쓰지 않는다 ④ 데이터에 없는 소문·실적으로 추천하지 않는다 ⑤ 최종 결정은 사용자다 — 모의투자는 결재함에서 결재해야 실행된다.\n"
    "- 위험 요소, 규칙(전략) 준수 여부, 과거 통계가 말해 주는 것을 수치로 짚는다.\n"
    "- 사용자가 실수할 가능성이 보이면 분명하게 경고한다. 칭찬은 짧게.\n"
    "- 마크다운 기호(#, **, 표) 없이 일반 문장과 • 목록만 쓴다.\n"
)
# 대화(음성으로 읽힐 수 있음) — 옆자리 동료처럼 말하는 해요체
CHAT_STYLE = (
    "지금은 사용자와 말로 주고받는 대화다. 옆자리에서 같이 차트를 보는 믿을 만한 동료처럼, 친근한 해요체로 말한다.\n"
    "- 보고서 문체(~이다, ~함, ~할 것)나 딱딱한 나열을 쓰지 않는다. 짧은 문장 2~4개로, 핵심부터 먼저 말한다.\n"
    "- 숫자는 말할 때처럼 다듬는다: 9.16% → 9% 정도, -64점 → 마이너스 64, 1,386,000원 → 138만 원. '퍼센트'라고 풀어 쓰지 말고 % 기호를 쓴다.\n"
    "- 목록, 괄호 설명, 영어 약어 남발을 피한다. 꼭 필요하면 '첫째, 둘째'처럼 말로 이어 간다.\n"
    "- 앞의 대화를 기억하고 이어서 답한다(같은 설명을 반복하지 않는다). 질문이 모호하면 짧게 되묻는다.\n"
    "- 상황이 위험해 보이면 돌려 말하지 말고 분명히 말하되, 겁주지 않는다.\n"
    "- 데이터에 없는 건 '그건 지금 화면 데이터로는 알 수 없어요'라고 솔직히 말한다.\n"
    "- 마지막에 필요할 때만, 다음에 확인해 볼 것을 한 문장으로 제안한다.\n"
    "- 이 매매의 핵심: 저가권(3년 가격 범위의 아래쪽)에서 큰 하락 뒤 오래 횡보하며 200일 볼린저밴드가 최대로 좁아진 종목이 상단을 돌파할 때 사서(데이터의 스퀴즈), 산 뒤의 운용(손절선·매도선·2·3차 추가 매수 — 데이터의 운용현황)으로 대응하는 것이다. 고가권 돌파는 이 매매가 아니다. 종목을 볼 때 이 기준으로 위치를 말한다.\n"
    "- 데이터의 돌파대기는 저가권 200일 스퀴즈 상태로 상단 가까이 온 종목(상단까지 % · 오늘 돌파)이다. 살 만한 후보를 물으면 이 목록을 근거·위험과 함께 먼저 본다. 장중에 상단을 뚫으면 화면이 알리고 결재 안건을 미리 올린다(실제 매수는 매매 시간대에 돌파가 유지될 때).\n"
    "- 데이터의 주요뉴스는 지금 많이 다뤄지는 경제(또는 종합) 뉴스 제목이다. 시장 상황을 물으면 주요지수·시장 국면과 함께 참고하되, 제목에 있는 내용만 말한다.\n"
    "- 데이터의 인버스: 시장 국면이 하락이고 점수가 진입 기준 이하이면(지금판단) 인버스 ETF를 추천할 수 있다 — 1배, 점수가 더 나쁘면 2배. 근거(국면 점수·하락 근거 수·판정검증·주요지수)와 위험(반등하면 손실, 2배는 횡보에도 손실이 쌓이는 감쇠라 짧게, 판정이 틀릴 수 있음)을 수치로 같이 말한다. 상승·중립 국면에서는 인버스를 권하지 않는다. 실행은 결재함에서 사용자가 결재하고, 인버스 기준값은 설정 키 invOn·invEntry·invExit·invLev·invLevScore·invPct·invMaxDays·invExitMa·inv1·inv2.\n"
    "- 데이터의 시장후보요약에는 지금 종목군 전체의 오늘돌파신호·스퀴즈상단근처·상단근접 상위 종목과 수치(등락·상단대비·5일선대비·거래량배수·거래대금·섹터)가 있다. 오늘 살 만한 종목이나 후보 비교를 물으면 이 목록의 수치를 비교해 근거·위험과 함께 답하고, 가장 나은 후보를 차트에 띄워 줄 수 있다.\n"
    "- 데이터의 선택종목.최근20봉·최근뉴스가 있으면 최근 흐름(고점·저점·지지·저항)과 뉴스 제목까지 참고한다. 뉴스 내용은 제목에 있는 것만 말한다.\n"
    "- 데이터의 표시구간은 사용자가 차트에서 드래그로 직접 찍은 매수~매도 예시다(👍 좋은 예시 · 👎 피할 자리). "
    "'이 구간', '방금 표시한 거'는 표시구간.지금보는구간을 말한다. 그 수치로 답하고, 좋은 예시들의 공통점이 보이면 짚어 준다.\n"
    "- 사용자는 이동평균선을 'N선'(예: 11선, 20선)이라고 부른다. N선 = N일 이동평균선으로 같은 것이니 고쳐 말하지 말고 사용자처럼 'N선'이라고 말한다.\n"
    "- 질문은 음성 받아쓰기라 '십일선'이 '11일', '11일로', '11 일'처럼 적힐 수 있다. 매도 기준·이평 이야기에서 나온 'N일'은 N선으로 이해하고, 날짜로 오해하지 않는다.\n"
    "- 사용자가 '해 줘', '해 줄래', '바꿔 줘'처럼 직접 시킨 것은 제안이 아니라 <<명령>>으로 바로 실행한다. 여러 값을 말하면 하나의 명령에 모두 담는다."
)
ASK_PURPOSE = {
    "stock": "사용자가 방금 이 종목을 차트에 띄웠다. 3~4문장: ① 전략 기준(저가권에서 큰 하락·오랜 횡보 뒤 200일 밴드가 최대로 좁아졌다가 상단을 돌파하면 매수, 산 뒤에는 돌파봉 저가 손절·N일선 이탈 매도·분할 추가 매수로 운용)에서 지금 위치 ② 눈에 띄는 위험(급등 추격, 유동성, 시장 국면, 섹터 약세 등) ③ 과거 통계가 있으면 그 의미.",
    "trade": "사용자의 모의 계좌에서 방금 체결이 있었다. 2~3문장: 이 체결이 전략 규칙과 맞는지, 진입·청산 조건 수치로 본 주의점, 다음에 확인할 것.",
    "order": "사용자가 주문을 넣으려 하고, 화면이 실수 가능성을 점검했다. 2~3문장으로 경고들의 무게(어느 것이 가장 위험한지)와 과거 통계 수치를 짚어라. 주문하라·하지 말라고 결정해 주지는 말고 판단 근거를 정리한다.",
    "journal": "사용자의 매매 기록과 전략 백테스트 통계다. 6줄 이내: • 잘 되는 조건 1~2개 • 성과가 나쁜 조건(수치 포함) 2~3개 • 실수 방지를 위한 규칙 제안 2개.",
    "risk": "너는 투자회사의 리스크 매니저이자 반대 의견 담당이다. 사용자의 모의 계좌에 매수 또는 매도 안건이 올라왔고, 사용자가 결재하기 전에 꼭 읽는 브리핑이다. 형식(각 줄 짧게, 8줄 이내): ① 이 결정이 틀릴 수 있는 이유 3가지 — 데이터의 수치 근거와 함께 ② 결재 전에 확인할 점 2가지 ③ 그래도 이 결정이 맞을 수 있는 이유 1~2가지 ④ 최악의 경우 예상 손실(원·%) 한 줄. 사라·팔라·하지 말라고 결정해 주지 않는다 — 결정은 사용자의 몫이다. 종목을 추천하지 않는다. 데이터에 없는 내용은 지어내지 않는다.",
    "ask": "사용자의 질문에 화면 데이터로 답한다. 데이터에 없는 것은 모른다고 말한다. 5문장 이내.",
    "chat": CHAT_STYLE,
    "range": "사용자가 차트에서 매수~매도 구간을 직접 드래그해 표시했다. 전략 신호가 잘 안 잡히는 자리를 알려 주는 학습용 예시다. "
             "5문장 이내, 해요체: ① 매수 시점 수치 특징(그날 상승률·BB 상단 대비·5일선 이격·거래량·국면) 중 눈에 띄는 것 "
             "② 전략(BB 상단 돌파 진입·N일선 이탈 매도)이 이 자리를 잡았는지, 못 잡았다면 어떤 조건 차이 때문인지 수치로 "
             "③ 비슷한 과거 자리 통계가 말해 주는 것(전체 평균과 비교) "
             "④ 이런 자리를 잡으려면 어떤 규칙을 더하거나 완화해 볼 수 있는지 구체적인 수치로 1~2개. "
             "사용자 메모와 👍/👎 표시가 있으면 그 의도를 존중해 반영한다. 종목을 사라·팔라고 하지 않는다.",
}
CHAT_ACTIONS = (
    "\n매매 조건 바꾸기(가장 중요): 사용자가 매수·매도 조건을 말하면 말로 설명만 하지 말고 반드시 실제로 바꾼다.\n"
    "- 설정 값으로 되는 것은 설정 명령: BB 기간 bbPeriod·배수 bbStd, 매도선 exitMa(N선), 거래량 확인 volFilter+volMult(배), ADX adxFilter+adxMin, 후보 범위 nearPct, "
    '진입 방식 entryMode("ALL" 모든 상단 돌파 / "SQ" 200일 스퀴즈 돌파만 — 스퀴즈 기준 sqPct 밴드 폭 3년 중 하위%·sqDrop 하락 흔적%·sqRange 120일 횡보 폭%), '
    "장대양봉 대기 lcWait(장대양봉으로 돌파하면 바로 사지 않고 눌림 뒤 첫 반등에 매수 — lcAtr 몸통 배수·lcChg 상승률%·lcDays 최대 대기일), 스퀴즈 돌파 뒤 전고점 돌파 매수 sqFollow·sqFollowDays, 저가권 sqZone(3년 범위 아래 %), 손절 stopMode(BREAK·BOX·NONE), 매수 타이밍 ma5Confirm(신호 뒤 2일 연속 종가가 5일선 위면 둘째 날 매수), 복리 배분 slotAuto. "
    "스퀴즈 돌파는 장기 추세의 신호일 뿐 절대적인 매수 근거가 아니라고 설명한다. 진입 방식을 바꾸기 전에는 비교 명령으로 "
    '{"do":"비교","variants":[{"name":"스퀴즈만","set":{"entryMode":"SQ"}},{"name":"스퀴즈만+장대양봉 대기","set":{"entryMode":"SQ","lcWait":true}}]} 처럼 먼저 보여 준다.\n'
    "- 설정으로 안 되는 조건(RSI, 전고점 돌파, 연속 양봉, 갭, 이격도, 특정 이평선 정배열 등)은 규칙 블록으로 직접 코드를 짠다:\n"
    '  <<규칙 kind="entry" mode="and" title="짧은 이름">> JS 본문 <</규칙>>  (kind: entry=매수 / exit=매도)\n'
    "  · mode — 매수: and(BB 상단 돌파 + 이 조건) / replace(이 조건만으로 매수). 매도: or(N선 이탈 또는 이 조건) / replace(이 조건만으로 매도).\n"
    "  · 본문은 (bars, i) 를 받아 i번째 일봉에서 조건이 맞으면 true 를 return. bars[i] 필드: t,o,h,l,c,v, mid·upper·lower(BB), ma5·ma20·ma60·ma120, volMa(20일 평균 거래량), adx, ready.\n"
    "  · 쓸 수 있는 함수: sma(bars,i,n,'c'), ema(bars,i,n), highest(bars,i,n,'h'), lowest(bars,i,n,'l'), rsi(bars,i,14), chg(bars,i,n)=n일 등락률%, volx(bars,i,20)=거래량 배수.\n"
    "  · 예: 거래량 3배 + 전고점 돌파 → return volx(bars,i) >= 3 && bars[i].c > highest(bars,i-1,60,'h');\n"
    "  · 같은 kind 로 다시 보내면 그 규칙을 바꾼다. 끄기는 {\"do\":\"규칙삭제\",\"kind\":\"entry|exit\"}. 지금 규칙·백테스트 요약은 데이터의 매매규칙.\n"
    "- 바꾸면 화면이 신호·백테스트·자동매매·차트(매도선·△ 매수 신호)를 바로 다시 계산하고 전후 비교를 보여 준다. 말로는 무엇을 바꿨는지 한 문장만.\n"
    "- 사용자가 어느 값이 나은지 묻거나 '비교해 줘'라고 하면 말로 추측하지 말고 비교 명령을 쓴다(화면이 나란히 백테스트하고 앞·뒤 기간 검증표를 보여 줌):\n"
    '  {"do":"비교","key":"exitMa","values":[5,10,20]} 또는 {"do":"비교","variants":[{"name":"10선+거래량2배","set":{"exitMa":10,"volFilter":true,"volMult":2}}, ...]} (최대 6개)\n'
    '- 사용자가 표시한 👍 예시로 규칙을 만들어 달라고 하면 {"do":"규칙추출"} — 화면이 공통점을 찾아 규칙 초안과 검증 수치를 보여 준다. '
    "결과(데이터의 뽑은규칙)를 다듬어 달라고 하면 그 코드를 고쳐 규칙 블록으로 보낸다.\n"
    '  비교에 규칙 후보도 넣을 수 있다: {"name":"RSI 70 이하","rule":{"kind":"entry","mode":"and","code":"return rsi(bars,i,14) <= 70;"}} — 적용 전에 효과를 보여 줄 때 쓴다.\n'
    "- 종목 찾기: 사용자가 조건에 맞는 종목을 찾아 달라고 하면 말로 추측하지 말고 "
    '{"do":"종목찾기","title":"짧은 이름","code":"JS 본문","days":1,"sort":"amount|chg|vol"} — code 는 규칙 블록과 같은 (bars, i) 본문, '
    "화면이 불러온 모든 종목의 최근 days일 일봉에서 맞는 종목을 표로 보여 준다(줄을 누르면 차트, 관심종목 넣기 버튼). 결과 요약은 데이터의 마지막검색. 사용자가 원하면 결과 중 전략 기준으로 눈에 띄는 후보를 근거 수치·위험과 함께 꼽아도 된다.\n"
    "- 차트에 그리기: 지지선·저항선·목표가·메모를 보여 달라고 하면 "
    '{"do":"그리기","code":"...","lines":[{"price":71000,"label":"지지","color":"파랑"}],"notes":[{"date":"20261015","text":"거래량 급증"}],"replace":false} '
    '(색: 빨강·파랑·초록·주황·보라·회색, code 를 빼면 지금 종목). 지우기 {"do":"그림삭제"} 또는 {"do":"그림삭제","all":true}. 지금 그림은 데이터의 차트그림. 가격은 데이터의 실제 수치로 정한다.\n'
    "- 차트 모양·보조지표: 봉 색, 이평선 색·기간, 보조지표를 바꿔 달라고 하면 "
    '{"do":"차트설정","set":{"up":"빨강","down":"파랑","hollow":false,"bb":true,"bbUp":"#e5383b","bbMid":"검정","bbLow":"파랑","vol":true,"grid":true},'
    '"maSet":[{"p":20,"c":"주황","on":true}],"maDel":[120],"ma":[{"p":5,"c":"분홍"},{"p":20,"c":"주황"}],'
    '"add":[{"k":"rsi","params":[14,9],"color":"보라"}],"del":["macd"],"reset":false} — 필요한 칸만 쓴다. '
    "set 의 up·down 은 양봉·음봉 색, hollow 는 양봉 속 비우기, exitLine·exitColor 는 매도 기준선(설정 exitMa일선을 그린 굵은 선 — 기본 파랑, 이평선 목록과 별개라 maSet 으로는 안 바뀐다. 사용자가 '파란 선'·'굵은 N일선'을 말하면 대개 이 선). maSet 은 그 기간 이평선의 색·켜기를 바꾸거나 없으면 추가, ma 는 이평선 목록 통째로 바꾸기, maDel 은 지우기. "
    "보조지표 k: 차트 위 mesh(시작,끝,간격 — 그물망: 여러 이평선을 연한 초록 가는 선으로) ema(기간) bb(기간,배수) env(기간,%) ichi(전환,기준,선행) sar(가속,최대) / 아래 칸 rsi(기간,신호) macd(단기,장기,신호) stoch(기간,%K,%D) "
    'cci(기간) willr(기간) mfi(기간) adx(기간) atr(기간) obv() disp(기간, 이격도) vr(기간, 거래량 비율). params 를 빼면 기본값. del 에 "all" 이면 보조지표 모두 지움. '
    "색: 빨강·파랑·초록·주황·보라·회색·분홍·노랑·하늘·검정·갈색·남색·민트 또는 #rrggbb. 지금 모양은 데이터의 차트모양. 보이는 모양만 바뀌고 전략 계산은 그대로다. "
    "목록에 없는 지표는 지표 블록으로 직접 만든다.\n"
    "- 결재함: 모의 자동매매는 결재제다 — 신호가 나오면 안건이 올라오고(데이터의 결재함), 사용자가 리스크 브리핑을 읽고 화면에서 직접 승인·거절해야 실행된다. 사용자가 안건을 물으면(지금토론안건) 위험과 근거를 균형 있게, 수치로 설명하고 결정은 사용자에게 맡긴다. 비서는 대신 결재할 수 없고 결재 명령도 없다. 결재 기록을 돌아봐 달라고 하면 최근결정의 결정뒤등락으로 승인·거절한 것의 이후 성과와 결정 습관을 정리한다.\n"
    "- 매매 일지: 모든 주문이 일지에 자동으로 적힌다(데이터의 매매일지 — 수익·이유). 사용자가 산·판 이유를 말하면 "
    '{"do":"일지","code":"...","why":"이유"} 로 가장 최근 그 종목 기록에 붙인다. 일지를 돌아봐 달라고 하면 잘한 점·반복한 실수·바꿀 점을 기록의 숫자로 근거를 들어 짧게 말한다.\n'
    "- 화면은 장중에 비서 이름으로 먼저 알림을 보낸다(매도선 근접·도달, 매수 신호, 매매 시간대, 체결). 대화 기록의 🔔 줄이 그 알림이다.\n"
    "\n화면 조작 권한: 사용자가 화면을 바꾸거나 기능을 실행해 달라고 하면, 답의 맨 끝 줄에 <<명령>> 다음 JSON 배열을 붙인다.\n"
    "이 줄은 화면이 실행하며 사용자에게 보이거나 읽히지 않는다. 말로는 무엇을 하는지 한 문장만 한다. 조작 요청이 없으면 붙이지 않는다.\n"
    "사용자가 요청하지 않았지만 바꿔 보면 좋을 것을 제안할 때(예: 매도 기준을 10일선으로)는 답의 맨 끝 줄에 <<제안>> 다음 JSON 배열을 붙인다. "
    "화면이 '적용' 버튼으로 보여 주고 사용자가 눌러야 실행된다. 이때 말로는 제안 이유만 짧게 말하고 '바꿔 드릴까요?'처럼 묻지 않는다.\n"
    "명령 JSON은 반드시 <<명령>> 또는 <<제안>> 뒤에만 쓴다. 문장 중간이나 따로 떨어진 줄에 JSON·중괄호를 절대 쓰지 않는다.\n"
    "명령 목록:\n"
    '{"do":"종목","code":"005930"} 또는 {"do":"종목","name":"삼성전자"} — 차트에 띄우기\n'
    '{"do":"주기","tf":"1|3|5|10|15|30|60|D|W|M"} — 분·일·주·월봉\n'
    '{"do":"확대","bars":120} — 화면에 보일 봉 수 (작을수록 확대)\n'
    '{"do":"과거봉"} — 과거 봉 1000개 더 불러오기\n'
    '{"do":"탭","tab":"assist|bt|paper|set"} — 오른쪽 탭(비서·백테스트·모의투자·설정)\n'
    '{"do":"리서치센터","tab":"brief|index|regime|sector|scen|news"} / {"do":"리서치센터닫기"} — 시장 국면 근거는 regime\n'
    '{"do":"종목군","u":"WATCH|K200|Q150|ALL|INV"} — 관심·코스피200·코스닥150·검색식·인버스\n'
    '{"do":"관심","code":"...","on":true} — 관심종목 추가(true)·삭제(false)\n'
    '{"do":"패널","left":true,"right":false} — 좌우 패널 펼치기·접기\n'
    '{"do":"설정","set":{"exitMa":10}} — 키와 현재 값은 데이터의 화면.설정\n'
    '{"do":"주문","code":"...","side":"BUY|SELL","type":"MKT|LMT","price":0,"qty":1} — 모의 주문 (LMT는 price 필수)\n'
    '{"do":"즉시매도","code":"..."} — 보유 종목 전량 즉시 매도 (모의)\n'
    '{"do":"백테스트"} — 백테스트 다시 실행\n'
    '{"do":"지수차트","sym":"^KS11|^KQ11|^GSPC|^IXIC|^DJI|^SOX|^VIX|KRW=X"} — 리서치센터에서 지수 차트 (코스피·코스닥·S&P500·나스닥·다우·반도체·VIX·원/달러)\n'
    '{"do":"필터","f":"all|signal|squeeze|near|held"} 종목 목록 거르기 · {"do":"정렬","key":"name|price|chg|toUpper|","dir":"asc|desc"} 목록 정렬\n'
    '{"do":"결재함"} 결재함 열기 · {"do":"지금판단"} 지금 가격으로 판단해 안건 올리기(결재제일 때만) · {"do":"인버스판단"} · {"do":"인버스백테스트"}\n'
    '{"do":"알림","mode":"voice|quiet|off"} 먼저 알림 · {"do":"패널폭","left":244,"right":300} · {"do":"차트설정창","on":true} · {"do":"뉴스","q":"검색어"}\n'
    '- 설정을 바꿀 때는 데이터 화면.설정에 있는 키(뜻과 현재 값이 함께 있음)를 {"do":"설정","set":{...}}로 바꾼다 — 매수 방식·저가권·손절·매도선·분할·인버스·결재제·매매 시간대 등 화면 설정 전부. 차트 모양은 차트설정, 그림은 그리기.\n'
    "규칙: 사용자가 분명히 요청한 것만 명령한다. 추천은 말로만 한다 — 주문 명령은 사용자가 종목·방향·수량을 직접 말했을 때만 만든다. "
    "주문·즉시매도·설정 변경은 화면이 사용자에게 확인을 받은 뒤 실행된다. 코드를 모르면 name을 쓴다. "
    "요청이 모호하면(예: 수량 없음) 명령 없이 되묻는다."
    '\n추가 명령: {"do":"위젯삭제","id":"..."} · {"do":"지표삭제","id":"..."} · {"do":"스타일초기화"}\n'
    '실계좌: {"do":"실주문","code":"...","side":"BUY|SELL","type":"MKT|LMT","price":0,"qty":1} — 증권사 실제 계좌 주문. '
    "사용자가 '실계좌'·'진짜 계좌'라고 분명히 말하고 종목·방향·수량을 직접 정했을 때만 만든다(그 밖의 주문은 모의 '주문'). "
    "화면이 한도를 확인하고 사용자가 확인 창에서 직접 눌러야 나간다. 주문 허용을 켜는 것은 사용자만 할 수 있고 너는 못 한다. "
    '{"do":"비상정지"} — 실계좌 주문을 바로 정지(사용자가 멈추라고 하면 즉시). 실계좌 상태는 데이터의 실계좌.\n'
    "\n만들기 권한: 사용자가 새 화면·도구·지표·디자인 변경을 원하면 직접 프로그래밍해서 만든다. 코드는 답의 끝(<<명령>> 줄보다 앞)에 아래 블록으로 쓰며, 블록은 읽히지 않는다. 말로는 무엇을 만들었는지만 짧게 말한다.\n"
    '1) 위젯(떠 있는 창): <<위젯 id="영문id" title="창 제목">> HTML·CSS·JS 전체 <</위젯>>\n'
    "   - 격리된 창에서 돈다. 외부 네트워크 요청은 막혀 있고, 스크립트는 cdn.jsdelivr.net·cdnjs.cloudflare.com·unpkg.com 에서만 불러올 수 있다(예: Chart.js).\n"
    "   - 데이터는 await app.get(종류, 옵션) 으로만 얻는다. 종류: 'snapshot'(선택 종목·주기·현재가·화면 상태), 'bars'({code, n} — 봉 [{t,o,h,l,c,v}], t는 'YYYYMMDD' 또는 'YYYYMMDDHHmm'), "
    "'stock'({code} — 종목 수치 요약), 'account'(모의 계좌: cash, positions{code:{qty,avg}}, manual, orders, closed), 'list'(관심·불러온 종목과 현재가), 'research'(시장 국면), 'trades'(백테스트 거래).\n"
    "   - app.on(cb) 로 2초마다 {selected, name, tf, price} 를 받는다. await app.do({...명령 목록의 객체}) 로 화면을 조작한다(주문·설정은 확인 창).\n"
    "   - 같은 id로 다시 보내면 그 위젯을 고친다. 기존 코드는 데이터의 내도구.위젯에 있다. 흰 배경·12px·간결한 디자인, 한국어 라벨.\n"
    '2) 차트 지표: <<지표 id="영문id" title="이름" color="#0ea5e9" pane="price|sub">> JS 함수 본문 <</지표>>\n'
    "   - 본문은 bars([{t,o,h,l,c,v}], 오래된 것부터) 를 받아 같은 길이의 숫자 배열(계산 불가 구간은 null)을 return 한다. price=가격 위에 겹쳐 그림, sub=아래 거래량 영역에 따로 그림(RSI 등).\n"
    "   - 선 하나당 지표 하나. 여러 선이 필요하면 블록을 여러 개 쓴다.\n"
    "3) 화면 스타일: <<스타일>> CSS <</스타일>> — 앱 전체에 덧입힌다(색·크기·숨기기). 보낼 때마다 이전 스타일을 통째로 바꾸므로 유지할 규칙도 함께 쓴다. 현재 값은 데이터의 내도구.스타일.\n"
    "코드 블록은 음성 대화의 길이 제한과 상관없이 완성된 코드로 쓴다."
)
ASK_CACHE = {}


def ai_ask(purpose, facts, question, provider, key, model, history=None, fast=False):
    if purpose not in ASK_PURPOSE:
        raise RuntimeError("알 수 없는 요청 종류")
    system = ASK_COMMON + "\n" + ASK_PURPOSE[purpose] + (CHAT_ACTIONS if purpose == "chat" else "")
    prompt = json.dumps(facts, ensure_ascii=False)
    if question:
        prompt = f"질문: {question}\n\n데이터:\n{prompt}"
    tag = hashlib.sha256(f"{provider}|{model}|{purpose}|{prompt}".encode()).hexdigest()
    hit = None if history else ASK_CACHE.get(tag)
    if hit and time.time() - hit["at"] < 1800:
        return {**hit, "cached": True}
    if fast:   # 음성 대화 모드 — 생각 단계 최소, 더 짧게
        system += "\n- 지금은 음성으로 바로 주고받는 중이다. 2~3문장, 한 문장은 짧게. 인사·맺음말 없이 바로 답한다."
    t0 = time.time()
    text, used, usage = _ask(provider, system, prompt, key, model, (8000 if fast else 16000) if purpose == "chat" else (1500 if fast else 4000), history, fast)
    usage += f" · {time.time() - t0:.1f}초"
    if not text:
        raise RuntimeError("AI 응답이 비어 있습니다")
    out = {"text": text, "model": used, "at": time.time()}
    ASK_CACHE[tag] = out
    if len(ASK_CACHE) > 200:
        ASK_CACHE.pop(next(iter(ASK_CACHE)))
    print(f"[{time.strftime('%H:%M:%S')}] AI 비서 [{purpose}] ({used}, {usage})")
    return {**out, "cached": False}


def demo_daily(code, count):
    # 요청 봉 수와 상관없이 같은 가짜 시세가 나오도록 항상 3000봉을 만든 뒤 최근 count개만 반환
    rnd = random.Random(int(code) if code.isdigit() else sum(map(ord, code)))
    today = datetime.now(KST).date()
    days, d = [], today
    while len(days) < 3000:
        if d.weekday() < 5:
            days.append(d)
        d -= timedelta(days=1)
    days.reverse()
    price = rnd.choice([8000, 25000, 60000, 150000, 400000])
    drift, vol = 0.0, rnd.uniform(0.012, 0.03)
    bars = []
    for i, day in enumerate(days):
        if i % 60 == 0:
            drift = rnd.gauss(0.0004, 0.0025)  # 국면 전환 → 추세·돌파 구간이 생기도록
        r = drift + rnd.gauss(0, vol)
        o = price * (1 + rnd.gauss(0, vol / 3))
        c = max(100.0, price * math.exp(r))
        h = max(o, c) * (1 + abs(rnd.gauss(0, vol / 2)))
        l = min(o, c) * (1 - abs(rnd.gauss(0, vol / 2)))
        bars.append({"t": day.strftime("%Y%m%d"), "o": round(o), "h": round(h), "l": round(l), "c": round(c),
                     "v": round(rnd.uniform(1e5, 3e6))})
        price = c
    bars = bars[-count:]
    last = bars[-1]
    return {"code": code, "name": DEMO_NAMES.get(code, f"데모{code}"), "sector": "데모", "demo": True,
            "quote": {"date": last["t"], "time": datetime.now(KST).strftime("%H%M%S"), "price": last["c"], "open": last["o"],
                      "high": last["h"], "low": last["l"], "vol": last["v"], "upper": round(last["c"] * 1.3), "lower": round(last["c"] * 0.7)},
            "bars": bars}


def _hash01(*parts):
    # 시각마다 고정된 0~1 난수 → 다시 받아도 같은 가짜 분봉 (이어 붙여도 값이 튀지 않게)
    h = 2166136261
    for ch in "|".join(map(str, parts)):
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h / 0xFFFFFFFF


def demo_chart(code, tf, count):
    if tf in ("W", "M"):
        groups = {}
        for b in demo_daily(code, 3000)["bars"]:
            d = datetime.strptime(b["t"], "%Y%m%d")
            key = b["t"][:6] if tf == "M" else (d - timedelta(days=d.weekday())).strftime("%Y%m%d")
            groups.setdefault(key, []).append(b)
        bars = [{"t": g[-1]["t"], "o": g[0]["o"], "h": max(x["h"] for x in g), "l": min(x["l"] for x in g),
                 "c": g[-1]["c"], "v": sum(x["v"] for x in g)} for _, g in sorted(groups.items())]
        return {"code": code, "tf": tf, "demo": True, "bars": bars[-count:]}
    m = int(tf)
    base = demo_daily(code, 1)["bars"][-1]["c"]
    now = datetime.now(KST).replace(second=0, microsecond=0, tzinfo=None)
    slots, d = [], now
    while len(slots) < count:  # 평일 09:00~15:30 의 m분 간격 봉 시작 시각을 최근부터 거꾸로
        if d.weekday() < 5:
            first = d.replace(hour=9, minute=0)
            last = min(d, d.replace(hour=15, minute=30)) if d.date() == now.date() else d.replace(hour=15, minute=30)
            t = first + timedelta(minutes=((last - first).seconds // 60 // m) * m) if last >= first else None
            while t is not None and t >= first and len(slots) < count:
                slots.append(t)
                t -= timedelta(minutes=m)
        d = (d - timedelta(days=1)).replace(hour=23, minute=59)
    slots.reverse()

    def px(t):
        n = int(t.timestamp() // 60)
        wave = 0.03 * math.sin(n / 900) + 0.015 * math.sin(n / 170) + 0.006 * math.sin(n / 37)
        return base * math.exp(wave + 0.004 * (_hash01(code, n) - 0.5))

    bars = []
    for t in slots:
        o, c = px(t - timedelta(minutes=m)), px(t + timedelta(minutes=m - 1))
        h = max(o, c) * (1 + 0.002 * _hash01(code, t, "h"))
        l = min(o, c) * (1 - 0.002 * _hash01(code, t, "l"))
        bars.append({"t": t.strftime("%Y%m%d%H%M"), "o": round(o), "h": round(h), "l": round(l), "c": round(c),
                     "v": round(1000 + 50000 * _hash01(code, t, "v"))})
    return {"code": code, "tf": tf, "demo": True, "bars": bars}

# ---------------------------------------------------------------------------
# 실시간 시세 (HTS 방식) — 나무 PLUG 웹소켓에 한 번 접속해 체결가(oc)·호가(ob)를 받아
# 화면에는 스트림(/rt/stream)으로 흘려보냄. 화면이 /rt/subscribe 로 볼 종목 목록을 알려주면 등록/해제를 맞춤.
# 웹소켓은 표준 라이브러리만으로 직접 구현 (별도 설치 불필요).
# ---------------------------------------------------------------------------
import base64
import queue
import socket
import ssl
import struct

NH_WS_HOST = os.environ.get("NH_WS_HOST", "api.nhplug.com")
NH_WS_PORT = int(os.environ.get("NH_WS_PORT", "7070"))
NH_WS_PATH = "/websocket"


class Hub:
    """화면 스트림 구독자들에게 같은 메시지를 나눠줌 (느린 화면은 오래된 메시지부터 버림)"""

    def __init__(self):
        self.lock = threading.Lock()
        self.clients = []
        self.last_status = {"type": "status", "connected": False, "msg": "실시간 준비 중"}

    def add(self):
        q = queue.Queue(maxsize=2000)
        with self.lock:
            self.clients.append(q)
        q.put(json.dumps(self.last_status, ensure_ascii=False))
        return q

    def remove(self, q):
        with self.lock:
            if q in self.clients:
                self.clients.remove(q)

    def publish(self, obj):
        if obj.get("type") == "status":
            self.last_status = obj
        raw = json.dumps(obj, ensure_ascii=False)
        with self.lock:
            for q in self.clients:
                try:
                    q.put_nowait(raw)
                except queue.Full:
                    try:
                        q.get_nowait()
                        q.put_nowait(raw)
                    except queue.Empty:
                        pass


HUB = Hub()


def _tick_size(p):
    for lim, t in ((2000, 1), (5000, 5), (20000, 10), (50000, 50), (200000, 100), (500000, 500)):
        if p < lim:
            return t
    return 1000


def _tick_msg(code, b):
    n = _num
    return {"type": "tick", "code": code, "time": str(b.get("time", "")), "price": n(b.get("price")),
            "open": n(b.get("open")), "high": n(b.get("high")), "low": n(b.get("low")),
            "change": n(b.get("change")), "chrate": n(b.get("chrate")), "sign": str(b.get("sign", "")),
            "qty": n(b.get("movolume")), "vol": n(b.get("new_volume") or b.get("volume")),
            "offer": n(b.get("offer")), "bid": n(b.get("bid")), "power": n(b.get("volpower")),
            "mkt": str(b.get("marketgb", "1"))}


def _book_msg(code, b):
    n = _num
    pre = ["", "P_", "S_"] + [f"S{i}_" for i in range(4, 11)]
    asks = [[n(b.get(p + "offer")), n(b.get(p + "offerrem"))] for p in pre]
    bids = [[n(b.get(p + "bid")), n(b.get(p + "bidrem"))] for p in pre]
    return {"type": "book", "code": code, "time": str(b.get("hotime", "")), "asks": asks, "bids": bids,
            "totalAsk": n(b.get("T_offerrem")), "totalBid": n(b.get("T_bidrem"))}


class Realtime(threading.Thread):
    """원하는 구독 목록(want)을 유지하면서 웹소켓이 끊기면 다시 접속해 전부 재등록"""
    daemon = True

    def __init__(self):
        super().__init__()
        self.lock = threading.Lock()
        self.send_lock = threading.Lock()
        self.want = set()        # {("oc", code), ("ob", code)}
        self.active = set()
        self.sock = None
        self.wake = threading.Event()

    # ---- 화면 → 구독 목록 ----
    def set_targets(self, codes, book):
        want = {("oc", c) for c in codes}
        if book:
            want.add(("ob", book))
        with self.lock:
            self.want = want
        self.wake.set()
        return len(want)

    # ---- 웹소켓 저수준 ----
    def _connect(self):
        raw = socket.create_connection((NH_WS_HOST, NH_WS_PORT), timeout=10)
        s = ssl.create_default_context().wrap_socket(raw, server_hostname=NH_WS_HOST)
        key = base64.b64encode(os.urandom(16)).decode()
        s.sendall((f"GET {NH_WS_PATH} HTTP/1.1\r\nHost: {NH_WS_HOST}:{NH_WS_PORT}\r\nUpgrade: websocket\r\n"
                   f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
        head = b""
        while b"\r\n\r\n" not in head:
            chunk = s.recv(1024)
            if not chunk:
                raise ConnectionError("웹소켓 핸드셰이크 중 연결 끊김")
            head += chunk
        status = head.split(b"\r\n", 1)[0].decode("latin-1")
        if " 101 " not in status + " ":
            raise ConnectionError(f"웹소켓 접속 거부: {status}")
        self._buf = head.split(b"\r\n\r\n", 1)[1]
        s.settimeout(1.0)
        return s

    def _send_frame(self, opcode, payload):
        mask = os.urandom(4)
        n = len(payload)
        hdr = bytes([0x80 | opcode])
        if n < 126:
            hdr += bytes([0x80 | n])
        elif n < 65536:
            hdr += bytes([0x80 | 126]) + struct.pack(">H", n)
        else:
            hdr += bytes([0x80 | 127]) + struct.pack(">Q", n)
        data = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        with self.send_lock:
            self.sock.sendall(hdr + mask + data)

    def _fill(self, n, block):
        # 버퍼에 n바이트가 찰 때까지 읽음 — block=False 면 1초 안에 아무것도 없을 때 None 대신 False
        deadline = time.time() + 15
        while len(self._buf) < n:
            try:
                chunk = self.sock.recv(65536)
            except socket.timeout:
                if not block:
                    return False
                if time.time() > deadline:
                    raise ConnectionError("웹소켓 수신 시간 초과")
                continue
            if not chunk:
                raise ConnectionError("웹소켓 연결 끊김")
            self._buf += chunk
        return True

    def _read_frame(self):
        if not self._fill(2, False):
            return None
        b1, b2 = self._buf[0], self._buf[1]
        n, pos = b2 & 0x7F, 2
        if n == 126:
            pos = 4
        elif n == 127:
            pos = 10
        masked = b2 & 0x80
        hlen = pos + (4 if masked else 0)
        self._fill(hlen, True)
        if n == 126:
            n = struct.unpack(">H", self._buf[2:4])[0]
        elif n == 127:
            n = struct.unpack(">Q", self._buf[2:10])[0]
        self._fill(hlen + n, True)
        payload = self._buf[hlen:hlen + n]
        if masked:
            m = self._buf[pos:pos + 4]
            payload = bytes(x ^ m[i % 4] for i, x in enumerate(payload))
        self._buf = self._buf[hlen + n:]
        return b1 & 0x80, b1 & 0x0F, payload

    # ---- 등록/해제 ----
    def _reg(self, tr_cd, code, on):
        msg = {"header": {"token": access_token(), "tr_type": "1" if on else "2"}, "body": {"tr_cd": tr_cd, "tr_key": code}}
        self._send_frame(0x1, json.dumps(msg).encode())
        time.sleep(0.12)  # 초당 10건 제한

    def _sync(self):
        with self.lock:
            want = set(self.want)
        for item in sorted(self.active - want):
            self._reg(item[0], item[1], False)
            self.active.discard(item)
        for item in sorted(want - self.active):
            self._reg(item[0], item[1], True)
            self.active.add(item)

    def _handle(self, text):
        try:
            msg = json.loads(text)
        except ValueError:
            return
        h, b = msg.get("header") or {}, msg.get("body") or {}
        tr, code = h.get("tr_cd"), h.get("tr_key") or b.get("code")
        if tr == "oc" and b.get("price") is not None:
            HUB.publish(_tick_msg(code, b))
        elif tr == "ob" and b.get("offer") is not None:
            HUB.publish(_book_msg(code, b))
        else:  # 등록 응답·오류 등은 중계기 창에만 표시
            print(f"[{time.strftime('%H:%M:%S')}] 실시간 응답: {text[:200]}")

    def run(self):
        backoff = 1
        while True:
            try:
                self.sock = self._connect()
                self.active = set()
                self.wake.set()   # 다시 접속하면 구독 종목을 바로 다시 신청
                HUB.publish({"type": "status", "connected": True, "msg": "나무 실시간 접속"})
                print(f"[{time.strftime('%H:%M:%S')}] 실시간 웹소켓 접속")
                backoff, last_rx, frag, opened = 1, time.time(), b"", time.time()
                while True:
                    if self.wake.is_set():
                        self.wake.clear()
                        self._sync()
                    # 나무 서버는 클라이언트 ping 을 받으면 연결을 닫음 → 2분 넘게 아무것도 안 올 때만 확인용으로 보냄
                    if time.time() - last_rx > 120:
                        self._send_frame(0x9, b"")
                        last_rx = time.time()
                    f = self._read_frame()
                    if f is None:
                        continue
                    fin, op, data = f
                    last_rx = time.time()
                    if op in (0x1, 0x2):
                        self.closes = 0
                    if op == 0x9:
                        self._send_frame(0xA, data)
                    elif op == 0x8:
                        if self.active and time.time() - opened < 60:
                            self.closes = getattr(self, "closes", 0) + 1
                            # 체결이 한 번도 안 온 채 두 번 연속 끊기면 토큰 문제로 보고 새로 발급 (10분에 한 번까지)
                            if self.closes >= 2 and _token["value"] and time.time() - getattr(self, "last_inv", 0) > 600:
                                self.last_inv = time.time()
                                token_invalidate(_token["value"])
                                self.closes = 0
                        raise ConnectionError("서버가 웹소켓을 닫음")
                    elif op in (0x1, 0x2, 0x0):
                        frag += data
                        if fin:
                            self._handle(frag.decode("utf-8", "replace"))
                            frag = b""
            except Exception as err:
                HUB.publish({"type": "status", "connected": False, "msg": f"실시간 끊김 — {backoff}초 후 재접속 ({err})"})
                print(f"[{time.strftime('%H:%M:%S')}] 실시간 오류: {err} → {backoff}초 후 재접속")
                try:
                    self.sock and self.sock.close()
                except OSError:
                    pass
                time.sleep(backoff)
                backoff = min(30, backoff * 2)
                self.wake.set()


class DemoRealtime(threading.Thread):
    """데모: 구독 종목마다 가짜 체결·호가를 만들어 흘려보냄 (화면 확인용)"""
    daemon = True

    def __init__(self):
        super().__init__()
        self.lock = threading.Lock()
        self.codes, self.book, self.px, self.vol = set(), None, {}, {}

    def set_targets(self, codes, book):
        with self.lock:
            self.codes, self.book = set(codes), book
        return len(codes) + (1 if book else 0)

    def run(self):
        HUB.publish({"type": "status", "connected": True, "msg": "데모 실시간 (가짜 체결)"})
        rnd = random.Random()
        while True:
            time.sleep(rnd.uniform(0.15, 0.4))
            with self.lock:
                codes, book = list(self.codes), self.book
            if not codes:
                continue
            code = book if book and rnd.random() < 0.5 else rnd.choice(codes)
            if code not in self.px:
                last = demo_daily(code, 1)["bars"][-1]
                self.px[code] = {"p": last["c"], "o": last["c"], "h": last["c"], "l": last["c"]}
                self.vol[code] = 0
            s = self.px[code]
            t = _tick_size(s["p"])
            s["p"] = max(t, s["p"] + t * rnd.choice([-2, -1, -1, 0, 1, 1, 2]))
            s["h"], s["l"] = max(s["h"], s["p"]), min(s["l"], s["p"])
            q = rnd.choice([1, 3, 10, 25, 50, 120, 300])
            self.vol[code] += q
            now = datetime.now(KST).strftime("%H:%M:%S")
            HUB.publish({"type": "tick", "code": code, "time": now, "price": s["p"], "open": s["o"], "high": s["h"], "low": s["l"],
                         "change": s["p"] - s["o"], "chrate": round((s["p"] / s["o"] - 1) * 100, 2), "sign": "2" if s["p"] >= s["o"] else "5",
                         "qty": q, "vol": self.vol[code], "offer": s["p"] + t, "bid": s["p"], "power": 100.0, "mkt": "1"})
            if code == book:
                asks = [[s["p"] + t * (i + 1), rnd.randint(50, 5000)] for i in range(10)]
                bids = [[s["p"] - t * i, rnd.randint(50, 5000)] for i in range(10)]
                HUB.publish({"type": "book", "code": code, "time": now, "asks": asks, "bids": bids,
                             "totalAsk": sum(a[1] for a in asks), "totalBid": sum(b[1] for b in bids)})


RT = None


# ---------------------------------------------------------------------------
# 계좌 동기화 — 모의 계좌·관심종목·설정을 파일 하나(krx_state.json)에 저장.
# 이 파일이 있는 폴더를 구글 드라이브·iCloud·원드라이브로 동기화하면 맥과 윈도우가 같은 계좌를 이어서 씀.
# 파일은 매번 다시 읽음 (다른 컴퓨터가 동기화로 바꿨을 수 있으므로). 앱키·시크릿은 절대 넣지 않음.
# ---------------------------------------------------------------------------
def _state_path():
    for i, a in enumerate(sys.argv):
        if a == "--state" and i + 1 < len(sys.argv):
            return os.path.abspath(os.path.expanduser(sys.argv[i + 1]))
    if os.environ.get("KRX_STATE"):
        return os.path.abspath(os.path.expanduser(os.environ["KRX_STATE"]))
    # 데모는 따로 저장 — 화면 확인용 가짜 거래가 실제 모의 계좌에 섞이지 않게
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "krx_state.demo.json" if DEMO else "krx_state.json")


STATE_FILE = _state_path()
STATE_LOCK = threading.Lock()


def state_read():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            d = json.load(f)
        return d if isinstance(d, dict) and "rev" in d else None
    except (OSError, ValueError):
        return None


def state_write(data, base, device):
    """base(화면이 마지막으로 받은 버전)가 파일의 현재 버전과 같을 때만 저장 — 다르면 충돌로 돌려줌"""
    with STATE_LOCK:
        cur = state_read()
        rev = cur["rev"] if cur else 0
        if cur and base != rev:
            return {"ok": False, "conflict": True, **cur}
        out = {"rev": rev + 1, "saved": int(time.time() * 1000), "device": device, "data": data}
        tmp = STATE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False)
        os.replace(tmp, STATE_FILE)
        state_backup(out)
        return {"ok": True, "rev": out["rev"], "saved": out["saved"]}


# 기록 백업 — 프로그램 폴더를 지워도 남도록 '문서/KRX_백업'에 하루 한 파일씩 (최근 60일만 남김)
#  설정·관심종목·모의 계좌·👍 표시·매매 규칙·일지·차트 그림만 들어 있음 (앱키·토큰·계좌번호 없음)
BACKUP_DIR = os.path.abspath(os.path.expanduser(os.environ.get("KRX_BACKUP") or os.path.join("~", "Documents", "KRX_백업")))


def state_backup(out):
    if DEMO:
        return
    try:
        os.makedirs(BACKUP_DIR, exist_ok=True)
        path = os.path.join(BACKUP_DIR, f"krx_state-{time.strftime('%Y%m%d')}.json")
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False)
        os.replace(tmp, path)
        olds = sorted(x for x in os.listdir(BACKUP_DIR) if x.startswith("krx_state-") and x.endswith(".json"))
        for x in olds[:-60]:
            os.remove(os.path.join(BACKUP_DIR, x))
    except OSError as e:
        print(f"[백업] 저장 실패: {e}")


# ---- 실계좌 주문 ----
#  계좌번호·서버·한도는 실행기(nh_bridge.py --ask --trade)에서만 정하고 환경변수로 받는다 — 화면(브라우저)에서는 못 바꿈
#  중계기를 켤 때마다 '정지' 상태로 시작, 화면에서 '주문 허용'을 켜야 주문을 받는다. 정지 중에도 취소·조회는 됨
#  한도: 1회 주문 금액 · 하루 합계(매수·매도) — 날짜별 누계는 사용자 폴더 파일에 남겨 중계기를 다시 켜도 이어짐
ACCT_NO = os.environ.get("NH_ACCT_NO", "")
TRADE_ENV = "demo" if DEMO and "--trade-test" in sys.argv else os.environ.get("NH_TRADE_ENV", "")
TRADE_REST = {"live": "https://api.nhplug.com:8443", "mock": "https://moapi.nhplug.com:8443"}.get(TRADE_ENV, "")
MAX_ORDER = int(os.environ.get("NH_MAX_ORDER", "1000000") or 0)
MAX_DAY = int(os.environ.get("NH_MAX_DAY", "3000000") or 0)
TRADE_DAY_FILE = os.path.join(os.path.expanduser("~"), ".nh_trade_day.json")
TRADE = {"armed": False, "log": [], "acct_ok": None, "acct_msg": "", "demo_no": 1000}
_trade_lock = threading.Lock()
TRADE_ENV_NAME = {"live": "실전", "mock": "모의투자", "demo": "데모(가짜)"}


def trade_available():
    return bool(TRADE_ENV in TRADE_ENV_NAME and (ACCT_NO or TRADE_ENV == "demo"))


def acct_mask():
    return f"*******{ACCT_NO[-4:]}" if ACCT_NO else "데모 계좌"


def _day_used():
    key = f"{TRADE_ENV}:{datetime.now(KST).strftime('%Y%m%d')}"
    try:
        with open(TRADE_DAY_FILE, encoding="utf-8") as f:
            return key, int(json.load(f).get(key, 0))
    except (OSError, ValueError):
        return key, 0


def _day_add(amount):
    key, used = _day_used()
    try:
        with open(TRADE_DAY_FILE, encoding="utf-8") as f:
            old = json.load(f)
    except (OSError, ValueError):
        old = {}
    keep = {k: v for k, v in old.items() if k.endswith(key[-8:])}   # 오늘 것만 남김 (서버별 누계는 따로)
    keep[key] = max(0, used + amount)
    try:
        with open(TRADE_DAY_FILE, "w", encoding="utf-8") as f:
            json.dump(keep, f)
    except OSError:
        pass
    return max(0, used + amount)


def nh_trade_post(path, payload, cts="", base=None, retry=True):
    """주문·계좌 조회용 — 토큰 거부(처리 전 단계)일 때만 한 번 다시 보내고, 그 밖의 오류·시간 초과는 절대 재전송하지 않음 (중복 주문 방지)"""
    _throttle()
    tok = access_token()
    headers = {"content-type": "application/json;charset=utf-8", "Authorization": "Bearer " + tok, "cts_flag": "Y" if cts else "N"}
    if cts:
        headers["cts"] = cts
    req = urllib.request.Request((base or TRADE_REST) + path, data=json.dumps(payload).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read())
            next_cts = res.headers.get("cts", "") if res.headers.get("cts_flag", "N") == "Y" else ""
    except urllib.error.HTTPError as err:
        body = err.read()[:300].decode("utf-8", "replace")
        if retry and "IGW4004" in body and token_invalidate(tok):
            return nh_trade_post(path, payload, cts, base, retry=False)
        raise RuntimeError(f"HTTP {err.code}: {body}")
    return data, next_cts


def _msg(data):
    m = data.get("message") or {}
    if isinstance(m, list):
        m = m[0] if m else {}
    return str(data.get("rsp_msg") or m.get("usr_msg") or "").strip(), str(data.get("rsp_cd") or m.get("msg_code") or "")


def _block(data, name="Output_0"):
    b = data.get(name)
    return (b[0] if b else {}) if isinstance(b, list) else (b or {})


def trade_check_acct():
    """입력한 계좌가 이 앱키의 계좌 목록에 있고, 종류(01·02 실전 / 03 모의)가 서버와 맞는지 확인"""
    if TRADE_ENV == "demo" or TRADE["acct_ok"] is not None:
        TRADE["acct_ok"] = True if TRADE_ENV == "demo" else TRADE["acct_ok"]
        return
    try:
        data, _ = nh_trade_post("/n2/acctinfo", {"Input_0": {}}, base=NH_REST)
    except Exception as err:   # 확인을 못 했으면 다음에 다시
        TRADE["acct_msg"] = f"계좌 확인 실패: {err}"
        return
    rows = data.get("Output_0") or []
    rows = [rows] if isinstance(rows, dict) else rows
    hit = [r for r in rows if str(r.get("acct_no", "")).replace("-", "") == ACCT_NO]
    want = ("03",) if TRADE_ENV == "mock" else ("01", "02")
    if not hit:
        TRADE["acct_ok"], TRADE["acct_msg"] = False, f"입력한 계좌({acct_mask()})가 이 앱키의 계좌 목록에 없습니다 — 실행기에서 계좌번호를 다시 입력하세요"
    elif str(hit[0].get("acct_type")) not in want:
        TRADE["acct_ok"], TRADE["acct_msg"] = False, f"이 계좌는 종류 {hit[0].get('acct_type')} 라서 {TRADE_ENV_NAME[TRADE_ENV]} 서버에서 쓸 수 없습니다 (01·02 실전, 03 모의)"
    else:
        TRADE["acct_ok"], TRADE["acct_msg"] = True, ""


def trade_status():
    if trade_available():
        trade_check_acct()
    _, used = _day_used()
    return {"available": trade_available(), "env": TRADE_ENV, "envName": TRADE_ENV_NAME.get(TRADE_ENV, ""), "acct": acct_mask() if trade_available() else "",
            "acctOk": TRADE["acct_ok"], "acctMsg": TRADE["acct_msg"], "armed": TRADE["armed"],
            "maxOrder": MAX_ORDER, "maxDay": MAX_DAY, "usedToday": used, "log": TRADE["log"][:30]}


def trade_log(kind, text):
    TRADE["log"].insert(0, {"at": time.time(), "kind": kind, "text": text})
    del TRADE["log"][100:]
    print(f"[{time.strftime('%H:%M:%S')}] [실계좌 {TRADE_ENV_NAME.get(TRADE_ENV, '')}] {text}")


def trade_order(req):
    side = "SELL" if req.get("side") == "SELL" else "BUY"
    typ = "MKT" if req.get("type") == "MKT" else "LMT"
    code = str(req.get("code", "")).strip()
    qty, price, ref = int(_num(req.get("qty"))), _num(req.get("price")), _num(req.get("ref"))
    if not trade_available():
        raise RuntimeError("실계좌 주문이 설정되지 않았습니다 — 실행기를 'python nh_bridge.py --ask --trade' 로 켜세요")
    if not (len(code) == 6 and code.isalnum()) or qty < 1:
        raise RuntimeError("종목코드 6자리와 1주 이상 수량이 필요합니다")
    if typ == "LMT" and price <= 0:
        raise RuntimeError("지정가가 필요합니다")
    if typ == "MKT" and ref <= 0:
        raise RuntimeError("시장가 주문은 현재가를 알아야 한도를 계산할 수 있습니다")
    with _trade_lock:
        if not TRADE["armed"]:
            raise RuntimeError("실계좌 주문이 정지 상태입니다 — 화면에서 '주문 허용'을 켜세요")
        trade_check_acct()
        if TRADE["acct_ok"] is not True:
            raise RuntimeError(TRADE["acct_msg"] or "계좌 확인이 아직 안 됐습니다")
        est = price if typ == "LMT" else ref * 1.3   # 시장가는 상한가(+30%)까지 체결될 수 있다고 보고 계산
        amount = int(qty * est)
        if amount > MAX_ORDER:
            raise RuntimeError(f"1회 한도 초과 — 주문 {amount:,}원 > 한도 {MAX_ORDER:,}원")
        _, used = _day_used()
        if used + amount > MAX_DAY:
            raise RuntimeError(f"하루 한도 초과 — 오늘 {used:,}원 + 이번 {amount:,}원 > 한도 {MAX_DAY:,}원")
        _day_add(amount)   # 보내기 전에 먼저 차감 — 응답이 끊겨도 한도가 새지 않게
        what = f"{code} {'매수' if side == 'BUY' else '매도'} {qty:,}주 {'시장가' if typ == 'MKT' else f'지정가 {int(price):,}원'}"
        if TRADE_ENV == "demo":
            TRADE["demo_no"] += 1
            trade_log("order", f"주문 접수 #{TRADE['demo_no']} — {what}")
            return {"ok": True, "orderNo": TRADE["demo_no"], "msg": "데모 주문 접수", "amount": amount, "usedToday": used + amount}
        inp = {"act_no": ACCT_NO, "iem_cd": code, "orr_qty": qty, "nmn_pr_tp_cd": "05" if typ == "MKT" else "01",
               "orr_cnd_dit_cd": "00", "ssl_nmn_pr_dit_cd": "00", "rmt_mkt_cd": "KRX", "sor_mkt_sli_yn": "N"}
        if typ == "LMT":
            inp["orr_pr"] = int(price)
        try:
            data, _ = nh_trade_post("/krstock/order/v1/cashBuy" if side == "BUY" else "/krstock/order/v1/cashSell", {"Input_0": inp})
        except RuntimeError as err:   # 증권사가 HTTP 오류로 거부
            if "HTTP 4" in str(err):
                _day_add(-amount)
            trade_log("error", f"주문 실패 — {what}: {err}")
            raise
        except Exception as err:   # 시간 초과·연결 끊김 — 들어갔는지 모름
            trade_log("error", f"응답 없음 — {what}: {err}")
            raise RuntimeError("증권사 응답을 받지 못했습니다. 주문이 들어갔을 수 있으니 '실계좌 주문내역'을 꼭 확인하세요 (자동 재전송하지 않음)")
        out, (msg, cd) = _block(data), _msg(data)
        no = int(_num(out.get("mkt_orr_no") or out.get("anw_cld_mkt_orr_no1")))
        if no <= 0:
            _day_add(-amount)
            trade_log("error", f"주문 거부 — {what}: {msg} ({cd})")
            raise RuntimeError(f"주문 거부: {msg or '응답에 주문번호가 없습니다'} ({cd})")
        trade_log("order", f"주문 접수 #{no} — {what} · {msg}")
        return {"ok": True, "orderNo": no, "msg": msg, "amount": amount, "usedToday": used + amount}


def trade_cancel(req):
    code, no = str(req.get("code", "")).strip(), int(_num(req.get("orderNo")))
    if not trade_available() or not (len(code) == 6 and code.isalnum()) or no <= 0:
        raise RuntimeError("취소할 주문번호와 종목코드가 필요합니다")
    if TRADE_ENV == "demo":
        trade_log("cancel", f"취소 #{no} ({code})")
        return {"ok": True, "orderNo": no}
    data, _ = nh_trade_post("/krstock/order/v1/cancel", {"Input_0": {"act_no": ACCT_NO, "org_mkt_orr_no": no, "all_pat_dit_cd": "1", "iem_cd": code}})
    out, (msg, cd) = _block(data), _msg(data)
    if int(_num(out.get("mkt_orr_no"))) <= 0:
        trade_log("error", f"취소 거부 #{no}: {msg} ({cd})")
        raise RuntimeError(f"취소 거부: {msg or '응답에 주문번호가 없습니다'} ({cd})")
    trade_log("cancel", f"취소 접수 #{no} ({code}) · {msg}")
    return {"ok": True, "orderNo": int(_num(out.get("mkt_orr_no"))), "msg": msg}


def trade_balance():
    if not trade_available():
        raise RuntimeError("실계좌 주문이 설정되지 않았습니다")
    if TRADE_ENV == "demo":
        return {"cash": 10_000_000, "orderable": 10_000_000, "total": 0, "pnl": 0, "rate": 0, "holdings": []}
    inp = {"act_no": ACCT_NO, "bnc_bse_cd": "1", "ltg_aot_dit_cd": "1", "aet_bse": "1", "qut_dit_cd": "UNT", "aly_qut_cd": "1"}
    head, rows, cts = None, [], ""
    for _ in range(5):
        data, cts = nh_trade_post("/krstock/inquiry/v1/balance", {"Input_0": inp}, cts)
        head = head or _block(data)
        rows += data.get("Output_1") or []
        if not cts:
            break
    h = head or {}
    return {"cash": _num(h.get("dca")), "orderable": _num(h.get("orr_pbl_amt4") or h.get("dca")), "total": _num(h.get("tot_eal_amt")),
            "pnl": _num(h.get("tot_eal_pls")), "rate": _num(h.get("pft_rt")),
            "holdings": [{"code": str(r.get("iem_cd", ""))[-6:], "name": r.get("iem_nm", ""), "qty": _num(r.get("itg_bnc_qty")), "avg": _num(r.get("phs_pr")),
                          "price": _num(r.get("now_pr")), "eval": _num(r.get("eal_amt")), "pnl": _num(r.get("eal_pls_amt")), "rate": _num(r.get("pft_rt"))}
                         for r in rows if _num(r.get("itg_bnc_qty")) > 0]}


def trade_orders():
    if not trade_available():
        raise RuntimeError("실계좌 주문이 설정되지 않았습니다")
    if TRADE_ENV == "demo":
        return {"items": []}
    inp = {"orr_dt": datetime.now(KST).strftime("%Y%m%d"), "act_no": ACCT_NO, "orr_mkt_cd": "00", "ost_cns_dit": "0"}
    rows, cts = [], ""
    for _ in range(5):
        data, cts = nh_trade_post("/krstock/inquiry/v1/dailyOrderExecution", {"Input_0": inp}, cts)
        b = data.get("Output_0") or []
        rows += [b] if isinstance(b, dict) else b
        if not cts:
            break
    return {"items": [{"no": int(_num(r.get("itg_orr_no"))), "code": str(r.get("iem_cd", ""))[-6:], "name": r.get("iem_nm", ""), "side": r.get("sby_dit_cd_nm", ""),
                       "type": r.get("nmn_pr_tp_cd_nm", ""), "qty": _num(r.get("orr_qty")), "price": _num(r.get("orr_pr")), "filled": _num(r.get("tot_cns_qty")),
                       "avg": _num(r.get("cns_avg_uit_pr")), "open": _num(r.get("ny_cns_qty")), "canceled": _num(r.get("can_qty")), "reject": r.get("orr_rjt_rsn_cd_nm", "")}
                      for r in rows]}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        origin = self.headers.get("Origin")
        if origin_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin or "null")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Bridge-Token")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Vary", "Origin")

    def _json(self, status, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _guard(self):
        if not origin_allowed(self.headers.get("Origin")):
            self._json(403, {"error": "origin not allowed"})
            return False
        if not hmac.compare_digest(self.headers.get("X-Bridge-Token", ""), TOKEN):
            self._json(401, {"error": "중계기 토큰이 맞지 않습니다"})
            return False
        return True

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path not in ("/health", "/rt/stream"):
            return self._json(404, {"error": "not found"})
        if not self._guard():
            return
        if self.path == "/rt/stream":
            return self._stream()
        now = datetime.now(KST)
        self._json(200, {"ok": True, "demo": DEMO, "keys": bool(APPKEY and APPSECRET), "chart": True, "rt": True, "sync": (not DEMO) or "--state" in sys.argv, "master": True, "research": True, "market": True, "topnews": True, "notify": True, "tgcmd": True, "ai": ai_available(), "stateFile": STATE_FILE, "backupDir": "" if DEMO else BACKUP_DIR, "trade": trade_available(),
                         "kst": now.strftime("%Y-%m-%d %H:%M:%S")})

    def _stream(self):
        # 실시간 체결·호가를 한 줄씩(JSON) 계속 내려보냄 — 화면이 끊으면 종료
        q = HUB.add()
        try:
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            while True:
                try:
                    line = "data: " + q.get(timeout=15) + "\n\n"
                except queue.Empty:
                    line = ": keepalive\n\n"
                self.wfile.write(line.encode())
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass
        finally:
            HUB.remove(q)

    def do_POST(self):
        if self.path not in ("/krx/daily", "/krx/chart", "/krx/components", "/rt/subscribe", "/state/get", "/state/put", "/krx/master", "/krx/sectors", "/news", "/news/top", "/notify/telegram", "/notify/telegram_chat", "/notify/tg_start", "/notify/tg_stop", "/market/quotes", "/market/index", "/ai/brief", "/ai/test", "/ai/ask", "/ai/stt", "/ai/tts",
                             "/trade/status", "/trade/arm", "/trade/order", "/trade/cancel", "/trade/balance", "/trade/orders"):
            return self._json(404, {"error": "not found"})
        if not self._guard():
            return
        try:
            req = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
        except ValueError:
            return self._json(400, {"error": "bad request"})
        try:
            if self.path.startswith("/trade/"):
                if self.path == "/trade/arm":
                    on = req.get("on") is True
                    if on:
                        if not trade_available():
                            return self._json(400, {"error": "실계좌 주문이 설정되지 않았습니다 — 실행기를 'python nh_bridge.py --ask --trade' 로 켜세요"})
                        trade_check_acct()
                        if TRADE["acct_ok"] is not True:
                            return self._json(400, {"error": TRADE["acct_msg"] or "계좌 확인이 아직 안 됐습니다"})
                    if TRADE["armed"] != on:
                        TRADE["armed"] = on
                        trade_log("arm", "주문 허용 켜짐" if on else "주문 정지 (비상 정지)")
                    return self._json(200, trade_status())
                fn = {"/trade/status": lambda: trade_status(), "/trade/order": lambda: trade_order(req), "/trade/cancel": lambda: trade_cancel(req),
                      "/trade/balance": trade_balance, "/trade/orders": trade_orders}[self.path]
                return self._json(200, fn())
            if self.path in ("/ai/brief", "/ai/test", "/ai/ask", "/ai/stt", "/ai/tts"):
                # 화면 설정에서 보낸 키는 이 요청에만 쓰고 저장·출력하지 않음
                provider = "gemini" if req.get("provider") == "gemini" else "claude"
                key, model = str(req.get("key") or "").strip(), str(req.get("model") or "").strip()[:80]
                if self.path == "/ai/tts":
                    if provider != "gemini":
                        return self._json(400, {"error": "Gemini 음성은 Gemini 를 쓸 때만 됩니다"})
                    t0 = time.time()
                    out = gemini_tts(str(req.get("text") or ""), key, str(req.get("ttsModel") or "")[:80], str(req.get("voice") or "Kore")[:30])
                    print(f"[{time.strftime('%H:%M:%S')}] 음성 합성 {time.time() - t0:.1f}초 ({out['model']}, {out['rate']}Hz)")
                    return self._json(200, out)
                if self.path == "/ai/stt":
                    audio, mime = str(req.get("audio") or ""), str(req.get("mime") or "audio/webm").split(";")[0]
                    if provider != "gemini":
                        return self._json(400, {"error": "음성 받아쓰기는 Gemini 를 쓸 때만 됩니다 (설정 → AI 분석)"})
                    if not audio or len(audio) > 8_000_000:
                        return self._json(400, {"error": "녹음이 비었거나 너무 깁니다"})
                    t0 = time.time()
                    stt_model = str(req.get("sttModel") or "").strip()[:80] or model
                    stt_parts = lambda: [{"inline_data": {"mime_type": mime, "data": audio}},
                                         {"text": "이 녹음의 말을 한국어로 정확히 받아 적어라. 받아 적은 문장만 출력하고, 말소리가 없으면 빈 줄만 출력한다."
                                          + (" 자주 나오는 종목명·용어(발음이 비슷하면 이 표기로): " + str(req.get("hint"))[:600] if req.get("hint") else "")}]
                    note = ""
                    try:
                        text, used, _ = _ask_gemini("너는 받아쓰기 도구다.", "", key, stt_model, 1000, None, stt_parts(), fast=True)
                    except RuntimeError as err:
                        if not model or stt_model == model:
                            raise
                        text, used, note = "", stt_model, str(err)
                    # 고른 받아쓰기 모델이 실패하거나 빈 결과면 대화 모델로 한 번 더
                    if not text.strip() and model and stt_model != model:
                        note = note or f"{stt_model} 이 빈 결과를 돌려줌"
                        text, used, _ = _ask_gemini("너는 받아쓰기 도구다.", "", key, model, 1000, None, stt_parts(), fast=True)
                    print(f"[{time.strftime('%H:%M:%S')}] 받아쓰기 {time.time() - t0:.1f}초 ({used}, 녹음 {len(audio) * 3 // 4 // 1024}KB){' — ' + note if note else ''}")
                    return self._json(200, {"text": text.strip(), "model": used, "fallback": note})
                if self.path == "/ai/ask":
                    facts = req.get("facts")
                    if not isinstance(facts, dict):
                        return self._json(400, {"error": "facts 가 필요합니다"})
                    hist = req.get("history") if isinstance(req.get("history"), list) else None
                    return self._json(200, ai_ask(str(req.get("purpose") or ""), facts, str(req.get("question") or "")[:500], provider, key, model, hist, bool(req.get("fast"))))
                if self.path == "/ai/test":
                    if req.get("list"):
                        return self._json(200, {"models": gemini_models(key) if provider == "gemini" else []})
                    return self._json(200, ai_test(provider, key, model))
                facts = req.get("facts")
                if not isinstance(facts, dict):
                    return self._json(400, {"error": "facts 가 필요합니다"})
                return self._json(200, ai_brief(facts, bool(req.get("force")), provider, key, model))
            if self.path == "/krx/sectors":
                m = krx_sectors(bool(req.get("force")))
                return self._json(200, {"at": m.get("at", 0), "items": m["items"]})
            if self.path == "/news":
                q = str(req.get("q", "")).strip()[:120]
                if not q:
                    return self._json(400, {"error": "검색어가 필요합니다"})
                return self._json(200, {"q": q, "items": news_search(q, max(1, min(100, int(req.get("n", 20)))))})
            if self.path == "/notify/tg_start":
                return self._json(200, tg_start(req.get("token", ""), req.get("chat", "")))
            if self.path == "/notify/tg_stop":
                return self._json(200, tg_stop())
            if self.path == "/notify/telegram":
                return self._json(200, telegram_send(req.get("token", ""), req.get("chat", ""), req.get("text", "")))
            if self.path == "/notify/telegram_chat":
                return self._json(200, telegram_chat(req.get("token", "")))
            if self.path == "/news/top":
                return self._json(200, {"items": news_top(str(req.get("kind", "BUSINESS")))})
            if self.path == "/market/quotes":
                return self._json(200, market_quotes())
            if self.path == "/market/index":
                return self._json(200, market_index(str(req.get("sym", "")), str(req.get("range", "10y"))))
            if self.path == "/krx/master":
                m = krx_master(bool(req.get("force")))
                return self._json(200, {"at": m.get("at", 0), "items": m["items"]})
            if self.path == "/state/get":
                cur = state_read()
                if not cur:
                    return self._json(200, {"exists": False, "rev": 0})
                if req.get("since") == cur["rev"]:   # 바뀐 게 없으면 내용은 생략
                    return self._json(200, {"exists": True, "rev": cur["rev"], "saved": cur.get("saved"), "device": cur.get("device")})
                return self._json(200, {"exists": True, **cur})
            if self.path == "/state/put":
                data = req.get("data")
                if not isinstance(data, dict):
                    return self._json(400, {"error": "data 가 필요합니다"})
                r = state_write(data, req.get("base"), str(req.get("device") or "")[:40])
                if r.get("ok"):
                    print(f"[{time.strftime('%H:%M:%S')}] 계좌 저장 v{r['rev']} ({req.get('device') or '?'})")
                return self._json(200, r)
            if self.path == "/rt/subscribe":
                codes = [str(c) for c in req.get("codes", []) if len(str(c)) == 6 and str(c).isalnum()][:30]   # 나무 상한: 체결 등록 30종목
                book = str(req.get("book") or "")
                book = book if len(book) == 6 and book.isalnum() else None
                return self._json(200, {"ok": True, "subscribed": RT.set_targets(codes, book)})
            if self.path == "/krx/daily":
                code = str(req.get("code", "")).strip()
                count = max(1, min(20000, int(req.get("count", 600))))
                if not (len(code) == 6 and code.isalnum()):
                    return self._json(400, {"error": "종목코드는 6자리"})
                out = demo_daily(code, count) if DEMO else nh_daily(code, count)
            elif self.path == "/krx/chart":
                code, tf = str(req.get("code", "")).strip(), str(req.get("tf", "")).strip()
                count = max(1, min(20000, int(req.get("count", 600))))
                if not (len(code) == 6 and code.isalnum()) or tf not in TF_ALL:
                    return self._json(400, {"error": "종목코드 6자리와 봉 주기(1·3·5·10·15·30·60·D·W·M)가 필요합니다"})
                if tf == "D":
                    out = demo_daily(code, count) if DEMO else nh_daily(code, count)
                else:
                    out = demo_chart(code, tf, count) if DEMO else nh_chart(code, tf, count)
            else:
                etf = str(req.get("etf", "")).strip()
                if DEMO:
                    out = {"etf": etf, "demo": True, "items": [{"code": c, "name": n} for c, n in DEMO_SETS.get(etf, [])]}
                else:
                    out = {"etf": etf, "items": nh_components(etf)}
        except Exception as err:  # 증권사 오류는 화면에 그대로 보여줌
            print(f"[{time.strftime('%H:%M:%S')}] 오류 {self.path}: {err}")
            return self._json(502, {"error": str(err)})
        print(f"[{time.strftime('%H:%M:%S')}] {self.path} {req.get('code') or req.get('etf')} {req.get('tf', '')} -> OK")
        self._json(200, out)

    def log_message(self, fmt, *args):
        pass


class ExclusiveServer(ThreadingHTTPServer):
    # 윈도우에서는 주소 재사용을 켜면 두 중계기가 같은 포트를 동시에 열 수 있음 → 단독 사용으로 막음
    allow_reuse_address = False

    def server_bind(self):
        import socket
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def hidden_input(prompt):
    """콘솔 에코를 끈 채 한 줄 입력 — 내장 터미널(ConPTY)에서도 동작하도록 표준입력으로 읽음"""
    print(prompt, end="", flush=True)
    if os.name == "nt":
        import ctypes
        import ctypes.wintypes
        k32 = ctypes.windll.kernel32
        handle = k32.GetStdHandle(-10)
        mode = ctypes.wintypes.DWORD()
        if k32.GetConsoleMode(handle, ctypes.byref(mode)):
            k32.SetConsoleMode(handle, mode.value & ~0x0004)  # ENABLE_ECHO_INPUT 끔
            try:
                line = sys.stdin.readline()
            finally:
                k32.SetConsoleMode(handle, mode.value)
                print()
            return line.strip()
    import getpass
    return getpass.getpass("").strip()


def main():
    global APPKEY, APPSECRET
    if not DEMO and not (APPKEY and APPSECRET) and "--ask" in sys.argv:
        # 환경변수 대신 실행할 때 직접 입력 (입력 글자는 화면에 표시되지 않음, 파일에 저장하지 않음)
        APPKEY = APPKEY or hidden_input("나무 PLUG 앱키 붙여넣고 Enter (화면에 안 보임): ")
        print(f"  → 앱키 입력됨 ({len(APPKEY)}자)", flush=True)
        APPSECRET = APPSECRET or hidden_input("나무 PLUG 앱시크릿 붙여넣고 Enter (화면에 안 보임): ")
        print(f"  → 앱시크릿 입력됨 ({len(APPSECRET)}자)", flush=True)
    if not DEMO and not (APPKEY and APPSECRET):
        print("환경변수 NH_APPKEY / NH_APPSECRET 를 먼저 설정하세요. (키 없이 화면만 보려면: python nh_bridge.py --demo)")
        sys.exit(1)
    try:
        server = ExclusiveServer((HOST, PORT), Handler)
    except OSError:
        print(f"포트 {PORT}을(를) 이미 다른 프로그램(이전 중계기 등)이 쓰고 있습니다. 그 창을 닫거나 Ctrl+C로 종료한 뒤 다시 실행하세요.")
        sys.exit(1)
    global RT
    RT = DemoRealtime() if DEMO else Realtime()
    RT.start()
    print(f"나무 PLUG 중계기 실행 중: http://{HOST}:{PORT}  {'[데모 모드 — 가짜 시세]' if DEMO else '[실제 시세]'}  · 실시간 체결·호가 포함")
    print(f"중계기 토큰 (화면의 '중계기 연결'에 입력): {TOKEN}")
    print(f"계좌 동기화 파일: {STATE_FILE}")
    if not DEMO:
        print(f"기록 백업 폴더: {BACKUP_DIR} (하루 한 파일 · 60일 보관)")
    if trade_available():
        print(f"실계좌 주문: {TRADE_ENV_NAME[TRADE_ENV]} · 계좌 {acct_mask()} · 1회 {MAX_ORDER:,}원 · 하루 {MAX_DAY:,}원 — 지금은 '정지' 상태 (화면에서 주문 허용을 켜야 주문 가능)")
    print("종료: Ctrl+C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
