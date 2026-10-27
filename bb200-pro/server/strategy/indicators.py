"""
BB200 Pro 기술적 지표 계산 모듈.

모든 함수는 [{"open", "high", "low", "close", "volume", "timestamp_ms"}, ...] 형태의
딕셔너리 리스트를 입력으로 받는다.

핵심 개선사항 (원본 대비):
- RSI/MFI: Wilder's Smoothing(RMA) 적용 — 단순 합 방식 제거
- ATR: Wilder's Smoothing 적용
- numpy 활용으로 대량 데이터 고속 처리
"""

from __future__ import annotations

import math
from typing import Optional

import numpy as np


# ---------------------------------------------------------------------------
# 단순 이동평균 (SMA)
# ---------------------------------------------------------------------------

def calc_sma(values: list[float], period: int) -> list[float | None]:
    """
    단순 이동평균(Simple Moving Average).

    Parameters
    ----------
    values : list[float]
        종가 또는 거래량 등 수치 시계열.
    period : int
        이동평균 기간.

    Returns
    -------
    list[float | None]
        period 미만 인덱스는 None.
    """
    n = len(values)
    if n == 0 or period <= 0:
        return []

    result: list[float | None] = [None] * n

    # numpy cumsum 활용 — O(n) 계산
    arr = np.asarray(values, dtype=np.float64)
    cs = np.cumsum(arr)

    for i in range(period - 1, n):
        if i == period - 1:
            result[i] = float(cs[i] / period)
        else:
            result[i] = float((cs[i] - cs[i - period]) / period)

    return result


# ---------------------------------------------------------------------------
# RSI — Wilder's Smoothing (RMA)
# ---------------------------------------------------------------------------

def calc_rsi(closes: list[float], period: int = 14) -> list[float | None]:
    """
    RSI (Relative Strength Index) — Wilder's Smoothing 방식.

    avg_gain = prev_avg_gain * (period-1)/period + current_gain/period
    avg_loss = prev_avg_loss * (period-1)/period + current_loss/period
    RS = avg_gain / avg_loss
    RSI = 100 - 100/(1+RS)

    ⚠️ 단순 합(SMA) 방식이 아님. 원본 코드의 버그를 수정한 버전.

    Parameters
    ----------
    closes : list[float]
        종가 시계열.
    period : int
        RSI 기간 (기본 14).

    Returns
    -------
    list[float | None]
        period 이하 인덱스는 None.
    """
    n = len(closes)
    if n < period + 1:
        return [None] * n

    result: list[float | None] = [None] * n
    arr = np.asarray(closes, dtype=np.float64)

    # 변화량 계산
    deltas = np.diff(arr)  # length = n-1

    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    # 초기 SMA seed (첫 period 구간)
    avg_gain = float(np.mean(gains[:period]))
    avg_loss = float(np.mean(losses[:period]))

    # 첫 RSI 값 (인덱스 period — deltas 기준 period-1, 원본 기준 period)
    if avg_loss == 0.0:
        result[period] = 100.0
    else:
        rs = avg_gain / avg_loss
        result[period] = 100.0 - 100.0 / (1.0 + rs)

    # Wilder's smoothing 적용
    alpha = (period - 1) / period
    inv_period = 1.0 / period

    for i in range(period, len(deltas)):
        avg_gain = avg_gain * alpha + gains[i] * inv_period
        avg_loss = avg_loss * alpha + losses[i] * inv_period

        if avg_loss == 0.0:
            result[i + 1] = 100.0
        else:
            rs = avg_gain / avg_loss
            result[i + 1] = 100.0 - 100.0 / (1.0 + rs)

    return result


# ---------------------------------------------------------------------------
# MFI — Wilder's Smoothing (RMA) 적용 Money Flow Index
# ---------------------------------------------------------------------------

