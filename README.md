# AQI Forecast — Miền Trung Việt Nam
## React + FastAPI · Vercel + Render

Ứng dụng dự báo chất lượng không khí (AQI) cho 4 tỉnh Miền Trung Việt Nam, sử dụng kiến trúc tách bạch Frontend/Backend và pipeline Machine Learning PCA + Ensemble.

---

## Mục lục

1. [Kiến trúc tổng quan](#1-kiến-trúc-tổng-quan)
2. [Pipeline Machine Learning](#2-pipeline-machine-learning)
3. [Backend — FastAPI](#3-backend--fastapi)
4. [Frontend — Tính năng từng Tab](#4-frontend--tính-năng-từng-tab)
5. [Bản đồ tương tác & Routing](#5-bản-đồ-tương-tác--routing)
6. [Responsive Design](#6-responsive-design)
7. [Cấu trúc dự án](#7-cấu-trúc-dự-án)
8. [Hướng dẫn Deploy](#8-hướng-dẫn-deploy)
9. [API Endpoints](#9-api-endpoints)
10. [Biến môi trường](#10-biến-môi-trường)
11. [Danh mục từ và ký hiệu viết tắt](#11-danh-mục-từ-và-ký-hiệu-viết-tắt)

---

## 1. Kiến trúc tổng quan

```
┌──────────────────────────────────────────────────────────────┐
│                    USER (Browser / Mobile)                   │
│           React + Vite SPA — Vercel CDN                      │
│  Tab1      Tab2      Tab3      Tab4      Tab5                │
│  Dự báo    Phân loại Lịch sử  Mô hình   Du lịch             │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTPS REST (fetch)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│            FastAPI Backend — Render (Singapore)              │
│                                                              │
│  RAM Cache 2h ──► Pre-warm 4 tỉnh lúc startup (async)       │
│  Stale fallback 24h khi Open-Meteo trả 429                   │
│                                                              │
│  /api/forecast  ──► data.py ──► model_inference.py           │
│  /api/history   ──► data.py                                  │
│  /api/sync      ──► drive_sync.py                            │
└──────────┬───────────────────────┬───────────────────────────┘
           │                       │
           ▼                       ▼
  Open-Meteo CAMS API        Google Drive
  Air Quality + ERA5         best_pca_models/*.pkl
```

**Luồng xử lý request `/api/forecast/{slug}`:**
```
1. Check RAM cache (TTL 2h)  →  hit: trả về ngay
2. Miss: fetch Open-Meteo (5 ngày gần nhất)
3. Impute + Feature Engineering (~82 features)
4. Load artifacts: scaler → PCA → model
5. Predict 7 horizons đồng thời
6. Build response JSON (current + forecast + pollutants + weather + recommendation)
7. Cache → trả về
8. Nếu lỗi + stale cache tồn tại → dùng stale (tối đa 24h)
```

---

## 2. Pipeline Machine Learning

### 2.1 Dữ liệu huấn luyện

| | |
|---|---|
| Nguồn | Open-Meteo CAMS Global Air Quality + ERA5 Weather |
| Giai đoạn | 08/2022 – 03/2026 (~43 tháng) |
| Tần suất | Hourly |
| Số mẫu | ~31,000 hàng/tỉnh × 4 tỉnh |
| Target | `us_aqi` (US Air Quality Index) |
| Horizons | 7 bước: 1h, 3h, 6h, 12h, 24h, 48h, 72h |

**22 biến thô:**
- Air Quality (10): `us_aqi`, `pm2_5`, `pm10`, `carbon_monoxide`, `nitrogen_dioxide`, `sulphur_dioxide`, `ozone`, `aerosol_optical_depth`, `dust`, `european_aqi`
- Weather (12): `temperature_2m`, `relative_humidity_2m`, `dew_point_2m`, `apparent_temperature`, `precipitation`, `rain`, `pressure_msl`, `cloud_cover`, `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, `shortwave_radiation`

### 2.2 Feature Engineering (~82 features)

```
Lag features (19):
  AQI lags t-1h, t-3h, t-6h, t-12h, t-24h             → 5
  PM2.5 lags t-1h, t-3h, t-6h, t-12h, t-24h           → 5
  Temp/Humid/Wind lags t-1h, t-3h, t-6h (×3 vars)     → 9

Rolling statistics (22):
  AQI rolling [3,6,12,24]h: mean, max, min, std        → 16
  PM2.5/Wind/Humid rolling [6,24]h: mean               → 6

Difference features (3):
  AQI diff: Δ1h, Δ3h, Δ24h

Cyclical encoding (6):
  hour_sin, hour_cos    (chu kỳ 24h)
  month_sin, month_cos  (chu kỳ 12 tháng)
  dow_sin, dow_cos      (chu kỳ 7 ngày)

Calendar features (5): hour, month, day, day_of_week, year

Season features (2):
  season         (Mùa khô: tháng 3–8, Mùa mưa: 9–2)
  is_dry_season  (binary 0/1)

Interaction features (3):
  pm25_pm10_ratio = pm2_5 / (pm10 + 1e-6)
  humid_x_pm25    = relative_humidity × pm2_5
  temp_x_wind     = temperature × wind_speed

Target (7): target_t1h, t3h, t6h, t12h, t24h, t48h, t72h
            (shift ngược: target_tNh = AQI tại thời điểm N giờ sau)
```

### 2.3 Tiền xử lý

```python
# 1. Clip outliers theo physical bounds
PHYSICAL_BOUNDS = {
  "us_aqi": (0, 500), "pm2_5": (0, 500), "pm10": (0, 1000),
  "carbon_monoxide": (0, 50000), "ozone": (0, 600), ...
}

# 2. Imputation (theo thứ tự):
#    a. Linear interpolate (limit=3h cho AQI, 6h cho các biến khác)
#    b. Rolling mean 24h (min_periods=3) cho gap dài hơn
#    c. ffill() + bfill() cho phần còn lại

# 3. StandardScaler trước PCA (mean=0, std=1)
```

### 2.4 PCA — Giảm chiều

```
Input: 82 features (đã scale)
Giữ lại: 95% variance explained
Output: 17–19 principal components (tuỳ tỉnh)

  Thanh Hóa: 82 → 18 PC
  Nghệ An:   82 → 17 PC
  Hà Tĩnh:   82 → 18 PC
  Huế:       82 → 19 PC

Lý do:
  - Loại bỏ multicollinearity giữa lag/rolling features tương quan cao
  - Giảm overfitting trên tập nhỏ (~31k mẫu)
  - Tăng tốc training và inference đáng kể
```

### 2.5 So sánh 16 Models (Multi-output)

Mỗi model dự báo đồng thời 7 horizon (multi-output regression):

| Nhóm | Models |
|---|---|
| Linear | LinearRegression, Ridge, Lasso |
| Tree-based | DecisionTree, RandomForest, ExtraTrees |
| Gradient Boosting | GradientBoosting, XGBoost, LightGBM, CatBoost |
| SVM / KNN | SVR, KNN |
| Deep Learning | LSTM, GRU, BiLSTM, Transformer |

> NBEATS bị loại khỏi so sánh vì kết quả âm ở một số tỉnh.

**Metrics:** RMSE (thấp hơn = tốt), WLA — Weighted Level Accuracy (%), R² (cao hơn = tốt)

### 2.6 Kết quả Best Model

| Tỉnh | Best Model | n_PC | RMSE | WLA % | R² |
|---|---|---|---|---|---|
| Thanh Hóa | CatBoost | 18 | 13.97 | 77.5 | 0.781 |
| Nghệ An   | CatBoost | 17 | 10.47 | 83.3 | 0.836 |
| Hà Tĩnh   | **Lasso** | 18 | 10.52 | 82.9 | 0.831 |
| Huế       | CatBoost | 19 |  9.38 | 88.6 | 0.865 |

> Hà Tĩnh: Lasso (linear) thắng CatBoost (10.52 vs 10.89 RMSE) — chuỗi AQI tại đây có cấu trúc tuyến tính hơn các tỉnh khác.

### 2.7 Inference Pipeline (Real-time)

```python
# model_inference.py
def predict_aqi(features_df, arts):
    # 1. Chọn strong_vars đã được lưu khi training
    X = features_df[arts['strong_vars']].iloc[[-1]]

    # 2. StandardScaler (fit trên train set)
    X_scaled = arts['scaler_pca'].transform(X)

    # 3. PCA transform (fit trên train set)
    X_pca = arts['pca'].transform(X_scaled)

    # 4. Predict → 7 giá trị cùng lúc
    raw_pred = arts['model'].predict(X_pca)[0]

    # 5. Clip về [0, 500]
    return {h: float(p) for h, p in zip(HORIZONS, clip(raw_pred, 0, 500))}
```

Artifacts lưu trên Google Drive, sync về server qua Service Account.

---

## 3. Backend — FastAPI

### Caching Strategy

```
RAM Cache (Python dict):
  fresh TTL:  2h  → serve từ cache
  stale TTL: 24h  → fallback khi Open-Meteo 429

Pre-warm lúc startup (asyncio.create_task, không block):
  - Chờ 5s sau khi server ready
  - Fetch tuần tự 4 tỉnh, cách nhau 8s (tránh rate limit)

Keys: "forecast:{slug}", "history:{slug}:{days}"
```

### Open-Meteo Retry (Exponential Backoff)

```python
wait_times = [10, 20, 40, 60]  # seconds
max_retries = 4
# Khi gặp HTTP 429 → sleep → retry
```

### Drive Sync Logic

```python
# So sánh modifiedTime Drive vs mtime local
# Chỉ download nếu Drive mới hơn
# MediaIoBaseDownload streaming cho file lớn
# Sau sync: clear lru_cache của load_artifacts()
```

---

## 4. Frontend — Tính năng từng Tab

### Tab 1 — Dự báo AQI

**Components và xử lý:**

`StickyAQILegend` — Bảng thang AQI sticky phải màn hình, thu gọn được, highlight dòng hiện tại

`AQIHero` — Card gradient 6 màu theo mức, hiện AQI số lớn + label + khuyến nghị + hoạt động

`PollutantGrid` — 6 ô ô nhiễm, progress bar: xanh (≤ WHO) → cam (WHO < x ≤ QCVN) → đỏ (> QCVN)

`GaugeChart` — Plotly gauge với 5 vùng màu nền, threshold line, số AQI trung tâm

`ForecastChart` — Plotly spline, marker màu theo mức, AQI zone backgrounds, threshold annotations dọc trục Y

`SafeWindows` — Thuật toán **merge ranges**:
```javascript
// Gộp giờ lẻ thành range liên tục (threshold 6h)
// forecast[level ≤ 1] → [6h, 7h, 8h, 18h, 19h]
// → mergeToRanges → [[6, 9], [18, 20]]
```

`HealthAdvisory` — 6 slots (5h–8h / 8h–12h / 12h–14h / 14h–18h / 18h–21h / 21h–5h):
- Tìm forecast item gần nhất mỗi slot theo `midH`
- Map `aqiLevel → status text + background color`

`InteractiveLayerMap` — Leaflet: CartoDB Voyager (tên VN) + OpenTopoMap + Esri Satellite với CartoDB label overlay

### Tab 2 — Phân loại & Khuyến nghị

`ProvinceCard` — 4 tỉnh song song, header màu AQI, mini pollutant bars, weather 3 cột

`ComparisonChart` — Plotly bar: màu bar = `aqiColor(val)`, shape layers AQI zones nền

`PollutantCompareTable` — Ma trận 4 tỉnh × 4 chỉ số, 3 màu: xanh/cam/đỏ theo WHO/QCVN

**Sequential fetch tránh rate limit:**
```javascript
for (const p of PROVINCES) {
  await api.getForecast(p.slug);
  await sleep(2000);
}
```

### Tab 3 — Lịch sử

`HistoryLineChart` — Dual Y-axis: AQI (trái) + PM2.5 nét đứt (phải), AQI zone shapes, threshold annotations

`HourlyPatternChart` — Line + confidence band `±1σ` (fill toSelf polygon), tick giờ 0h–22h

`PieChart` — Plotly donut (hole=0.42), màu AQI theo mức, legend nằm ngang dưới

6 stat cards: n_rows / mean / max / min / std / % giờ tốt (AQI ≤ 50)

### Tab 4 — Dữ liệu & Mô hình

Horizontal bar chart RMSE 16 models — best model nền vàng `#ffd700`

`leftMargin` tự tính: `max(130, maxLabelLen × 7)` px để tên model không bị cắt

Bảng kết quả: RMSE / WLA / R², highlight `is_best = true` màu `#fff9c4`

Bảng tổng hợp 4 tỉnh: highlight tỉnh đang chọn màu `#e3f2fd`

### Tab 5 — Du lịch

**`AQISliderPanel` — Bảng động hai chiều:**
```
Kéo slider → highlight hàng bảng + cập nhật 3 ô summary + đổi màu viền cards + đổi viền marker map
Click hàng bảng → slider nhảy đến AQI_BINS[i] + 1
```

Matrix `getSuit(aqi, type)`:
```javascript
SUIT_MATRIX = {
  outdoor: ['great','ok','limit','no','no','no'],
  mixed:   ['great','ok','limit','indoor_only','no','no'],
  indoor:  ['ok','ok','ok','ok','limit','limit'],
}
// Index theo aqiLevel(aqi) = 0..5
```

**32 điểm du lịch × 4 tỉnh** — tọa độ kiểm chứng từ: UNESCO World Heritage Centre, Sandee Beach Maps, OSM Nominatim

---

## 5. Bản đồ tương tác & Routing

### 5.1 Tile Layers — Tên tiếng Việt

| Layer | Server | Ghi chú |
|---|---|---|
| Bản đồ | CartoDB Voyager | `name:vi` → `name:en` → `name` |
| Địa hình | OpenTopoMap | Tích hợp sẵn tên VN |
| Vệ tinh | Esri World Imagery | + CartoDB `voyager_only_labels` overlay (opacity 0.85) |

> OSM standard tile render tên theo ngôn ngữ địa phương từng nước → vùng biên giới Lào/Thái hiện tiếng Lào/Thái. CartoDB Voyager ưu tiên `name:vi` nhất quán.

### 5.2 OSRM Routing

**Server:** `routing.openstreetmap.de` (FOSSGIS) — tôn trọng `barrier=border_control`

> `router.project-osrm.org` (global) cho phép cross-border → từ HCM đi qua Campuchia/Lào.

**4 phương tiện:**

| Phương tiện | Profile | Màu route |
|---|---|---|
| Ô tô | `routed-car` | Xanh dương |
| Xe máy | `routed-car` ¹ | Xanh lá |
| Đi bộ | `routed-foot` | Cam, nét đứt |
| Bay | Haversine + sân bay | Tím, nét đứt |

> ¹ `routed-bike` là profile xe đạp (bicycle). Xe máy VN đi cùng đường ô tô.

**Thuật toán waypoints QL1A:**

```javascript
function buildVNWaypoints(fromLat, fromLon, destLat, destLon) {
  // Tính khoảng cách Haversine
  const distKm = haversine(fromLat, fromLon, destLat, destLon);

  // Đường ngắn < 150km: không thêm waypoint
  // (waypoint trung gian gây detour: 17km → 186km)
  if (distKm < 150) return [];

  // Đường dài: thêm nodes QL1A chặt giữa 2 điểm
  // Filter: min + 0.3° < node < max - 0.3°
  // (tránh vòng đầu/cuối)
  return QL1A_NODES
    .filter(lat => lat > min + 0.3 && lat < max - 0.3)
    .sort(hướng đi);
}
```

Ngưỡng 150km: trong tỉnh / liền kề không cần waypoint; liên tỉnh xa (HCM → Miền Trung ~1000km) mới cần ép QL1A.

**Chế độ Bay:**
```
8 sân bay: SGN (HCM), HAN (Hà Nội), DAD (Đà Nẵng), HUI (Huế),
           VII (Vinh), THD (Thanh Hóa), CXR (Khánh Hòa), PQC (Phú Quốc)

1. nearest(from)  → AP_from  (Euclidean lat/lon)
2. nearest(dest)  → AP_dest
3. Vẽ 3 đoạn:
   from     →→ AP_from  (nét đứt cam)
   AP_from  →→ AP_dest  (nét đứt tím, đường thẳng)
   AP_dest  →→ dest      (nét đứt cam)
4. Thời gian = distKm / 800 × 60 + 60 phút overhead
```

**Step-by-step parsing:**
```javascript
// Map OSRM maneuver → icon + text tiếng Việt
'turn-left'       → { icon: '↰', text: 'Rẽ trái vào {road}' }
'turn-right'      → { icon: '↱', text: 'Rẽ phải vào {road}' }
'straight'        → { icon: '↑', text: 'Đi thẳng trên {road}' }
'roundabout'      → { icon: '⟳', text: 'Đi vòng xuyến' }
'depart'          → { icon: '▶', text: 'Bắt đầu trên {road}' }
'arrive'          → { icon: '★', text: 'Đến {dest}' }
```

**3 cách nhập điểm xuất phát:**
1. **Địa chỉ** → Nominatim (`countrycodes=vn`, `accept-language=vi`) → dropdown 5 gợi ý
2. **GPS** → `navigator.geolocation.getCurrentPosition`
3. **Chấm map** → `map.on('click')` + cursor `crosshair` + `pickMode` flag

---

## 6. Responsive Design

**Chiến lược:** CSS inject một lần qua `<style id="aqi-global-css">`, không dùng thư viện CSS.

```
> 768px (laptop/desktop):
  - Sidebar sticky chọn tỉnh bên phải (width 180px, thu gọn được)
  - paddingRight: clamp(16px, 17vw, 210px) tránh bị che

≤ 768px (tablet/mobile):
  - Sidebar ẩn hoàn toàn
  - Province bar ngang cuộn được bên dưới tab nav
  - Subtitle header ẩn

≤ 900px:
  - Gauge + Pollutant grid: 2 cột → 1 cột (stack dọc)
  - 4-province grid: 4 cột → 2 cột
  - Weather row: 5 cột → 3 cột

≤ 600px (mobile nhỏ):
  - Map height: 380px → 260px (Tab1), 400px → 300px (Tab6)
  - Grid 2 cột → 1 cột
  - Hero card: flex-row → flex-column
  - Nút: min-height 36px (touch target)
  - Font: clamp() scale mượt
```

---

## 7. Cấu trúc dự án

```
aqi-app/
├── backend/
│   ├── main.py              # FastAPI routes + RAM cache + pre-warm startup
│   ├── config.py            # AQI bins/labels/colors, provinces, model results (static)
│   ├── data.py              # Open-Meteo fetch + retry + feature engineering
│   ├── model_inference.py   # Load pkl + scaler + PCA + predict (lru_cache/slug)
│   ├── drive_sync.py        # Google Drive sync via Service Account JSON
│   ├── requirements.txt
│   └── render.yaml
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx          # Layout, CSS inject, responsive, province selectors
│   │   ├── api.js           # fetch wrapper → FastAPI endpoints
│   │   ├── constants.js     # AQI_BINS, AQI_COLORS, aqiLevel(), aqiColor()
│   │   └── components/
│   │       ├── Tab1Forecast.jsx        # Gauge, chart, Leaflet map, health advisory
│   │       ├── Tab2Classification.jsx  # 4-province comparison
│   │       ├── Tab3History.jsx         # Historical line/hourly/pie charts
│   │       ├── Tab5ModelData.jsx       # Model RMSE comparison, R² table
│   │       └── Tab6Tourism.jsx         # Leaflet + OSRM routing + AQI slider
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       # Dev proxy /api → localhost:8000
│   └── vercel.json          # SPA rewrite + VITE_API_URL
│
└── README.md
```

---

## 8. Hướng dẫn Deploy

### Bước 1 — Chuẩn bị

```bash
git clone https://github.com/your-username/aqi-app.git && cd aqi-app
```

`backend/best_pca_models/` cần đủ 5 file × 4 tỉnh = 20 file:
```
{slug}_best_model.pkl / _scaler_pca.pkl / _pca.pkl / _strong_vars.pkl / _inference_info.pkl
# slug: thanh_hoa | nghe_an | ha_tinh | hue
```

### Bước 2 — Backend (Render)

1. render.com → **New Web Service** → Root: `backend/`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Region: Singapore · Plan: Free

**Environment Variables:**

| Key | Bắt buộc | Mô tả |
|---|---|---|
| `GCP_SA_JSON` | Có* | JSON string Google Service Account |
| `DRIVE_FOLDER_ID` | Có* | ID folder Drive chứa `.pkl` |
| `ADMIN_TOKEN` | Khuyến nghị | Bảo vệ `/api/sync` và `DELETE /api/cache` |
| `ALLOWED_ORIGINS` | Có | URL Vercel, phân cách dấu phẩy |

> *Không bắt buộc nếu copy `.pkl` trực tiếp vào `backend/best_pca_models/`
> Render Free: ngủ sau 15 phút. Dùng UptimeRobot ping/10 phút.

### Bước 3 — Frontend (Vercel)

1. vercel.com → **New Project** → Root: `frontend/` → Framework: Vite
2. Environment: `VITE_API_URL = https://your-api.onrender.com`
3. Sau deploy: cập nhật `ALLOWED_ORIGINS` trong Render

### Bước 4 — Dev Local

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
export GCP_SA_JSON='{"type":"service_account",...}'
export DRIVE_FOLDER_ID='1abc...'
uvicorn main:app --reload --port 8000
# Swagger: http://localhost:8000/docs

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
# App: http://localhost:5173 (Vite proxy /api → :8000)
```

---

## 9. API Endpoints

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Status + cache entries |
| `GET` | `/api/provinces` | 4 tỉnh + tọa độ + timezone |
| `GET` | `/api/forecast/{slug}` | current AQI + 7-horizon forecast + pollutants + weather + recommendation |
| `GET` | `/api/history/{slug}?days=7` | records + hourly_pattern + level_distribution + stats |
| `GET` | `/api/model-summary/{slug}` | 16 models (RMSE/WLA/R²) + best_4_provinces |
| `POST` | `/api/sync?force=false` | Sync `.pkl` từ Google Drive |
| `DELETE` | `/api/cache` | Xóa RAM cache (admin) |

```bash
# Cập nhật model mới
curl -X POST "https://YOUR_API/api/sync?force=true" \
     -H "X-Admin-Token: YOUR_TOKEN"
# → {"success":true,"message":"Đã tải 20 file mới.","downloaded":20}
```

---

## 10. Biến môi trường

### Backend (Render)
| Key | Mô tả |
|---|---|
| `GCP_SA_JSON` | JSON string của Google Service Account (toàn bộ nội dung file) |
| `DRIVE_FOLDER_ID` | ID folder Google Drive chứa `.pkl` artifacts |
| `ADMIN_TOKEN` | Token bảo vệ `/api/sync` và `DELETE /api/cache` |
| `ALLOWED_ORIGINS` | URL frontend, vd: `https://aqi-app.vercel.app` |

### Frontend (Vercel)
| Key | Mô tả |
|---|---|
| `VITE_API_URL` | URL backend Render (không có `/` cuối) |

---

## 11. Danh mục từ và ký hiệu viết tắt

| Ký hiệu | Tiếng Anh | Tiếng Việt |
|---|---|---|
| AQI | Air Quality Index | Chỉ số Chất lượng Không khí |
| US AQI | United States AQI | Thang AQI tiêu chuẩn Mỹ (0–500) |
| PM2.5 | Particulate Matter < 2.5µm | Hạt bụi mịn dưới 2.5 micromet |
| PM10 | Particulate Matter < 10µm | Hạt bụi dưới 10 micromet |
| NO₂ | Nitrogen Dioxide | Khí nitơ đioxit |
| O₃ | Ozone | Khí ozon tầng thấp |
| SO₂ | Sulphur Dioxide | Khí lưu huỳnh đioxit |
| CO | Carbon Monoxide | Khí carbon monoxit |
| WHO | World Health Organization | Tổ chức Y tế Thế giới |
| QCVN | — | Quy chuẩn kỹ thuật Quốc gia Việt Nam |
| CAMS | Copernicus Atmosphere Monitoring Service | Dịch vụ giám sát khí quyển Copernicus |
| ERA5 | ECMWF Reanalysis v5 | Dữ liệu tái phân tích khí hậu ECMWF |
| PCA | Principal Component Analysis | Phân tích thành phần chính (giảm chiều dữ liệu) |
| RMSE | Root Mean Squared Error | Căn bậc hai sai số bình phương trung bình |
| WLA | Weighted Level Accuracy | Độ chính xác phân loại mức AQI có trọng số |
| R² | Coefficient of Determination | Hệ số xác định (1.0 = hoàn hảo) |
| OSRM | Open Source Routing Machine | Công cụ định tuyến đường bộ mã nguồn mở |
| FOSSGIS | Free and Open Source GIS server | Máy chủ OSRM cộng đồng |
| QL1A | — | Quốc lộ 1A — trục đường chính Bắc–Nam Việt Nam |
| SPA | Single Page Application | Ứng dụng web trang đơn |
| TTL | Time To Live | Thời gian sống của cache |
| GPS | Global Positioning System | Hệ thống định vị toàn cầu |
| CDN | Content Delivery Network | Mạng phân phối nội dung |
