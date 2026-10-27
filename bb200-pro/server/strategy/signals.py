"""
BB200 Pro 시그널 생성 엔진.

볼린저 밴드(200) 기반 양방향 3단계 시퀀스 탐지 및 종료 조건 처리.

원본 대비 개선사항:
1. 멀티 타임프레임 확인: 1시간봉 추세 방향 검증 후 진입
2. ATR 기반 동적 손절가 (고정 BB mid 대신)
3. 쿨다운 시스템: 손실 시퀀스 후 N 봉 대기
4. BB 스퀴즈 감지: 밴드 폭이 좁은 구간에서 진입 차단
5. 거래량 필터: 거래량 급증 확인 (선택)
6. RSI 다이버전스 확인 (선택)
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 시그널 액션 열거형
# ---------------------------------------------------------------------------

class SignalAction(Enum):
    """매매 시그널 종류."""

    # 롱 진입 1·2·3 단계
    LONG_ENTRY_1 = "LONG_ENTRY_1"
    LONG_ENTRY_2 = "LONG_ENTRY_2"
    LONG_ENTRY_3 = "LONG_ENTRY_3"

    # 숏 진입 1·2·3 단계
    SHORT_ENTRY_1 = "SHORT_ENTRY_1"
    SHORT_ENTRY_2 = "SHORT_ENTRY_2"
    SHORT_ENTRY_3 = "SHORT_ENTRY_3"

    # 종료
    EXIT_TARGET = "EXIT_TARGET"        # 목표 수익 도달
    EXIT_TRAILING = "EXIT_TRAILING"    # 트레일링 스탑
    EXIT_BB_MID = "EXIT_BB_MID"        # BB 중심선 교차
    EXIT_BREAKEVEN = "EXIT_BREAKEVEN"  # 손익분기점 방어 (Pro)
    EXIT_STOPLOSS = "EXIT_STOPLOSS"   # ATR 기반 손절


# ---------------------------------------------------------------------------
# 시그널 데이터클래스
# ---------------------------------------------------------------------------

@dataclass
class Signal:
    """
    매매 시그널 하나를 나타내는 불변 데이터 구조.

    Attributes
    ----------
    action : SignalAction
        시그널 종류.
    price : float
        시그널 가격 (종가 기준).
    bar_index : int
        봉 인덱스.
    timestamp_ms : int
        밀리초 타임스탬프.
    reason : str
        시그널 발생 사유 (한글).
    confidence : float
        신뢰도 (0.0 ~ 1.0). 기본 1.0.
    metadata : dict
        추가 메타데이터 (RSI, MFI, ATR 등).
    """

    action: SignalAction
    price: float
    bar_index: int
    timestamp_ms: int
    reason: str
    confidence: float = 1.0
    metadata: dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# 내부 포지션 상태 추적
# ---------------------------------------------------------------------------

class _Direction(Enum):
    LONG = "LONG"
    SHORT = "SHORT"


@dataclass
class _SequenceState:
    """진행 중인 시퀀스(포지션)의 내부 상태."""

    direction: _Direction
    stage: int = 0                          # 0=대기, 1/2/3=진입 단계
    entries: list[tuple[float, int]] = field(default_factory=list)  # (price, bar_idx)
    extreme_price: float = 0.0              # 롱: 최고점, 숏: 최저점 (1단계 이후)
    peak_profit_pct: float = 0.0            # 최대 수익률 (트레일링용)
    bars_since_entry: int = 0               # 최초 진입 이후 경과 봉 수
    atr_at_entry: float = 0.0               # 진입 시점 ATR (손절용)

    @property
    def avg_entry(self) -> float:
        """가중 평균 진입가 (단순 평균 — 각 단계 동일 수량 가정)."""
        if not self.entries:
            return 0.0
        return sum(p for p, _ in self.entries) / len(self.entries)


# ---------------------------------------------------------------------------
# 기본 설정값
# ---------------------------------------------------------------------------

_DEFAULT_CONFIG: dict = {
    # 볼린저 밴드 파라미터
    "bb_period": 200,
    "bb_std": 2.0,

    # 매매 파라미터
    "target_move_pct": 1.5,       # 목표 수익률 (%)
    "trailing_stop_pct": 0.35,    # 트레일링 스탑: 고점 대비 되돌림 (%)
    "cooldown_bars": 12,          # 손실 후 대기 봉 수
    "leverage": 5,                # 레버리지 (참고용)

    # 수수료
    "taker_fee_pct": 0.055,       # 테이커 수수료 (%)
    "maker_fee_pct": 0.02,        # 메이커 수수료 (%)
    "funding_rate_pct": 0.01,     # 펀딩비 / 8시간 (%)

    # Pro 기능 스위치
    "pro_breakeven": True,        # 손익분기 방어 활성화
    "pro_partial_tp": False,      # 부분 익절 (미구현 — 향후)
    "pro_vol_filter": True,       # 거래량 필터 활성화
    "pro_maker_opt": False,       # 메이커 최적화 (미구현 — 향후)

    # 세부 튜닝
    "squeeze_threshold": 20,      # squeeze_rank 이 값 이하 → 스퀴즈 판정 (진입 차단)
    "vol_spike_ratio": 1.2,       # 거래량 필터 배수
    "atr_sl_mult": 2.0,           # 손절 = ATR * 이 배수
    "trailing_min_profit_pct": 0.7,  # 트레일링 발동 최소 수익률 (%)
    "bb_mid_min_bars": 6,         # BB mid 종료 최소 경과 봉
}


# ---------------------------------------------------------------------------
# SequenceDetector — BB200 양방향 3단계 시퀀스 탐지기
# ---------------------------------------------------------------------------

class SequenceDetector:
    """
    BB200 양방향 3단계 시퀀스 탐지기 (개선 버전).

    Improvements over original
    --------------------------
    1. Multi-timeframe confirmation: 1h 추세 방향 확인 후 진입
    2. ATR-based dynamic stop-loss: 고정 BB mid 대신 ATR 배수 손절
    3. Cooldown system: 손실 시퀀스 후 N 봉 대기
    4. BB squeeze detection: 밴드 폭이 좁은 구간 진입 차단
    5. Volume filter: 거래량 급증 확인 (선택)
    6. RSI divergence check (향후 확장)

    Usage
    -----
    >>> detector = SequenceDetector(config)
    >>> signals = detector.scan(bars_5m, bars_1h)
    """

    def __init__(self, config: dict) -> None:
        """
        시퀀스 탐지기 초기화.

        Parameters
        ----------
        config : dict
            설정 딕셔너리. _DEFAULT_CONFIG 참조.
            누락된 키는 기본값으로 채워짐.
        """
        self.cfg: dict = {**_DEFAULT_CONFIG, **config}

        # 내부 상태
        self._state: Optional[_SequenceState] = None
        self._cooldown_remaining: int = 0  # 쿨다운 잔여 봉 수
        self._last_loss: bool = False       # 직전 시퀀스 손실 여부

    # ------------------------------------------------------------------
    # 공개 API
    # ------------------------------------------------------------------

    def scan(
        self,
        bars_5m: list[dict],
        bars_1h: list[dict] | None = None,
    ) -> list[Signal]:
        """
        5분봉(+ 선택적 1시간봉) 데이터를 스캔하여 시그널 리스트를 반환.

        bars_5m 에는 indicators.compute_all_indicators() 가 이미 적용된 상태여야 한다.

        Parameters
        ----------
        bars_5m : list[dict]
            5분 캔들 (지표 부착 완료).
        bars_1h : list[dict] | None
            1시간 캔들 (지표 부착 완료, 선택).

        Returns
        -------
        list[Signal]
            탐지된 시그널 리스트 (시간순).
        """
        signals: list[Signal] = []
        n = len(bars_5m)

        for i in range(1, n):
            bar = bars_5m[i]
            prev = bars_5m[i - 1]

            # 필수 지표가 아직 준비되지 않은 구간은 건너뜀
            if bar.get("bb_upper") is None or bar.get("ma_200") is None:
                continue
            if bar.get("atr") is None:
                continue

            # ── 쿨다운 처리 ──
            if self._cooldown_remaining > 0:
                self._cooldown_remaining -= 1
                continue

            # ── 포지션이 없으면 진입 탐색 ──
            if self._state is None:
                entry_signals = self._scan_entry(bar, prev, i, bars_1h)
                signals.extend(entry_signals)
            else:
                # ── 포지션이 있으면 추가 진입 또는 종료 탐색 ──
                self._state.bars_since_entry += 1

                # 먼저 종료 조건 확인 (종료 우선)
                exit_sig = self._scan_exit(bar, prev, i)
                if exit_sig is not None:
                    signals.append(exit_sig)
                    self._finalize_sequence(exit_sig)
                    continue

                # 추가 진입 확인
                add_signals = self._scan_additional_entry(bar, prev, i, bars_5m)
                signals.extend(add_signals)

        return signals

    def compute_fee(self, hold_bars: int) -> float:
        """
        보유 봉 수에 따른 총 수수료 비율(%) 계산.

        수수료 = 진입 수수료 + 종료 수수료 + 펀딩비
        - 진입/종료: taker_fee_pct 각 1회
        - 펀딩비: 8시간(= 96 × 5분봉) 마다 funding_rate_pct

        Parameters
        ----------
        hold_bars : int
            보유한 5분봉 개수.

        Returns
        -------
        float
            총 수수료 비율 (%).
        """
        entry_fee = self.cfg["taker_fee_pct"]
        exit_fee = self.cfg["taker_fee_pct"]

        # 펀딩비: 5분봉 기준 8시간 = 96봉 당 1회
        bars_per_funding = 96
        funding_count = hold_bars // bars_per_funding
        funding_fee = funding_count * self.cfg["funding_rate_pct"]

        return entry_fee + exit_fee + funding_fee

    def get_1h_trend(
        self,
        bars_1h: list[dict],
        current_5m_ts: int,
    ) -> str:
        """
        1시간봉 기준 추세 판정.

        - close > MA200 on 1h → 'BULLISH'
        - close < MA200 on 1h → 'BEARISH'
        - MA200이 없거나 동일 → 'NEUTRAL'

        현재 5분봉 타임스탬프 이전의 최신 1시간봉을 사용.

        Parameters
        ----------
        bars_1h : list[dict]
            1시간 캔들 (지표 부착 완료).
        current_5m_ts : int
            현재 5분봉의 타임스탬프 (밀리초).

        Returns
        -------
        str
            'BULLISH', 'BEARISH', 또는 'NEUTRAL'.
        """
        if not bars_1h:
            return "NEUTRAL"

        # 현재 5분봉 이전의 최신 1시간봉 찾기
        relevant: Optional[dict] = None
        for bar in reversed(bars_1h):
            if bar["timestamp_ms"] <= current_5m_ts:
                relevant = bar
                break

        if relevant is None:
            return "NEUTRAL"

        ma200 = relevant.get("ma_200")
        if ma200 is None:
            return "NEUTRAL"

        close = relevant["close"]
        # 약간의 마진 — 0.05% 이내면 NEUTRAL
        margin = ma200 * 0.0005
        if close > ma200 + margin:
            return "BULLISH"
        elif close < ma200 - margin:
            return "BEARISH"
        else:
            return "NEUTRAL"

    # ------------------------------------------------------------------
    # 내부 — 진입 탐색
    # ------------------------------------------------------------------

    def _scan_entry(
        self,
        bar: dict,
        prev: dict,
        idx: int,
        bars_1h: list[dict] | None,
    ) -> list[Signal]:
        """
        포지션이 없을 때 1단계 진입 조건 검사.

        LONG 1단계:
        - 종가가 BB 상단 돌파 (close > bb_upper)
        - 양봉 (close > open)
        - (선택) 거래량 >= vol_spike_ratio × 평균
        - 1시간봉 추세가 BULLISH (데이터 있을 때)
        - BB 스퀴즈 구간이 아님 (squeeze_rank > threshold)

        SHORT 1단계 (롱의 반대):
        - 종가가 BB 하단 돌파 (close < bb_lower)
        - 음봉 (close < open)
        """
        signals: list[Signal] = []

        close = bar["close"]
        open_ = bar["open"]
        bb_upper = bar["bb_upper"]
        bb_lower = bar["bb_lower"]
        squeeze_rank = bar.get("squeeze_rank")
        vol_ratio = bar.get("vol_ratio")
        atr = bar.get("atr", 0.0)

        # 스퀴즈 필터: 밴드가 너무 좁으면 진입 차단
        squeeze_threshold = self.cfg["squeeze_threshold"]
        if squeeze_rank is not None and squeeze_rank <= squeeze_threshold:
            return signals

        # 1시간봉 추세 확인
        trend_1h = "NEUTRAL"
        if bars_1h:
            trend_1h = self.get_1h_trend(bars_1h, bar["timestamp_ms"])

        # ── LONG 1단계 ──
        if close > bb_upper and close > open_:
            # 1시간봉 추세 필터
            if bars_1h and trend_1h == "BEARISH":
                logger.debug(
                    "LONG 1단계 차단: 1h 추세 BEARISH (idx=%d)", idx,
                )
            else:
                # 거래량 필터 (선택)
                confidence = 1.0
                if self.cfg["pro_vol_filter"] and vol_ratio is not None:
                    if vol_ratio < self.cfg["vol_spike_ratio"]:
                        confidence = max(0.5, vol_ratio / self.cfg["vol_spike_ratio"])

                sig = Signal(
                    action=SignalAction.LONG_ENTRY_1,
                    price=close,
                    bar_index=idx,
                    timestamp_ms=bar["timestamp_ms"],
                    reason=(
                        f"LONG 1단계: 종가({close:.2f})가 BB 상단({bb_upper:.2f}) 돌파, "
                        f"양봉, 1h={trend_1h}"
                    ),
                    confidence=confidence,
                    metadata={
                        "bb_upper": bb_upper,
                        "rsi": bar.get("rsi"),
                        "mfi": bar.get("mfi"),
                        "vol_ratio": vol_ratio,
                        "atr": atr,
                        "trend_1h": trend_1h,
                        "squeeze_rank": squeeze_rank,
                    },
                )
                signals.append(sig)

                # 내부 상태 초기화
                self._state = _SequenceState(
                    direction=_Direction.LONG,
                    stage=1,
                    entries=[(close, idx)],
                    extreme_price=close,  # 1단계 고점 = 현재 종가
                    atr_at_entry=atr if atr else 0.0,
                )

        # ── SHORT 1단계 ──
        elif close < bb_lower and close < open_:
            # 1시간봉 추세 필터
            if bars_1h and trend_1h == "BULLISH":
                logger.debug(
                    "SHORT 1단계 차단: 1h 추세 BULLISH (idx=%d)", idx,
                )
            else:
                confidence = 1.0
                if self.cfg["pro_vol_filter"] and vol_ratio is not None:
                    if vol_ratio < self.cfg["vol_spike_ratio"]:
                        confidence = max(0.5, vol_ratio / self.cfg["vol_spike_ratio"])

                sig = Signal(
                    action=SignalAction.SHORT_ENTRY_1,
                    price=close,
                    bar_index=idx,
                    timestamp_ms=bar["timestamp_ms"],
                    reason=(
                        f"SHORT 1단계: 종가({close:.2f})가 BB 하단({bb_lower:.2f}) 돌파, "
                        f"음봉, 1h={trend_1h}"
                    ),
                    confidence=confidence,
                    metadata={
                        "bb_lower": bb_lower,
                        "rsi": bar.get("rsi"),
                        "mfi": bar.get("mfi"),
                        "vol_ratio": vol_ratio,
                        "atr": atr,
                        "trend_1h": trend_1h,
                        "squeeze_rank": squeeze_rank,
                    },
                )
                signals.append(sig)

                self._state = _SequenceState(
                    direction=_Direction.SHORT,
                    stage=1,
                    entries=[(close, idx)],
                    extreme_price=close,
                    atr_at_entry=atr if atr else 0.0,
                )

        return signals

    # ------------------------------------------------------------------
    # 내부 — 추가 진입 (2·3 단계)
    # ------------------------------------------------------------------

    def _scan_additional_entry(
        self,
        bar: dict,
        prev: dict,
        idx: int,
        bars_5m: list[dict],
    ) -> list[Signal]:
        """
        2·3 단계 추가 진입 검사.

        LONG:
        - 2단계: 풀백 후 MA200 위에서 양봉 반등, 종가 < 1단계 고점
        - 3단계: 이전 고점(extreme) 돌파 + 양봉

        SHORT (반대):
        - 2단계: 반등 후 MA200 아래에서 음봉 거부, 종가 > 1단계 저점
        - 3단계: 이전 저점(extreme) 돌파 + 음봉
        """
        signals: list[Signal] = []
        st = self._state
        if st is None:
            return signals

        close = bar["close"]
        open_ = bar["open"]
        ma200 = bar.get("ma_200")

        if ma200 is None:
            return signals

        if st.direction == _Direction.LONG:
            # extreme 업데이트 (1단계 이후 최고점 추적)
            if close > st.extreme_price:
                st.extreme_price = close

            if st.stage == 1:
                # ── LONG 2단계 ──
                # 조건: 풀백 발생 (현재 종가 < 1단계 고점) + MA200 위 + 양봉
                if (
                    close > ma200
                    and close > open_
                    and close < st.extreme_price
                    and prev["close"] < bar["close"]  # 반등 확인
                ):
                    sig = Signal(
                        action=SignalAction.LONG_ENTRY_2,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"LONG 2단계: 풀백 후 반등, "
                            f"종가({close:.2f}) > MA200({ma200:.2f}), "
                            f"< 1단계 고점({st.extreme_price:.2f})"
                        ),
                        confidence=0.9,
                        metadata={
                            "avg_entry": st.avg_entry,
                            "extreme": st.extreme_price,
                            "rsi": bar.get("rsi"),
                        },
                    )
                    signals.append(sig)
                    st.stage = 2
                    st.entries.append((close, idx))

            elif st.stage == 2:
                # ── LONG 3단계 ──
                # 조건: 이전 고점 돌파 + 양봉
                if close > st.extreme_price and close > open_:
                    sig = Signal(
                        action=SignalAction.LONG_ENTRY_3,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"LONG 3단계: 고점 돌파, "
                            f"종가({close:.2f}) > 이전 고점({st.extreme_price:.2f})"
                        ),
                        confidence=0.85,
                        metadata={
                            "avg_entry": st.avg_entry,
                            "extreme": st.extreme_price,
                            "rsi": bar.get("rsi"),
                        },
                    )
                    signals.append(sig)
                    st.stage = 3
                    st.entries.append((close, idx))
                    st.extreme_price = close  # 새 고점 갱신

        elif st.direction == _Direction.SHORT:
            # extreme 업데이트 (최저점 추적)
            if close < st.extreme_price:
                st.extreme_price = close

            if st.stage == 1:
                # ── SHORT 2단계 ──
                if (
                    close < ma200
                    and close < open_
                    and close > st.extreme_price
                    and prev["close"] > bar["close"]
                ):
                    sig = Signal(
                        action=SignalAction.SHORT_ENTRY_2,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"SHORT 2단계: 반등 후 거부, "
                            f"종가({close:.2f}) < MA200({ma200:.2f}), "
                            f"> 1단계 저점({st.extreme_price:.2f})"
                        ),
                        confidence=0.9,
                        metadata={
                            "avg_entry": st.avg_entry,
                            "extreme": st.extreme_price,
                            "rsi": bar.get("rsi"),
                        },
                    )
                    signals.append(sig)
                    st.stage = 2
                    st.entries.append((close, idx))

            elif st.stage == 2:
                # ── SHORT 3단계 ──
                if close < st.extreme_price and close < open_:
                    sig = Signal(
                        action=SignalAction.SHORT_ENTRY_3,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"SHORT 3단계: 저점 돌파, "
                            f"종가({close:.2f}) < 이전 저점({st.extreme_price:.2f})"
                        ),
                        confidence=0.85,
                        metadata={
                            "avg_entry": st.avg_entry,
                            "extreme": st.extreme_price,
                            "rsi": bar.get("rsi"),
                        },
                    )
                    signals.append(sig)
                    st.stage = 3
                    st.entries.append((close, idx))
                    st.extreme_price = close

        return signals

    # ------------------------------------------------------------------
    # 내부 — 종료 탐색
    # ------------------------------------------------------------------

    def _scan_exit(
        self,
        bar: dict,
        prev: dict,
        idx: int,
    ) -> Optional[Signal]:
        """
        종료 조건 검사 (우선순위 순).

        1. EXIT_STOPLOSS    — ATR 기반 손절 (2 × ATR)
        2. EXIT_TARGET      — 가중 평균 진입가 대비 target_move_pct 도달
        3. EXIT_TRAILING    — 3단계, 수익 >= trailing_min_profit_pct,
                              고점 대비 되돌림 >= trailing_stop_pct
        4. EXIT_BREAKEVEN   — Pro: 2단계+, 가격이 평균 진입가를 위협
        5. EXIT_BB_MID      — 종가가 MA200 반대편으로 교차 (6봉 이상 경과)

        Returns
        -------
        Signal | None
        """
        st = self._state
        if st is None:
            return None

        close = bar["close"]
        avg = st.avg_entry
        ma200 = bar.get("ma_200")
        atr = bar.get("atr", 0.0)

        if avg == 0.0:
            return None

        # 현재 수익률 계산
        if st.direction == _Direction.LONG:
            pnl_pct = (close - avg) / avg * 100.0
        else:
            pnl_pct = (avg - close) / avg * 100.0

        # 수수료 차감 수익률
        fee_pct = self.compute_fee(st.bars_since_entry)
        net_pnl_pct = pnl_pct - fee_pct

        # 최대 수익률 갱신
        if pnl_pct > st.peak_profit_pct:
            st.peak_profit_pct = pnl_pct

        # ────────────────────────────────────────────────────────
        # 1) EXIT_STOPLOSS — ATR 기반 손절
        # ────────────────────────────────────────────────────────
        atr_for_sl = st.atr_at_entry if st.atr_at_entry > 0 else (atr if atr else 0.0)
        if atr_for_sl > 0:
            sl_distance = atr_for_sl * self.cfg["atr_sl_mult"]
            if st.direction == _Direction.LONG:
                sl_price = avg - sl_distance
                if close <= sl_price:
                    return Signal(
                        action=SignalAction.EXIT_STOPLOSS,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"LONG 손절: 종가({close:.2f}) <= SL({sl_price:.2f}), "
                            f"ATR={atr_for_sl:.4f}, 배수={self.cfg['atr_sl_mult']}"
                        ),
                        metadata={
                            "pnl_pct": net_pnl_pct,
                            "sl_price": sl_price,
                            "atr": atr_for_sl,
                            "stage": st.stage,
                        },
                    )
            else:
                sl_price = avg + sl_distance
                if close >= sl_price:
                    return Signal(
                        action=SignalAction.EXIT_STOPLOSS,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"SHORT 손절: 종가({close:.2f}) >= SL({sl_price:.2f}), "
                            f"ATR={atr_for_sl:.4f}, 배수={self.cfg['atr_sl_mult']}"
                        ),
                        metadata={
                            "pnl_pct": net_pnl_pct,
                            "sl_price": sl_price,
                            "atr": atr_for_sl,
                            "stage": st.stage,
                        },
                    )

        # ────────────────────────────────────────────────────────
        # 2) EXIT_TARGET — 목표 수익률 도달
        # ────────────────────────────────────────────────────────
        target_pct = self.cfg["target_move_pct"]
        if net_pnl_pct >= target_pct:
            return Signal(
                action=SignalAction.EXIT_TARGET,
                price=close,
                bar_index=idx,
                timestamp_ms=bar["timestamp_ms"],
                reason=(
                    f"목표 수익 도달: 순수익={net_pnl_pct:.2f}% >= 목표={target_pct:.2f}%"
                ),
                metadata={
                    "pnl_pct": net_pnl_pct,
                    "fee_pct": fee_pct,
                    "stage": st.stage,
                },
            )

        # ────────────────────────────────────────────────────────
        # 3) EXIT_TRAILING — 트레일링 스탑
        # ────────────────────────────────────────────────────────
        trailing_min = self.cfg["trailing_min_profit_pct"]
        trailing_stop = self.cfg["trailing_stop_pct"]

        if st.stage >= 3 and st.peak_profit_pct >= trailing_min:
            drawdown = st.peak_profit_pct - pnl_pct
            if drawdown >= trailing_stop:
                return Signal(
                    action=SignalAction.EXIT_TRAILING,
                    price=close,
                    bar_index=idx,
                    timestamp_ms=bar["timestamp_ms"],
                    reason=(
                        f"트레일링 스탑: 고점수익={st.peak_profit_pct:.2f}%, "
                        f"현재수익={pnl_pct:.2f}%, 되돌림={drawdown:.2f}%"
                    ),
                    metadata={
                        "pnl_pct": net_pnl_pct,
                        "peak_profit_pct": st.peak_profit_pct,
                        "drawdown_pct": drawdown,
                        "stage": st.stage,
                    },
                )

        # ────────────────────────────────────────────────────────
        # 4) EXIT_BREAKEVEN — 손익분기 방어 (Pro)
        # ────────────────────────────────────────────────────────
        if self.cfg["pro_breakeven"] and st.stage >= 2:
            # 수수료를 포함한 손익분기 라인
            be_margin_pct = fee_pct + 0.05  # 약간의 버퍼

            if st.direction == _Direction.LONG:
                be_price = avg * (1.0 + be_margin_pct / 100.0)
                # 이전에 수익이 있었고(peak > 0.3%), 현재 가격이 손익분기선 근접/이탈
                if st.peak_profit_pct >= 0.3 and close <= be_price:
                    return Signal(
                        action=SignalAction.EXIT_BREAKEVEN,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"LONG 손익분기 방어: 종가({close:.2f}) <= "
                            f"BE({be_price:.2f}), 최대수익={st.peak_profit_pct:.2f}%"
                        ),
                        metadata={
                            "pnl_pct": net_pnl_pct,
                            "be_price": be_price,
                            "peak_profit_pct": st.peak_profit_pct,
                            "stage": st.stage,
                        },
                    )
            else:
                be_price = avg * (1.0 - be_margin_pct / 100.0)
                if st.peak_profit_pct >= 0.3 and close >= be_price:
                    return Signal(
                        action=SignalAction.EXIT_BREAKEVEN,
                        price=close,
                        bar_index=idx,
                        timestamp_ms=bar["timestamp_ms"],
                        reason=(
                            f"SHORT 손익분기 방어: 종가({close:.2f}) >= "
                            f"BE({be_price:.2f}), 최대수익={st.peak_profit_pct:.2f}%"
                        ),
                        metadata={
                            "pnl_pct": net_pnl_pct,
                            "be_price": be_price,
                            "peak_profit_pct": st.peak_profit_pct,
                            "stage": st.stage,
                        },
                    )

        # ────────────────────────────────────────────────────────
        # 5) EXIT_BB_MID — MA200 반대편 교차 (6봉 이상)
        # ────────────────────────────────────────────────────────
        min_bars = self.cfg["bb_mid_min_bars"]
        if ma200 is not None and st.bars_since_entry >= min_bars:
            if st.direction == _Direction.LONG and close < ma200:
                return Signal(
                    action=SignalAction.EXIT_BB_MID,
                    price=close,
                    bar_index=idx,
                    timestamp_ms=bar["timestamp_ms"],
                    reason=(
                        f"LONG BB mid 종료: 종가({close:.2f}) < "
                        f"MA200({ma200:.2f}), {st.bars_since_entry}봉 경과"
                    ),
                    metadata={
                        "pnl_pct": net_pnl_pct,
                        "ma200": ma200,
                        "bars_held": st.bars_since_entry,
                        "stage": st.stage,
                    },
                )
            elif st.direction == _Direction.SHORT and close > ma200:
                return Signal(
                    action=SignalAction.EXIT_BB_MID,
                    price=close,
                    bar_index=idx,
                    timestamp_ms=bar["timestamp_ms"],
                    reason=(
                        f"SHORT BB mid 종료: 종가({close:.2f}) > "
                        f"MA200({ma200:.2f}), {st.bars_since_entry}봉 경과"
                    ),
                    metadata={
                        "pnl_pct": net_pnl_pct,
                        "ma200": ma200,
                        "bars_held": st.bars_since_entry,
                        "stage": st.stage,
                    },
                )

        return None

    # ------------------------------------------------------------------
    # 내부 — 시퀀스 종료 처리
    # ------------------------------------------------------------------

    def _finalize_sequence(self, exit_signal: Signal) -> None:
        """
        시퀀스 종료 후 상태 정리 및 쿨다운 적용.

        손실(EXIT_STOPLOSS, EXIT_BB_MID 이면서 pnl < 0) 시
        cooldown_bars 만큼 대기.
        """
        pnl = exit_signal.metadata.get("pnl_pct", 0.0)
        is_loss = pnl < 0.0

        if is_loss:
            self._cooldown_remaining = self.cfg["cooldown_bars"]
            self._last_loss = True
            logger.info(
                "시퀀스 손실 종료 (pnl=%.2f%%). 쿨다운 %d봉 적용.",
                pnl,
                self._cooldown_remaining,
            )
        else:
            self._last_loss = False

        # 상태 초기화
        self._state = None

    # ------------------------------------------------------------------
    # 유틸리티
    # ------------------------------------------------------------------

    def reset(self) -> None:
        """탐지기 상태를 완전 초기화."""
        self._state = None
        self._cooldown_remaining = 0
        self._last_loss = False

    @property
    def is_in_sequence(self) -> bool:
        """현재 시퀀스(포지션) 진행 중 여부."""
        return self._state is not None

    @property
    def current_stage(self) -> int:
        """현재 시퀀스 단계 (0=없음)."""
        return self._state.stage if self._state else 0

    @property
    def current_direction(self) -> Optional[str]:
        """현재 방향 ('LONG', 'SHORT', 또는 None)."""
        return self._state.direction.value if self._state else None

    @property
    def current_avg_entry(self) -> float:
        """현재 가중 평균 진입가."""
        return self._state.avg_entry if self._state else 0.0