def calc_mfi(bars: list[dict], period: int = 14) -> list[float | None]:
    """
    Money Flow Index — Wilder's Smoothing(RMA) 적용 버전.

    Typical Price = (H + L + C) / 3
    Raw Money Flow = TP * Volume
    상승(positive) / 하락(negative) MF 분리 후 RMA 적용.

    MFR = avg_positive_mf / avg_negative_mf
    MFI = 100 - 100 / (1 + MFR)

    ⚠️ 단순 rolling window 합이 아닌 Wilder's Smoothing 사용.

    Parameters
    ----------
    bars : list[dict]
        OHLCV 캔들 데이터.
    period : int
        MFI 기간 (기본 14).

    Returns
    -------
    list[float | None]
        period 이하 인덱스는 None.
    """
    n = len(bars)
    if n < period + 1:
        return [None] * n

    result: list[float | None] = [None] * n

    # Typical price 계산
    tp = np.array(
        [(b["high"] + b["low"] + b["close"]) / 3.0 for b in bars],
        dtype=np.float64,
    )
    vol = np.array([b["volume"] for b in bars], dtype=np.float64)
    raw_mf = tp * vol  # Raw Money Flow

    # 방향 결정: tp[i] > tp[i-1] → positive, 그 외 negative
    tp_diff = np.diff(tp)  # length = n-1
    pos_mf = np.zeros(n - 1, dtype=np.float64)
    neg_mf = np.zeros(n - 1, dtype=np.float64)

    for i in range(n - 1):
        if tp_diff[i] > 0:
            pos_mf[i] = raw_mf[i + 1]
        else:
            neg_mf[i] = raw_mf[i + 1]

    # 초기 seed (SMA)
    avg_pos = float(np.mean(pos_mf[:period]))
    avg_neg = float(np.mean(neg_mf[:period]))

    # 첫 MFI 값
    if avg_neg == 0.0:
        result[period] = 100.0
    else:
        mfr = avg_pos / avg_neg
        result[period] = 100.0 - 100.0 / (1.0 + mfr)

    # Wilder's smoothing
    alpha = (period - 1) / period
    inv_period = 1.0 / period

    for i in range(period, len(pos_mf)):
        avg_pos = avg_pos * alpha + pos_mf[i] * inv_period
        avg_neg = avg_neg * alpha + neg_mf[i] * inv_period

        if avg_neg == 0.0:
            result[i + 1] = 100.0
        else:
            mfr = avg_pos / avg_neg
            result[i + 1] = 100.0 - 100.0 / (1.0 + mfr)

    return result


# ---------------------------------------------------------------------------
# ATR — Wilder's Smoothing
# ---------------------------------------------------------------------------

def calc_atr(bars: list[dict], period: int = 14) -> list[float | None]:
    """
    Average True Range — Wilder's Smoothing 방식.

    True Range = max(H-L, |H-prev_C|, |L-prev_C|)
    ATR(t) = ATR(t-1) * (period-1)/period + TR(t)/period

    Parameters
    ----------
    bars : list[dict]
        OHLCV 캔들 데이터.
    period : int
        ATR 기간 (기본 14).

    Returns
    -------
    list[float | None]
        period 미만 인덱스는 None.
    """
    n = len(bars)
    if n < period + 1:
        return [None] * n

    result: list[float | None] = [None] * n

    # True Range 계산
    tr = np.zeros(n, dtype=np.float64)
    tr[0] = bars[0]["high"] - bars[0]["low"]

    for i in range(1, n):
        h = bars[i]["high"]
        l = bars[i]["low"]
        pc = bars[i - 1]["close"]
        tr[i] = max(h - l, abs(h - pc), abs(l - pc))

    # 초기 ATR = 첫 period 개 TR의 SMA
    atr_val = float(np.mean(tr[1 : period + 1]))
    result[period] = atr_val

    # Wilder's smoothing
    alpha = (period - 1) / period
    inv_period = 1.0 / period

    for i in range(period + 1, n):
        atr_val = atr_val * alpha + tr[i] * inv_period
        result[i] = atr_val

    return result


# ---------------------------------------------------------------------------
# Bollinger Bands
# ---------------------------------------------------------------------------

def calc_bb(
    closes: list[float],
    period: int = 200,
    std_mult: float = 2.0,
) -> list[tuple[float | None, float | None, float | None]]:
    """
    볼린저 밴드 계산.

    middle = SMA(close, period)
    upper  = middle + std_mult * σ
    lower  = middle - std_mult * σ

    Parameters
    ----------
    closes : list[float]
        종가 시계열.
    period : int
        볼린저 밴드 기간 (기본 200).
    std_mult : float
        표준편차 승수 (기본 2.0).

    Returns
    -------
    list[tuple[float|None, float|None, float|None]]
        (upper, middle, lower) 튜플 리스트. period 미만 인덱스는 (None, None, None).
    """
    n = len(closes)
    none_tuple = (None, None, None)

    if n == 0 or period <= 0:
        return []

    result: list[tuple[float | None, float | None, float | None]] = [none_tuple] * n
    arr = np.asarray(closes, dtype=np.float64)

    for i in range(period - 1, n):
        window = arr[i - period + 1 : i + 1]
        mid = float(np.mean(window))
        std = float(np.std(window, ddof=0))  # population std (TradingView 기준)
        upper = mid + std_mult * std
        lower = mid - std_mult * std
        result[i] = (upper, mid, lower)

    return result


# ---------------------------------------------------------------------------
# BB Width
# ---------------------------------------------------------------------------

def calc_bb_width(
    bb_data: list[tuple[float | None, float | None, float | None]],
) -> list[float | None]:
    """
    볼린저 밴드 폭 계산.

    BB Width = (upper - lower) / middle

    Parameters
    ----------
    bb_data : list[tuple]
        calc_bb() 결과.

    Returns
    -------
    list[float | None]
    """
    result: list[float | None] = []
    for upper, mid, lower in bb_data:
        if upper is None or mid is None or lower is None or mid == 0.0:
            result.append(None)
        else:
            result.append((upper - lower) / mid)
    return result


# ---------------------------------------------------------------------------
# Squeeze Rank (BB Width 백분위)
# ---------------------------------------------------------------------------

