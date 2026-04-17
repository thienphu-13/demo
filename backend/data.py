"""
data.py — Fetch dữ liệu từ Open-Meteo API + feature engineering.
Có retry tự động khi gặp 429 Too Many Requests.
"""
from __future__ import annotations
import time
import warnings
from datetime import date, timedelta, datetime, timezone

import numpy as np
import pandas as pd
import requests

from config import (
    TARGET, HORIZONS, PHYSICAL_BOUNDS,
    AQ_VARS, WEATHER_VARS,
)

warnings.filterwarnings("ignore")

_VN_TZ = timezone(timedelta(hours=7))


def vn_now() -> datetime:
    return datetime.now(tz=timezone.utc).astimezone(_VN_TZ)


def vn_today() -> date:
    return vn_now().date()


# ── Retry wrapper cho requests.get ───────────────────────────────────────────
def _get_with_retry(url: str, params: dict, timeout: int = 30, max_retries: int = 4) -> requests.Response:
    """Gọi GET với exponential backoff khi gặp 429."""
    wait_times = [10, 20, 40, 60]  # seconds
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, params=params, timeout=timeout)
            if resp.status_code == 429:
                wait = wait_times[min(attempt, len(wait_times) - 1)]
                print(f"[429] Open-Meteo rate limit — chờ {wait}s (lần {attempt + 1}/{max_retries})")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except requests.exceptions.Timeout:
            if attempt == max_retries - 1:
                raise
            time.sleep(5)
        except requests.exceptions.HTTPError as e:
            if resp.status_code == 429:
                if attempt == max_retries - 1:
                    raise RuntimeError(f"Open-Meteo rate limit sau {max_retries} lần thử: {e}")
                continue
            raise
    raise RuntimeError(f"Không thể kết nối Open-Meteo sau {max_retries} lần thử")


# ── Fetch Open-Meteo ──────────────────────────────────────────────────────────

def fetch_openmeteo(
    lat: float, lon: float, tz: str,
    start: str, end: str,
) -> pd.DataFrame | None:
    """Gọi Open-Meteo Air Quality + Weather APIs và trả về DataFrame đã merge."""

    aq_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    wt_url = "https://api.open-meteo.com/v1/forecast"

    aq_params = {
        "latitude": lat, "longitude": lon,
        "hourly": ",".join(AQ_VARS),
        "timezone": tz, "start_date": start, "end_date": end,
    }
    wt_params = {
        "latitude": lat, "longitude": lon,
        "hourly": ",".join(WEATHER_VARS),
        "timezone": tz, "start_date": start, "end_date": end,
        "wind_speed_unit": "kmh",
    }

    try:
        ra = _get_with_retry(aq_url, params=aq_params)
        rw = _get_with_retry(wt_url, params=wt_params)
    except Exception as e:
        raise RuntimeError(f"Lỗi kết nối Open-Meteo: {e}")

    def _parse(r: requests.Response) -> pd.DataFrame:
        j = r.json()
        h = j.get("hourly", {})
        df = pd.DataFrame(h)
        df["time"] = pd.to_datetime(df["time"])
        return df

    df_aq = _parse(ra)
    df_wt = _parse(rw)

    df = df_aq.merge(df_wt, on="time", how="outer").sort_values("time").reset_index(drop=True)
    return df


