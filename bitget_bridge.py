"""
Bitget USDT-M 로컬 브릿지 — BB200 HTML 화면이 실계좌를 조회·주문할 때 사용.

- API 키는 이 PC의 환경변수에만 두고, 브라우저에는 전달하지 않는다.
- 127.0.0.1 에서만 열리며, 실행 시 출력되는 토큰이 있어야 요청을 처리한다.
- 화면에서 쓰는 선물 엔드포인트만 허용한다 (출금 등은 차단).

실행 (PowerShell):
    $env:BITGET_API_KEY="..."; $env:BITGET_API_SECRET="..."; $env:BITGET_API_PASSPHRASE="..."
    python bitget_bridge.py
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = int(os.environ.get("BRIDGE_PORT", "8765"))
BITGET_REST = "https://api.bitget.com"

API_KEY = os.environ.get("BITGET_API_KEY", "")
API_SECRET = os.environ.get("BITGET_API_SECRET", "")
API_PASSPHRASE = os.environ.get("BITGET_API_PASSPHRASE", "")
TOKEN = os.environ.get("BRIDGE_TOKEN") or secrets.token_urlsafe(18)

ALLOWED = {
    ("GET", "/api/v2/mix/account/account"),
    ("POST", "/api/v2/mix/account/set-leverage"),
    ("GET", "/api/v2/mix/position/single-position"),
    ("POST", "/api/v2/mix/order/place-order"),
    ("POST", "/api/v2/mix/order/close-positions"),
}


def origin_allowed(origin):
    # file:// 로 연 HTML은 Origin이 "null"; 그 외에는 localhost 계열만 허용
    if origin is None or origin == "null":
        return True
    return origin.startswith(("http://localhost", "http://127.0.0.1", "https://localhost"))


def sign(timestamp, method, request_path, body):
    msg = f"{timestamp}{method}{request_path}{body}".encode()
    digest = hmac.new(API_SECRET.encode(), msg, hashlib.sha256).digest()
    return base64.b64encode(digest).decode()


def forward(method, path, query, body):
    request_path = f"{path}?{query}" if query else path
    ts = str(int(time.time() * 1000))
    headers = {
        "ACCESS-KEY": API_KEY,
        "ACCESS-SIGN": sign(ts, method, request_path, body),
        "ACCESS-TIMESTAMP": ts,
        "ACCESS-PASSPHRASE": API_PASSPHRASE,
        "Content-Type": "application/json",
        "locale": "en-US",
    }
    req = urllib.request.Request(
        BITGET_REST + request_path,
        data=body.encode() if method == "POST" else None,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status, res.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        origin = self.headers.get("Origin")
        if origin_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin or "null")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Bridge-Token")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Vary", "Origin")

    def _json(self, status, payload):
        raw = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != "/bitget":
            return self._json(404, {"error": "not found"})
        if not origin_allowed(self.headers.get("Origin")):
            return self._json(403, {"error": "origin not allowed"})
        if not hmac.compare_digest(self.headers.get("X-Bridge-Token", ""), TOKEN):
            return self._json(401, {"error": "invalid bridge token"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            req = json.loads(self.rfile.read(length) or b"{}")
            method = str(req.get("method", "")).upper()
            path = str(req.get("path", ""))
            query = str(req.get("query", ""))
            body = str(req.get("body", "")) if method == "POST" else ""
        except (ValueError, TypeError):
            return self._json(400, {"error": "bad request"})
        if (method, path) not in ALLOWED:
            return self._json(403, {"error": f"endpoint not allowed: {method} {path}"})

        status, raw = forward(method, path, query, body)
        tag = "ORDER" if path.endswith(("place-order", "close-positions", "set-leverage")) else "read"
        print(f"[{time.strftime('%H:%M:%S')}] {tag} {method} {path} -> {status}")
        self._json(status, raw)

    def log_message(self, fmt, *args):
        pass


def main():
    if not (API_KEY and API_SECRET and API_PASSPHRASE):
        print("환경변수 BITGET_API_KEY / BITGET_API_SECRET / BITGET_API_PASSPHRASE 를 먼저 설정하세요.")
        sys.exit(1)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Bitget 브릿지 실행 중: http://{HOST}:{PORT}")
    print(f"브릿지 토큰 (HTML의 'API 연결' 창에 입력): {TOKEN}")
    print("종료: Ctrl+C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