def calc_squeeze_rank(
    bb_widths: list[float | None],
    lookback: int = 100,
) -> list[int | None]:
    """
    현재 BB Width의 lookback 구간 내 백분위 순위 (0~100).

    낮을수록 밴드가 좁음(스퀴즈) → 돌파 가능성.
    0~20 구간은 '스퀴즈' 상태로 간주.

    Parameters
    ----------
    bb_widths : list[float | None]
        calc_bb_width() 결과.
    lookback : int
        참조 구간 (기본 100).

    Returns
    -------
    list[int | None]
    """
    n = len(bb_widths)
    result: list[int | None] = [None] * n

    for i in range(n):
        if bb_widths[i] is None:
            continue

        # lookback 구간 내 유효값 수집
        window_vals: list[float] = []
        start = max(0, i - lookback + 1)
        for j in range(start, i + 1):
            if bb_widths[j] is not None:
                window_vals.append(bb_widths[j])

        if len(window_vals) < 2:
            result[i] = 50  # 데이터 부족 → 중간값
            continue

        current = bb_widths[i]
        assert current is not None
        count_below = sum(1 for v in window_vals if v < current)
        rank = int(round(count_below / len(window_vals) * 100))
        result[i] = rank

    return result


# ---------------------------------------------------------------------------
# Volume Ratio
# ---------------------------------------------------------------------------

def calc_vol_ratio(volumes: list[float], period: int = 20) -> list[float | None]:
    """
    거래량 비율: 현재 거래량 / SMA(거래량, period).

    1.0 이상이면 평균 이상의 거래량.

    Parameters
    ----------
    volumes : list[float]
        거래량 시계열.
    period : int
        이동평균 기간 (기본 20).

    Returns
    -------
    list[float | None]
    """
    n = len(volumes)
    if n == 0 or period <= 0:
        return []

    sma = calc_sma(volumes, period)
    result: list[float | None] = [None] * n

    for i in range(n):
        if sma[i] is not None and sma[i] != 0.0:
            result[i] = volumes[i] / sma[i]

    return result


# ---------------------------------------------------------------------------
# 모든 지표 일괄 계산
# ---------------------------------------------------------------------------

_MA_PERIODS = (5, 10, 15, 20, 30, 120, 200)


def compute_all_indicators(
    bars: list[dict],
    bb_period: int = 200,
    bb_std: float = 2.0,
) -> list[dict]:
    """
    모든 기술적 지표를 계산하여 각 bar dict에 부착한다.
    원본 리스트를 **직접 변경(mutate)** 하여 반환.

    부착되는 키:
    - ma_{N}        : 단순 이동평균 (N = 5,10,15,20,30,120,200)
    - bb_upper      : 볼린저 상단
    - bb_mid        : 볼린저 중앙 (= MA200)
    - bb_lower      : 볼린저 하단
    - bb_width      : 볼린저 폭
    - squeeze_rank  : BB Width 백분위 (0~100)
    - rsi           : RSI(14)
    - mfi           : MFI(14)
    - atr           : ATR(14)
    - vol_ratio     : 거래량 비율

    Parameters
    ----------
    bars : list[dict]
        OHLCV 캔들 데이터.
    bb_period : int
        볼린저 밴드 기간.
    bb_std : float
        볼린저 밴드 표준편차 승수.

    Returns
    -------
    list[dict]
        지표가 부착된 동일한 bars 리스트.
    """
    if not bars:
        return bars

    n = len(bars)

    # 기본 시계열 추출
    closes = [b["close"] for b in bars]
    volumes = [float(b["volume"]) for b in bars]

    # ── 이동평균 ──
    ma_cache: dict[int, list[float | None]] = {}
    for p in _MA_PERIODS:
        ma_cache[p] = calc_sma(closes, p)

    for i in range(n):
        for p in _MA_PERIODS:
            bars[i][f"ma_{p}"] = ma_cache[p][i]

    # ── 볼린저 밴드 ──
    bb_data = calc_bb(closes, bb_period, bb_std)
    bb_widths = calc_bb_width(bb_data)
    sq_ranks = calc_squeeze_rank(bb_widths)

    for i in range(n):
        upper, mid, lower = bb_data[i]
        bars[i]["bb_upper"] = upper
        bars[i]["bb_mid"] = mid
        bars[i]["bb_lower"] = lower
        bars[i]["bb_width"] = bb_widths[i]
        bars[i]["squeeze_rank"] = sq_ranks[i]

    # ── RSI ──
    rsi_data = calc_rsi(closes, 14)
    for i in range(n):
        bars[i]["rsi"] = rsi_data[i]

    # ── MFI ──
    mfi_data = calc_mfi(bars, 14)
    for i in range(n):
        bars[i]["mfi"] = mfi_data[i]

    # ── ATR ──
    atr_data = calc_atr(bars, 14)
    for i in range(n):
        bars[i]["atr"] = atr_data[i]

    # ── 거래량 비율 ──
    vr_data = calc_vol_ratio(volumes, 20)
    for i in range(n):
        bars[i]["vol_ratio"] = vr_data[i]

    return bars
