"""
main.py — FastAPI backend cho AQI Forecast App.

Các endpoint:
  GET  /api/provinces                    → danh sách tỉnh
  GET  /api/forecast/{slug}              → lấy data + dự báo AQI
  GET  /api/history/{slug}?days=7        → lịch sử AQI
  GET  /api/model-summary/{slug}         → bảng so sánh mô hình
  POST /api/sync                         → sync artifacts từ Drive (admin)

Deploy: render.yaml đi kèm
"""
from __future__ import annotations
import os
from contextlib import asynccontextmanager
from datetime import timedelta

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware

from config import (
    PROVINCES, SLUG_TO_NAME, TARGET, HORIZONS,
    AQI_BINS, AQI_LABELS, AQI_COLORS,
    POLLUTANT_THRESHOLDS, MODEL_SUMMARY, RECOMMENDATIONS,
)
from data import fetch_and_process, vn_now, vn_today
from model_inference import load_artifacts, predict_aqi, clear_artifact_cache
from drive_sync import sync_from_drive


# ── Startup: auto-sync nếu có credentials ────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.environ.get("GCP_SA_JSON") and os.environ.get("DRIVE_FOLDER_ID"):
        print("⏳ Auto-syncing model artifacts from Drive...")
        ok, msg, n = sync_from_drive(force=False)
        print(f"  → {msg} ({n} files)")
    yield


