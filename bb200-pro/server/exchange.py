"""
BB200 Pro — Bitget 거래소 연동 모듈 (ccxt 기반)
"""
from __future__ import annotations

import logging
from typing import Optional

import ccxt.async_support as ccxt

from .config import get_settings, Settings

logger = logging.getLogger("bb200pro.exchange")


class ExchangeClient:
    """
    Bitget USDT-M 무기한 선물 거래소 클라이언트
    ccxt 라이브러리를 사용하여 거래소 API와 통신합니다.
    """

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()
        self.exchange: ccxt.bitget | None = None
        self._initialized = False

    async def initialize(self):
        """거래소 클라이언트 초기화"""
        if self._initialized:
            return

        config = {
            "enableRateLimit": True,
            "options": {
                "defaultType": "swap",  # 무기한 선물
                "defaultSubType": "linear",  # USDT-M (linear)
            },
        }

        # Live 모드일 때만 API 키 설정
        if self.settings.is_live:
            if not self.settings.bitget_api_key:
                raise ValueError("Live 모드에는 Bitget API 키가 필요합니다. .env 파일을 확인하세요.")
            config.update({
                "apiKey": self.settings.bitget_api_key,
                "secret": self.settings.bitget_api_secret,
                "password": self.settings.bitget_api_passphrase,
            })

        self.exchange = ccxt.bitget(config)
        self._initialized = True
        logger.info(f"✅ Bitget 거래소 클라이언트 초기화 완료 (모드: {self.settings.trading_mode.value})")

    async def close(self):
        """거래소 연결 종료"""
        if self.exchange:
            await self.exchange.close()
            self._initialized = False
            logger.info("Bitget 거래소 연결 종료")

    # ── 시세 데이터 조회 ──

    async def fetch_ohlcv(
        self, symbol: str | None = None, timeframe: str = "5m", limit: int = 300
    ) -> list[dict]:
        """
        캔들(OHLCV) 데이터 조회

        Returns:
            list of dict: [{timestamp_ms, open, high, low, close, volume}, ...]
        """
        await self.initialize()
        sym = symbol or self.settings.symbol

        try:
            raw = await self.exchange.fetch_ohlcv(sym, timeframe, limit=limit)
            bars = []
            for row in raw:
                bars.append({
                    "timestamp_ms": int(row[0]),
                    "open": float(row[1]),
                    "high": float(row[2]),
                    "low": float(row[3]),
                    "close": float(row[4]),
                    "volume": float(row[5]),
                })
            logger.debug(f"📊 {sym} {timeframe} 캔들 {len(bars)}개 수신")
            return bars
        except ccxt.NetworkError as e:
            logger.error(f"네트워크 오류: {e}")
            raise
        except ccxt.ExchangeError as e:
            logger.error(f"거래소 오류: {e}")
            raise

    async def fetch_ticker(self, symbol: str | None = None) -> dict:
        """현재 시세 조회"""
        await self.initialize()
        sym = symbol or self.settings.symbol

        try:
            ticker = await self.exchange.fetch_ticker(sym)
            return {
                "symbol": sym,
                "last": ticker["last"],
                "bid": ticker["bid"],
                "ask": ticker["ask"],
                "high_24h": ticker["high"],
                "low_24h": ticker["low"],
                "volume_24h": ticker.get("baseVolume", 0),
                "change_pct_24h": ticker.get("percentage", 0),
                "timestamp": ticker.get("timestamp", 0),
            }
        except Exception as e:
            logger.error(f"시세 조회 실패: {e}")
            raise

    # ── 계좌 정보 ──

    async def fetch_balance(self) -> dict:
        """USDT 잔고 조회"""
        await self.initialize()
        if not self.settings.is_live:
            return {"total": 0, "free": 0, "used": 0}

        try:
            balance = await self.exchange.fetch_balance()
            usdt = balance.get("USDT", {})
            return {
                "total": float(usdt.get("total", 0)),
                "free": float(usdt.get("free", 0)),
                "used": float(usdt.get("used", 0)),
            }
        except Exception as e:
            logger.error(f"잔고 조회 실패: {e}")
            raise

    async def fetch_positions(self, symbol: str | None = None) -> list[dict]:
        """현재 보유 포지션 조회"""
        await self.initialize()
        if not self.settings.is_live:
            return []

        try:
            sym = symbol or self.settings.symbol
            positions = await self.exchange.fetch_positions([sym])
            result = []
            for pos in positions:
                if abs(float(pos.get("contracts", 0))) > 0:
                    result.append({
                        "symbol": pos["symbol"],
                        "side": "LONG" if pos["side"] == "long" else "SHORT",
                        "contracts": float(pos["contracts"]),
                        "entry_price": float(pos.get("entryPrice", 0)),
                        "unrealized_pnl": float(pos.get("unrealizedPnl", 0)),
                        "leverage": int(pos.get("leverage", self.settings.leverage)),
                        "liquidation_price": float(pos.get("liquidationPrice", 0)),
                    })
            return result
        except Exception as e:
            logger.error(f"포지션 조회 실패: {e}")
            raise

    # ── 주문 실행 ──

    async def set_leverage(self, symbol: str | None = None, leverage: int | None = None):
        """레버리지 설정"""
        await self.initialize()
        if not self.settings.is_live:
            return

        sym = symbol or self.settings.symbol
        lev = leverage or self.settings.leverage

        try:
            await self.exchange.set_leverage(lev, sym)
            logger.info(f"⚙️ {sym} 레버리지 {lev}x 설정 완료")
        except Exception as e:
            logger.warning(f"레버리지 설정 실패 (이미 설정되어 있을 수 있음): {e}")

    async def place_market_order(
        self, symbol: str, side: str, amount: float, reduce_only: bool = False
    ) -> dict:
        """
        시장가 주문 실행

        Args:
            symbol: 거래 심볼 (예: BTC/USDT:USDT)
            side: 'buy' 또는 'sell'
            amount: 계약 수량
            reduce_only: 청산 전용 주문 여부

        Returns:
            주문 결과 dict
        """
        await self.initialize()
        if not self.settings.is_live:
            raise RuntimeError("Paper 모드에서는 실제 주문을 실행할 수 없습니다.")

        try:
            params = {}
            if reduce_only:
                params["reduceOnly"] = True

            order = await self.exchange.create_market_order(
                symbol=symbol,
                side=side,
                amount=amount,
                params=params,
            )

            result = {
                "id": order.get("id"),
                "symbol": symbol,
                "side": side,
                "amount": float(order.get("filled", amount)),
                "price": float(order.get("average", 0)),
                "cost": float(order.get("cost", 0)),
                "fee": order.get("fee", {}),
                "status": order.get("status"),
                "timestamp": order.get("timestamp"),
            }

            logger.info(
                f"✅ 주문 체결: {side.upper()} {amount} {symbol} "
                f"@ {result['price']:,.1f} USDT"
            )
            return result

        except ccxt.InsufficientFunds as e:
            logger.error(f"❌ 잔고 부족: {e}")
            raise
        except ccxt.InvalidOrder as e:
            logger.error(f"❌ 잘못된 주문: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ 주문 실행 실패: {e}")
            raise

    async def close_position(self, symbol: str | None = None) -> dict | None:
        """
        현재 보유 포지션 전량 시장가 청산

        Returns:
            청산 주문 결과 또는 None (보유 포지션 없을 경우)
        """
        await self.initialize()
        sym = symbol or self.settings.symbol

        positions = await self.fetch_positions(sym)
        if not positions:
            logger.info(f"청산할 포지션 없음: {sym}")
            return None

        pos = positions[0]
        close_side = "sell" if pos["side"] == "LONG" else "buy"

        return await self.place_market_order(
            symbol=sym,
            side=close_side,
            amount=pos["contracts"],
            reduce_only=True,
        )

    # ── 유틸리티 ──

    async def get_min_order_amount(self, symbol: str | None = None) -> float:
        """최소 주문 수량 조회"""
        await self.initialize()
        sym = symbol or self.settings.symbol

        try:
            markets = await self.exchange.load_markets()
            market = markets.get(sym, {})
            limits = market.get("limits", {}).get("amount", {})
            return float(limits.get("min", 0.001))
        except Exception:
            return 0.001  # BTC 기본값

    async def calc_order_amount(self, symbol: str, side: str, size_usdt: float, price: float) -> float:
        """
        USDT 금액 기준으로 주문 수량 계산

        Args:
            symbol: 거래 심볼
            side: 'buy' or 'sell'
            size_usdt: 투입할 USDT 금액
            price: 현재 가격

        Returns:
            주문 수량 (contracts)
        """
        if price <= 0:
            raise ValueError(f"유효하지 않은 가격: {price}")

        # 레버리지 반영 실제 포지션 규모
        notional = size_usdt * self.settings.leverage
        amount = notional / price

        # 최소 주문 수량 체크
        min_amount = await self.get_min_order_amount(symbol)
        if amount < min_amount:
            logger.warning(
                f"주문 수량({amount:.6f})이 최소 수량({min_amount})보다 작습니다. "
                f"최소 수량으로 조정합니다."
            )
            amount = min_amount

        return round(amount, 6)
