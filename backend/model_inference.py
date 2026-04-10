"""
model_inference.py — Load pkl artifacts và chạy dự báo.
"""
from __future__ import annotations
from pathlib import Path
from functools import lru_cache

import numpy as np
import pandas as pd
import joblib

from config import BEST_MODEL_DIR, HORIZONS, TARGET


@lru_cache(maxsize=8)
def load_artifacts(slug: str) -> dict | None:
    """Load model artifacts (cached per slug)."""
    arts = {}
    for key, fname in [
        ("model",       f"{slug}_best_model.pkl"),
        ("scaler_pca",  f"{slug}_scaler_pca.pkl"),
        ("pca",         f"{slug}_pca.pkl"),
        ("strong_vars", f"{slug}_strong_vars.pkl"),
        ("info",        f"{slug}_inference_info.pkl"),
    ]:
        p = BEST_MODEL_DIR / fname
        if not p.exists():
            return None
        arts[key] = joblib.load(p)
    return arts


def clear_artifact_cache():
    load_artifacts.cache_clear()


def predict_aqi(features_df: pd.DataFrame, arts: dict) -> dict[int, float]:
    """Trả về dict {horizon_hours: aqi_value}."""
    sv    = arts["strong_vars"]
    avail = [v for v in sv if v in features_df.columns]
    sample = features_df[avail].iloc[[-1]].copy()
    for v in sv:
        if v not in sample.columns:
            sample[v] = 0.0
    sample = sample[sv]

    X        = np.nan_to_num(sample.values, nan=0.0)
    X_scaled = arts["scaler_pca"].transform(X)
    X_pca    = arts["pca"].transform(X_scaled)
    raw_pred = arts["model"].predict(X_pca)[0]

    return {h: float(p) for h, p in zip(HORIZONS, np.clip(raw_pred, 0, 500))}