app = FastAPI(
    title="AQI Forecast API — Miền Trung VN",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS: cho phép frontend Vercel gọi vào ───────────────────────────────────
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _aqi_level(val: float) -> int:
    val = max(0.0, float(val))
    for i in range(len(AQI_BINS) - 1):
        if AQI_BINS[i] <= val < AQI_BINS[i + 1]:
            return i
    return len(AQI_LABELS) - 1


def _slug_to_prov(slug: str) -> dict:
    prov = next((v for k, v in PROVINCES.items() if v["slug"] == slug), None)
    if not prov:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy tỉnh: {slug}")
    return prov


def _safe_float(v) -> float | None:
    try:
        f = float(v)
        return None if np.isnan(f) else round(f, 2)
    except Exception:
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health():
    return {"status": "ok", "time_vn": vn_now().isoformat()}


@app.get("/api/provinces")
def get_provinces():
    """Danh sách tỉnh + metadata."""
    return [
        {
            "name": name,
            "slug": v["slug"],
            "lat":  v["lat"],
            "lon":  v["lon"],
        }
        for name, v in PROVINCES.items()
    ]


@app.get("/api/forecast/{slug}")
def get_forecast(slug: str):
    """
    Lấy dữ liệu thực từ Open-Meteo → feature engineering → dự báo AQI.
    Trả về:
      - current: chỉ số hiện tại (AQI, pollutants, weather)
      - predictions: dict {horizon: aqi_value}
      - recommendation: khuyến nghị theo mức AQI hiện tại
    """
    prov = _slug_to_prov(slug)
    arts = load_artifacts(slug)
    if arts is None:
        raise HTTPException(status_code=503, detail="Model chưa được load. Kiểm tra artifacts.")

    # Fetch + process data (5 ngày để có đủ lag 24h)
    try:
        df = fetch_and_process(prov["lat"], prov["lon"], prov["tz"], days=5)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    df = df.dropna(subset=["aqi_lag_24h"])
    if df.empty:
        raise HTTPException(status_code=422, detail="Không đủ dữ liệu feature (cần ≥24h).")

    # Dự báo
    predictions = predict_aqi(df, arts)

    # Dòng dữ liệu mới nhất
    row     = df.iloc[-1]
    cur_aqi = _safe_float(row[TARGET]) or predictions.get(1, 0)
    cur_lvl = _aqi_level(cur_aqi)
    now_vn  = vn_now()

    # Thời điểm tương ứng với từng horizon
    forecast_items = []
    for h, val in predictions.items():
        dt  = now_vn + timedelta(hours=h)
        lvl = _aqi_level(val)
        forecast_items.append({
            "horizon":   h,
            "aqi":       round(val, 1),
            "level":     lvl,
            "label":     AQI_LABELS[lvl],
            "color":     AQI_COLORS[lvl],
            "datetime":  dt.isoformat(),
            "time_str":  dt.strftime("%H:%M"),
            "date_str":  "Hôm nay" if dt.date() == now_vn.date()
                         else ("Ngày mai" if dt.date() == (now_vn + timedelta(days=1)).date()
                               else dt.strftime("%d/%m")),
        })

    # Pollutants hiện tại
    pollutants = {}
    for key, thr in POLLUTANT_THRESHOLDS.items():
        val = _safe_float(row.get(key, float("nan")))
        if val is not None:
            pollutants[key] = {
                "value": val,
                "unit":  thr["unit"],
                "name":  thr["name"],
                "who":   thr["who"],
                "vn":    thr["vn"],
                "delta_who": round(val - thr["who"], 2),
            }

    # Weather hiện tại
    weather = {
        "temperature_2m":       _safe_float(row.get("temperature_2m")),
        "relative_humidity_2m": _safe_float(row.get("relative_humidity_2m")),
        "wind_speed_10m":       _safe_float(row.get("wind_speed_10m")),
        "cloud_cover":          _safe_float(row.get("cloud_cover")),
        "pressure_msl":         _safe_float(row.get("pressure_msl")),
    }

    # Safe/unsafe windows
    safe_windows, unsafe_windows = [], []
    for item in forecast_items:
        if item["level"] <= 1:
            safe_windows.append(item["time_str"])
        elif item["level"] >= 3:
            unsafe_windows.append(item["time_str"])

    return {
        "province": SLUG_TO_NAME.get(slug, slug),
        "slug":     slug,
        "timestamp": now_vn.isoformat(),
        "current": {
            "aqi":      cur_aqi,
            "level":    cur_lvl,
            "label":    AQI_LABELS[cur_lvl],
            "color":    AQI_COLORS[cur_lvl],
            "time_str": row["time"].strftime("%H:%M %d/%m/%Y") if hasattr(row["time"], "strftime") else str(row["time"]),
        },
        "forecast":      forecast_items,
        "pollutants":    pollutants,
        "weather":       weather,
        "recommendation": RECOMMENDATIONS[cur_lvl],
        "safe_windows":   safe_windows,
        "unsafe_windows": unsafe_windows,
    }


@app.get("/api/history/{slug}")
def get_history(
    slug: str,
    days: int = Query(default=7, ge=1, le=30),
):
    """
    Lịch sử AQI + PM2.5 cho biểu đồ.
    Trả về danh sách records {time, aqi, pm2_5, level}.
    """
    prov = _slug_to_prov(slug)

    try:
        df = fetch_and_process(prov["lat"], prov["lon"], prov["tz"], days=days)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    df_hist = df[df[TARGET].notna()].copy()

    # Hourly pattern (AQI trung bình theo giờ)
    df_hist["hour_of_day"] = df_hist["time"].dt.hour
    hourly = (
        df_hist.groupby("hour_of_day")[TARGET]
        .agg(["mean", "std"])
        .reset_index()
    )
    hourly["std"] = hourly["std"].fillna(0)

    # Level distribution
    df_hist["level"] = df_hist[TARGET].apply(_aqi_level)
    dist = df_hist["level"].value_counts(normalize=True).sort_index()

    records = []
    for _, row in df_hist.iterrows():
        aqi = _safe_float(row[TARGET])
        if aqi is None:
            continue
        records.append({
            "time":   row["time"].isoformat(),
            "aqi":    aqi,
            "pm2_5":  _safe_float(row.get("pm2_5", float("nan"))),
            "level":  _aqi_level(aqi),
            "label":  AQI_LABELS[_aqi_level(aqi)],
            "color":  AQI_COLORS[_aqi_level(aqi)],
        })

    return {
        "slug":    slug,
        "days":    days,
        "records": records,
        "hourly_pattern": [
            {
                "hour": int(r["hour_of_day"]),
                "mean": round(float(r["mean"]), 2),
                "std":  round(float(r["std"]), 2),
            }
            for _, r in hourly.iterrows()
        ],
        "level_distribution": {
            str(k): round(float(v) * 100, 1)
            for k, v in dist.items()
        },
        "stats": {
            "mean":   round(float(df_hist[TARGET].mean()), 1),
            "max":    round(float(df_hist[TARGET].max()), 0),
            "min":    round(float(df_hist[TARGET].min()), 0),
            "std":    round(float(df_hist[TARGET].std()), 1),
            "n_good": round(float((df_hist[TARGET] <= 50).mean() * 100), 1),
            "n_rows": len(df_hist),
        },
    }


@app.get("/api/model-summary/{slug}")
def get_model_summary(slug: str):
    """Bảng kết quả so sánh các mô hình."""
    if slug not in MODEL_SUMMARY:
        raise HTTPException(status_code=404, detail=f"Không có dữ liệu mô hình cho: {slug}")

    data = MODEL_SUMMARY[slug]
    models = [
        {
            "name":    m[0],
            "rmse":    m[1],
            "wla":     m[2],
            "is_best": m[0] == data["best"],
        }
        for m in data["models"]
    ]

    # Cross-province best model summary
    all_best = []
    for s, d in MODEL_SUMMARY.items():
        best = next((m for m in d["models"] if m[0] == d["best"]), None)
        if best:
            all_best.append({
                "province": d["name"],
                "slug":     s,
                "model":    best[0],
                "n_pc":     d["n_pc"],
                "rmse":     best[1],
                "wla":      best[2],
            })

    return {
        "slug":     slug,
        "name":     data["name"],
        "best":     data["best"],
        "n_pc":     data["n_pc"],
        "models":   models,
        "all_best": all_best,
    }


@app.post("/api/sync")
def trigger_sync(
    force: bool = Query(default=False),
    x_admin_token: str | None = Header(default=None),
):
    """Sync model artifacts từ Google Drive. Yêu cầu ADMIN_TOKEN."""
    admin_token = os.environ.get("ADMIN_TOKEN")
    if admin_token and x_admin_token != admin_token:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    ok, msg, n = sync_from_drive(force=force)
    if ok and n > 0:
        clear_artifact_cache()

    return {"success": ok, "message": msg, "downloaded": n}
