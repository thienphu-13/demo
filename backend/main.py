"""
main.py — FastAPI backend cho AQI Forecast App.
- Cache RAM 2h + stale fallback 24h khi bị 429
- Pre-warm cache 4 tỉnh lúc startup (tuần tự, cách 5s)
"""
from __future__ import annotations
import os
import time
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
from data import fetch_and_process, vn_now
from model_inference import load_artifacts, predict_aqi, clear_artifact_cache
from drive_sync import sync_from_drive


# ── Cache RAM ─────────────────────────────────────────────────────────────────
_cache: dict = {}
_CACHE_TTL   = 7200   # 2 giờ fresh
_STALE_TTL   = 86400  # 24 giờ stale fallback

def _cache_get(key: str, allow_stale: bool = False):
    entry = _cache.get(key)
    if not entry:
        return None
    age = time.time() - entry["ts"]
    if age < _CACHE_TTL:
        return entry["data"]
    if allow_stale and age < _STALE_TTL:
        return entry["data"]
    return None

def _cache_set(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}


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

def _build_forecast_result(slug: str) -> dict:
    """Core logic dùng chung cho endpoint và pre-warm."""
    prov = next((v for k, v in PROVINCES.items() if v["slug"] == slug), None)
    if not prov:
        raise ValueError(f"Slug không hợp lệ: {slug}")
    arts = load_artifacts(slug)
    if arts is None:
        raise ValueError("Model chưa load được")
    df = fetch_and_process(prov["lat"], prov["lon"], prov["tz"], days=5)
    df = df.dropna(subset=["aqi_lag_24h"])
    if df.empty:
        raise ValueError("Không đủ dữ liệu feature")

    predictions = predict_aqi(df, arts)
    row     = df.iloc[-1]
    cur_aqi = _safe_float(row[TARGET]) or predictions.get(1, 0)
    cur_lvl = _aqi_level(cur_aqi)
    now_vn  = vn_now()

    forecast_items = []
    for h, val in predictions.items():
        dt  = now_vn + timedelta(hours=h)
        lvl = _aqi_level(val)
        forecast_items.append({
            "horizon":  h, "aqi": round(val, 1), "level": lvl,
            "label":    AQI_LABELS[lvl], "color": AQI_COLORS[lvl],
            "datetime": dt.isoformat(), "time_str": dt.strftime("%H:%M"),
            "date_str": "Hôm nay" if dt.date() == now_vn.date()
                        else ("Ngày mai" if dt.date() == (now_vn + timedelta(days=1)).date()
                              else dt.strftime("%d/%m")),
        })

    pollutants = {}
    for key, thr in POLLUTANT_THRESHOLDS.items():
        val = _safe_float(row.get(key, float("nan")))
        if val is not None:
            pollutants[key] = {
                "value": val, "unit": thr["unit"], "name": thr["name"],
                "who": thr["who"], "vn": thr["vn"],
                "delta_who": round(val - thr["who"], 2),
            }

    weather = {
        "temperature_2m":       _safe_float(row.get("temperature_2m")),
        "relative_humidity_2m": _safe_float(row.get("relative_humidity_2m")),
        "wind_speed_10m":       _safe_float(row.get("wind_speed_10m")),
        "cloud_cover":          _safe_float(row.get("cloud_cover")),
        "pressure_msl":         _safe_float(row.get("pressure_msl")),
    }

    safe_windows, unsafe_windows = [], []
    for item in forecast_items:
        if item["level"] <= 1:
            safe_windows.append(item["time_str"])
        elif item["level"] >= 3:
            unsafe_windows.append(item["time_str"])

    return {
        "province": SLUG_TO_NAME.get(slug, slug), "slug": slug,
        "timestamp": now_vn.isoformat(),
        "current": {
            "aqi": cur_aqi, "level": cur_lvl,
            "label": AQI_LABELS[cur_lvl], "color": AQI_COLORS[cur_lvl],
            "time_str": row["time"].strftime("%H:%M %d/%m/%Y")
                        if hasattr(row["time"], "strftime") else str(row["time"]),
        },
        "forecast": forecast_items, "pollutants": pollutants, "weather": weather,
        "recommendation": RECOMMENDATIONS[cur_lvl],
        "safe_windows": safe_windows, "unsafe_windows": unsafe_windows,
    }


# ── Startup ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Sync Drive
    if os.environ.get("GCP_SA_JSON") and os.environ.get("DRIVE_FOLDER_ID"):
        print("⏳ Auto-syncing model artifacts from Drive...")
        ok, msg, n = sync_from_drive(force=False)
        print(f"  → {msg} ({n} files)")

    # 2. Pre-warm cache — tuần tự, cách 5s tránh 429
    print("⏳ Pre-warming cache cho 4 tỉnh...")
    for name, prov in PROVINCES.items():
        slug      = prov["slug"]
        cache_key = f"forecast:{slug}"
        if _cache_get(cache_key):
            print(f"  ✓ {name} (đã có cache)")
            continue
        try:
            result = _build_forecast_result(slug)
            _cache_set(cache_key, result)
            print(f"  ✓ {name} — AQI {result['current']['aqi']}")
            time.sleep(5)
        except Exception as e:
            print(f"  ✗ {name}: {e}")
            time.sleep(2)
    print("✅ Cache warm-up xong!")
    yield


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="AQI Forecast API — Miền Trung VN", version="2.1.0", lifespan=lifespan)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware, allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok", "time_vn": vn_now().isoformat(),
        "cache_entries": len(_cache), "cached_keys": list(_cache.keys()),
    }

