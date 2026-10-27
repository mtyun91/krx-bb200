"""
BB200 Pro — 설정 관리 모듈
.env 파일에서 모든 설정을 로드합니다.
"""
from __future__ import annotations

import os
from pathlib import Path
from enum import Enum
from pydantic_settings import BaseSettings
from pydantic import Field


class TradingMode(str, Enum):
    PAPER = "PAPER"
    LIVE = "LIVE"


class Settings(BaseSettings):
    """전체 시스템 설정 — .env 파일에서 자동 로드"""

    # ── Bitget API ──
    bitget_api_key: str = Field(default="", description="Bitget API Key")
    bitget_api_secret: str = Field(default="", description="Bitget API Secret")
    bitget_api_passphrase: str = Field(default="", description="Bitget API Passphrase")

    # ── 거래 모드 ──
    trading_mode: TradingMode = Field(default=TradingMode.PAPER, description="PAPER 또는 LIVE")

    # ── 종목 ──
    symbol: str = Field(default="BTC/USDT:USDT", description="ccxt 형식 심볼")

    # ── 레버리지 / 리스크 ──
    leverage: int = Field(default=5, ge=1, le=50)
    max_position_size_usdt: float = Field(default=1000.0, description="최대 포지션 크기 (USDT)")
    max_daily_loss_pct: float = Field(default=3.0, description="일일 최대 손실 한도 (%)")
    max_trades_per_day: int = Field(default=10, description="일일 최대 거래 횟수")
    initial_paper_balance: float = Field(default=10000.0, description="모의투자 초기 잔고 (USDT)")

    # ── 전략 파라미터 ──
    bb_period: int = Field(default=200, ge=20, le=500)
    bb_std: float = Field(default=2.0, ge=1.0, le=4.0)
    target_move_pct: float = Field(default=1.8, description="목표 익절 폭 (%)")
    trailing_stop_pct: float = Field(default=0.7, description="트레일링 스탑 (%)")
    cooldown_bars: int = Field(default=6, description="시퀀스 간 쿨다운 봉 수")

    # ── 수수료 ──
    taker_fee_pct: float = Field(default=0.06)
    maker_fee_pct: float = Field(default=0.02)
    funding_rate_pct: float = Field(default=0.01)

    # ── 텔레그램 ──
    telegram_bot_token: str = Field(default="", description="Telegram Bot Token")
    telegram_chat_id: str = Field(default="", description="Telegram Chat ID")
    telegram_enabled: bool = Field(default=False)

    # ── 서버 ──
    server_host: str = Field(default="0.0.0.0")
    server_port: int = Field(default=8000)

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent / ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

    @property
    def round_trip_fee_pct(self) -> float:
        """레버리지 반영 왕복 수수료율 (%)"""
        return (self.taker_fee_pct + self.taker_fee_pct) * self.leverage

    @property
    def bitget_symbol(self) -> str:
        """Bitget REST API용 심볼 변환 (BTC/USDT:USDT → BTCUSDT)"""
        return self.symbol.replace("/", "").replace(":USDT", "")

    @property
    def is_live(self) -> bool:
        return self.trading_mode == TradingMode.LIVE


# 싱글톤 인스턴스
_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reload_settings() -> Settings:
    """설정 강제 리로드 (런타임 설정 변경 시 사용)"""
    global _settings
    _settings = Settings()
    return _settings