def impute_df(df: pd.DataFrame) -> pd.DataFrame:
    """Clip physical bounds + interpolate gaps."""
    impute_cols = [TARGET, "pm2_5", "pm10", "temperature_2m",
                   "relative_humidity_2m", "wind_speed_10m", "pressure_msl",
                   "shortwave_radiation", "nitrogen_dioxide", "ozone",
                   "sulphur_dioxide", "carbon_monoxide"]
    impute_cols = [c for c in impute_cols if c in df.columns]

    for col, (lo, hi) in PHYSICAL_BOUNDS.items():
        if col in df.columns:
            df.loc[(df[col] < lo) | (df[col] > hi), col] = np.nan

    for col in impute_cols:
        limit = 3 if col == TARGET else 6
        df[col] = df[col].interpolate(method="linear", limit=limit, limit_direction="both")
        still = df[col].isna()
        if still.any():
            rolled = df[col].rolling(24, min_periods=3, center=True).mean()
            df.loc[still, col] = rolled[still]

    return df.ffill().bfill()


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tạo lag, rolling, cyclical và interaction features."""
    df = df.sort_values("time").reset_index(drop=True).copy()

    for h in [1, 3, 6, 12, 24]:
        df[f"aqi_lag_{h}h"]  = df[TARGET].shift(h)
        df[f"pm25_lag_{h}h"] = df["pm2_5"].shift(h)
    for h in [1, 3, 6]:
        df[f"temp_lag_{h}h"]  = df["temperature_2m"].shift(h)
        df[f"humid_lag_{h}h"] = df["relative_humidity_2m"].shift(h)
        df[f"wind_lag_{h}h"]  = df["wind_speed_10m"].shift(h)

    for w in [3, 6, 12, 24]:
        df[f"aqi_rmean_{w}h"] = df[TARGET].rolling(w, min_periods=1).mean()
        df[f"aqi_rmax_{w}h"]  = df[TARGET].rolling(w, min_periods=1).max()
        df[f"aqi_rmin_{w}h"]  = df[TARGET].rolling(w, min_periods=1).min()
        df[f"aqi_rstd_{w}h"]  = df[TARGET].rolling(w, min_periods=1).std().fillna(0)
    for w in [6, 24]:
        df[f"pm25_rmean_{w}h"]  = df["pm2_5"].rolling(w, min_periods=1).mean()
        df[f"wind_rmean_{w}h"]  = df["wind_speed_10m"].rolling(w, min_periods=1).mean()
        df[f"humid_rmean_{w}h"] = df["relative_humidity_2m"].rolling(w, min_periods=1).mean()

    df["aqi_diff_1h"]  = df[TARGET].diff(1).fillna(0)
    df["aqi_diff_3h"]  = df[TARGET].diff(3).fillna(0)
    df["aqi_diff_24h"] = df[TARGET].diff(24).fillna(0)

    h_s = df["time"].dt.hour
    m_s = df["time"].dt.month
    dw  = df["time"].dt.dayofweek
    df["hour_sin"]  = np.sin(2 * np.pi * h_s / 24)
    df["hour_cos"]  = np.cos(2 * np.pi * h_s / 24)
    df["month_sin"] = np.sin(2 * np.pi * m_s / 12)
    df["month_cos"] = np.cos(2 * np.pi * m_s / 12)
    df["dow_sin"]   = np.sin(2 * np.pi * dw / 7)
    df["dow_cos"]   = np.cos(2 * np.pi * dw / 7)
    df["hour"]        = h_s
    df["month"]       = m_s
    df["day_of_week"] = dw
    df["day"]         = df["time"].dt.day
    df["year"]        = df["time"].dt.year

    season_map = {3:"Mùa khô",4:"Mùa khô",5:"Mùa khô",6:"Mùa khô",
                  7:"Mùa khô",8:"Mùa khô",9:"Mùa mưa",10:"Mùa mưa",
                  11:"Mùa mưa",12:"Mùa mưa",1:"Mùa mưa",2:"Mùa mưa"}
    df["season"]        = m_s.map(season_map)
    df["is_dry_season"] = df["season"].map({"Mùa khô": 1, "Mùa mưa": 0}).astype(int)

    df["pm25_pm10_ratio"] = df["pm2_5"] / (df["pm10"] + 1e-6)
    df["humid_x_pm25"]    = df["relative_humidity_2m"] * df["pm2_5"]
    df["temp_x_wind"]     = df["temperature_2m"] * df["wind_speed_10m"]

    for h_t in HORIZONS:
        df[f"target_t{h_t}h"] = df[TARGET].shift(-h_t)

    return df


def fetch_and_process(lat: float, lon: float, tz: str, days: int = 5) -> pd.DataFrame:
    """Convenience: fetch → impute → features."""
    today = vn_today()
    start = (today - timedelta(days=days)).isoformat()
    end   = today.isoformat()
    df_raw = fetch_openmeteo(lat, lon, tz, start, end)
    return build_features(impute_df(df_raw))