@app.get("/api/provinces")
def get_provinces():
    return [{"name": name, "slug": v["slug"], "lat": v["lat"], "lon": v["lon"]}
            for name, v in PROVINCES.items()]

@app.get("/api/forecast/{slug}")
def get_forecast(slug: str):
    cache_key = f"forecast:{slug}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    try:
        result = _build_forecast_result(slug)
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        stale = _cache_get(cache_key, allow_stale=True)
        if stale:
            print(f"[fallback] stale cache cho {slug}")
            return stale
        if "429" in str(e) or "Too Many Requests" in str(e):
            raise HTTPException(status_code=429, detail="Open-Meteo rate limit. Thử lại sau vài phút.")
        raise HTTPException(status_code=502, detail=str(e))

@app.get("/api/history/{slug}")
def get_history(slug: str, days: int = Query(default=7, ge=1, le=30)):
    cache_key = f"history:{slug}:{days}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    prov = _slug_to_prov(slug)
    try:
        df = fetch_and_process(prov["lat"], prov["lon"], prov["tz"], days=days)
    except Exception as e:
        stale = _cache_get(cache_key, allow_stale=True)
        if stale:
            return stale
        raise HTTPException(status_code=502, detail=str(e))

    df_hist = df[df[TARGET].notna()].copy()
    df_hist["hour_of_day"] = df_hist["time"].dt.hour
    hourly = df_hist.groupby("hour_of_day")[TARGET].agg(["mean", "std"]).reset_index()
    hourly["std"] = hourly["std"].fillna(0)
    df_hist["level"] = df_hist[TARGET].apply(_aqi_level)
    dist = df_hist["level"].value_counts(normalize=True).sort_index()

    records = []
    for _, row in df_hist.iterrows():
        aqi = _safe_float(row[TARGET])
        if aqi is None:
            continue
        records.append({
            "time": row["time"].isoformat(), "aqi": aqi,
            "pm2_5": _safe_float(row.get("pm2_5", float("nan"))),
            "level": _aqi_level(aqi), "label": AQI_LABELS[_aqi_level(aqi)],
            "color": AQI_COLORS[_aqi_level(aqi)],
        })

    result = {
        "slug": slug, "days": days, "records": records,
        "hourly_pattern": [
            {"hour": int(r["hour_of_day"]), "mean": round(float(r["mean"]), 2), "std": round(float(r["std"]), 2)}
            for _, r in hourly.iterrows()
        ],
        "level_distribution": {str(k): round(float(v) * 100, 1) for k, v in dist.items()},
        "stats": {
            "mean": round(float(df_hist[TARGET].mean()), 1),
            "max":  round(float(df_hist[TARGET].max()), 0),
            "min":  round(float(df_hist[TARGET].min()), 0),
            "std":  round(float(df_hist[TARGET].std()), 1),
            "n_good": round(float((df_hist[TARGET] <= 50).mean() * 100), 1),
            "n_rows": len(df_hist),
        },
    }
    _cache_set(cache_key, result)
    return result

@app.get("/api/model-summary/{slug}")
def get_model_summary(slug: str):
    if slug not in MODEL_SUMMARY:
        raise HTTPException(status_code=404, detail=f"Không có dữ liệu mô hình cho: {slug}")
    data   = MODEL_SUMMARY[slug]
    models = [
        {"name": m[0], "rmse": m[1], "wla": m[2],
         "r2": m[3] if len(m) > 3 else None, "is_best": m[0] == data["best"]}
        for m in data["models"]
    ]
    all_best = []
    for s, d in MODEL_SUMMARY.items():
        best = next((m for m in d["models"] if m[0] == d["best"]), None)
        if best:
            all_best.append({
                "province": d["name"], "slug": s, "model": best[0],
                "n_pc": d["n_pc"], "rmse": best[1], "wla": best[2],
                "r2": best[3] if len(best) > 3 else None,
            })
    return {"slug": slug, "name": data["name"], "best": data["best"],
            "n_pc": data["n_pc"], "models": models, "all_best": all_best}

@app.post("/api/sync")
def trigger_sync(force: bool = Query(default=False), x_admin_token: str | None = Header(default=None)):
    admin_token = os.environ.get("ADMIN_TOKEN")
    if admin_token and x_admin_token != admin_token:
        raise HTTPException(status_code=403, detail="Unauthorized.")
    ok, msg, n = sync_from_drive(force=force)
    if ok and n > 0:
        clear_artifact_cache()
    return {"success": ok, "message": msg, "downloaded": n}

@app.delete("/api/cache")
def clear_api_cache(x_admin_token: str | None = Header(default=None)):
    """Xóa cache thủ công để force refresh."""
    admin_token = os.environ.get("ADMIN_TOKEN")
    if admin_token and x_admin_token != admin_token:
        raise HTTPException(status_code=403, detail="Unauthorized.")
    n = len(_cache)
    _cache.clear()
    return {"cleared": n}
