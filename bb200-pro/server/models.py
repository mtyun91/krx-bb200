"""
BB200 Pro — 데이터베이스 모델 및 연결 관리
SQLite + SQLAlchemy 비동기 지원
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Boolean, Enum as SAEnum,
    create_engine, Index, text,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


# ── DB 파일 경로 ──
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "bb200pro.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DB_PATH}"


class Base(DeclarativeBase):
    pass


# ── Enum 정의 ──
class Side(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"


class TradeStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class SignalType(str, Enum):
    ENTRY_1 = "ENTRY_1"  # 1차 진입 (BB 돌파)
    ENTRY_2 = "ENTRY_2"  # 2차 진입 (눌림 반등)
    ENTRY_3 = "ENTRY_3"  # 3차 진입 (전고/저점 돌파)
    EXIT_TARGET = "EXIT_TARGET"  # 목표 익절
    EXIT_TRAILING = "EXIT_TRAILING"  # 트레일링 스탑
    EXIT_BB_MID = "EXIT_BB_MID"  # BB 중심선 이탈
    EXIT_BREAKEVEN = "EXIT_BREAKEVEN"  # 본절 스탑
    EXIT_STOPLOSS = "EXIT_STOPLOSS"  # 손절
    EXIT_MANUAL = "EXIT_MANUAL"  # 수동 청산
    EXIT_DAILY_LIMIT = "EXIT_DAILY_LIMIT"  # 일일 손실 한도


# ── 캔들 데이터 ──
class Candle(Base):
    __tablename__ = "candles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    timeframe = Column(String(5), nullable=False, default="5m")  # 5m, 1h
    timestamp_ms = Column(Integer, nullable=False)  # Unix timestamp (ms)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False, default=0.0)

    # 보조지표 (계산 후 저장)
    bb_upper = Column(Float, nullable=True)
    bb_middle = Column(Float, nullable=True)
    bb_lower = Column(Float, nullable=True)
    bb_width = Column(Float, nullable=True)
    rsi_14 = Column(Float, nullable=True)
    mfi_14 = Column(Float, nullable=True)
    atr_14 = Column(Float, nullable=True)
    ma_5 = Column(Float, nullable=True)
    ma_10 = Column(Float, nullable=True)
    ma_30 = Column(Float, nullable=True)
    ma_200 = Column(Float, nullable=True)
    vol_ratio = Column(Float, nullable=True)

    __table_args__ = (
        Index("ix_candle_sym_tf_ts", "symbol", "timeframe", "timestamp_ms", unique=True),
    )

    @property
    def dt(self) -> datetime:
        return datetime.fromtimestamp(self.timestamp_ms / 1000, tz=timezone.utc)

    def to_dict(self) -> dict:
        return {
            "timestamp_ms": self.timestamp_ms,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
            "bb_upper": self.bb_upper,
            "bb_middle": self.bb_middle,
            "bb_lower": self.bb_lower,
            "rsi_14": self.rsi_14,
            "mfi_14": self.mfi_14,
            "atr_14": self.atr_14,
        }


# ── 거래 기록 ──
class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    side = Column(SAEnum(Side), nullable=False)
    status = Column(SAEnum(TradeStatus), nullable=False, default=TradeStatus.OPEN)

    # 진입 정보
    entry_price = Column(Float, nullable=False)
    entry_amount = Column(Float, nullable=False)  # 계약 수량
    entry_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    entry_signal = Column(SAEnum(SignalType), nullable=True)
    entry_stage = Column(Integer, nullable=False, default=1)  # 1, 2, 3차

    # 청산 정보
    exit_price = Column(Float, nullable=True)
    exit_time = Column(DateTime, nullable=True)
    exit_signal = Column(SAEnum(SignalType), nullable=True)
    exit_reason = Column(String(500), nullable=True)

    # 손익 정보
    leverage = Column(Integer, nullable=False, default=5)
    raw_pnl_pct = Column(Float, nullable=True)  # 1배 기준 수익률
    gross_pnl_pct = Column(Float, nullable=True)  # 레버리지 적용 수익률
    fee_pct = Column(Float, nullable=True)  # 수수료 차감률
    net_pnl_pct = Column(Float, nullable=True)  # 최종 순수익률
    net_pnl_usdt = Column(Float, nullable=True)  # 순수익 (USDT)

    # 시퀀스 정보
    sequence_id = Column(Integer, nullable=True)  # 같은 시퀀스 묶음

    # Paper 거래 여부
    is_paper = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_trade_sym_status", "symbol", "status"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "symbol": self.symbol,
            "side": self.side.value if self.side else None,
            "status": self.status.value if self.status else None,
            "entry_price": self.entry_price,
            "entry_amount": self.entry_amount,
            "entry_time": self.entry_time.isoformat() if self.entry_time else None,
            "entry_stage": self.entry_stage,
            "exit_price": self.exit_price,
            "exit_time": self.exit_time.isoformat() if self.exit_time else None,
            "exit_reason": self.exit_reason,
            "leverage": self.leverage,
            "net_pnl_pct": self.net_pnl_pct,
            "net_pnl_usdt": self.net_pnl_usdt,
            "is_paper": self.is_paper,
        }


# ── 현재 포지션 ──
class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    side = Column(SAEnum(Side), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # 평균 진입가 (가중 평균)
    avg_entry_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    leverage = Column(Integer, nullable=False, default=5)

    # 시퀀스 상태
    current_stage = Column(Integer, nullable=False, default=1)
    sequence_id = Column(Integer, nullable=True)
    extreme_price = Column(Float, nullable=True)  # 롱: 최고가 / 숏: 최저가
    pullback_seen = Column(Boolean, nullable=False, default=False)

    # 익절/손절 기준
    target_price = Column(Float, nullable=True)
    stop_loss_price = Column(Float, nullable=True)
    trailing_high = Column(Float, nullable=True)  # 트레일링용 최고/저점

    # Paper 여부
    is_paper = Column(Boolean, nullable=False, default=True)

    opened_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def unrealized_pnl_pct(self, current_price: float) -> float:
        """미실현 수익률 계산 (레버리지 적용, 수수료 미반영)"""
        if self.side == Side.LONG:
            raw = ((current_price - self.avg_entry_price) / self.avg_entry_price) * 100
        else:
            raw = ((self.avg_entry_price - current_price) / self.avg_entry_price) * 100
        return raw * self.leverage

    def to_dict(self, current_price: float | None = None) -> dict:
        result = {
            "id": self.id,
            "symbol": self.symbol,
            "side": self.side.value if self.side else None,
            "is_active": self.is_active,
            "avg_entry_price": self.avg_entry_price,
            "total_amount": self.total_amount,
            "leverage": self.leverage,
            "current_stage": self.current_stage,
            "target_price": self.target_price,
            "stop_loss_price": self.stop_loss_price,
            "is_paper": self.is_paper,
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
        }
        if current_price is not None:
            result["unrealized_pnl_pct"] = round(self.unrealized_pnl_pct(current_price), 2)
        return result


# ── 일일 통계 ──
class DailyStat(Base):
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(10), nullable=False, unique=True)  # YYYY-MM-DD
    total_trades = Column(Integer, nullable=False, default=0)
    winning_trades = Column(Integer, nullable=False, default=0)
    losing_trades = Column(Integer, nullable=False, default=0)
    total_pnl_pct = Column(Float, nullable=False, default=0.0)
    total_pnl_usdt = Column(Float, nullable=False, default=0.0)
    max_drawdown_pct = Column(Float, nullable=False, default=0.0)
    balance_end = Column(Float, nullable=True)

    def to_dict(self) -> dict:
        return {
            "date": self.date,
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "win_rate": round(self.winning_trades / max(1, self.total_trades) * 100, 1),
            "total_pnl_pct": self.total_pnl_pct,
            "total_pnl_usdt": self.total_pnl_usdt,
            "max_drawdown_pct": self.max_drawdown_pct,
            "balance_end": self.balance_end,
        }


# ── 데이터베이스 엔진 및 세션 ──
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db():
    """테이블 생성 (최초 실행 시)"""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """DB 세션 생성 (FastAPI Depends용)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
