# AQI Forecast — Miền Trung VN
## React + FastAPI (Vercel + Render)

Kiến trúc tách bạch Frontend/Backend:
- **Backend**: FastAPI trên [Render](https://render.com) (Singapore)
- **Frontend**: React + Vite + Plotly.js + Leaflet.js trên [Vercel](https://vercel.com)

---

## Cấu trúc dự án

```
aqi-app/
├── backend/
│   ├── main.py              # FastAPI app + tất cả routes + RAM cache 2h
│   ├── config.py            # Hằng số (AQI bins, tỉnh, model summary...)
│   ├── data.py              # Fetch Open-Meteo + feature engineering
│   ├── model_inference.py   # Load pkl artifacts + predict
│   ├── drive_sync.py        # Sync model từ Google Drive
│   ├── requirements.txt
│   └── render.yaml          # Render deployment config
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx          # Root: header, tabs, province selector sticky
│   │   ├── api.js           # Fetch wrapper → FastAPI
│   │   ├── constants.js     # AQI colors, labels, helper functions
│   │   └── components/
│   │       ├── Tab1Forecast.jsx        # Gauge + dự báo 72h + bản đồ layer switcher
│   │       ├── Tab2Classification.jsx  # So sánh 4 tỉnh + phân loại + khuyến nghị
│   │       ├── Tab3History.jsx         # Lịch sử AQI + hourly pattern + pie chart
│   │       ├── Tab5ModelData.jsx       # So sánh mô hình + RMSE chart + bảng R²
│   │       └── Tab6Tourism.jsx         # Du lịch: Leaflet map + OSRM routing + AQI slider
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       # Dev proxy: /api → localhost:8000
│   └── vercel.json          # SPA rewrite + VITE_API_URL
│
└── README.md
```

---

## Tính năng chính theo từng tab

### Tab 1 — Dự báo
- Gauge AQI hiện tại + hero card màu theo mức
- Biểu đồ dự báo 72h (spline, marker màu theo AQI)
- Lưới 6 chỉ số ô nhiễm so sánh ngưỡng WHO / QCVN 05:2023
- Khung giờ an toàn / cần hạn chế (dựa trên forecast)
- Khuyến nghị sức khỏe chia theo 6 khung giờ trong ngày
- **Bản đồ tương tác** với 3 layer bật/tắt độc lập:
  - Layer AQI: chấm màu 4 tỉnh theo mức AQI thực tế
  - Layer Du lịch: điểm tham quan phân loại theo màu
  - Layer Địa hình: nền OpenTopoMap
- 3 nền bản đồ: OpenStreetMap / Carto sáng / Carto tối
- Thang AQI sticky (thu gọn được), highlight mức hiện tại

### Tab 2 — Phân loại & Khuyến nghị
- 4 thẻ tỉnh so sánh song song (AQI + pollutants + thời tiết)
- Biểu đồ cột so sánh AQI 4 tỉnh (màu theo mức)
- Bảng ô nhiễm chéo 4 tỉnh × 4 chỉ số, màu theo WHO/QCVN
- Biểu đồ đường dự báo 72h so sánh 4 tỉnh

### Tab 3 — Lịch sử
- Chọn 3 / 7 / 14 / 30 ngày
- Biểu đồ đường AQI + PM2.5 kép (dual axis)
- Biểu đồ AQI trung bình theo giờ trong ngày (±1 std)
- Pie chart phân bố mức AQI
- 6 stat cards tóm tắt

### Tab 4 — Dữ liệu & Mô hình
- Biểu đồ cột RMSE ngang (16 model, best model = vàng)
- Bảng chi tiết RMSE / WLA / R² cho từng model
- Bảng tổng hợp best model 4 tỉnh

### Tab 5 — Du lịch
- **Bản đồ Leaflet thực** (không phải Plotly): scroll zoom, kéo di chuyển
- 3 nền: OpenStreetMap / OpenTopoMap / Esri Satellite
- Click điểm → popup chi tiết + nút **Chỉ đường ngay trong map** (OSRM, không redirect)
- Hiển thị km + phút lái xe, vẽ polyline route trực tiếp trên bản đồ
- Nút định vị GPS thực (nếu cho phép)
- **Slider AQI động** (0–300): kéo → danh sách điểm + viền marker cập nhật tức thì
- Bảng khuyến nghị tương tác: click hàng → slider nhảy đến mức tương ứng
- Bộ lọc Loại hình / Không gian tách riêng khỏi slider AQI
- Tọa độ điểm du lịch kiểm chứng từ UNESCO / Sandee / OSM

---

## Hướng dẫn Deploy

### Bước 1 — Chuẩn bị

```bash
git clone https://github.com/your-username/aqi-app.git
cd aqi-app
```

Đảm bảo `backend/best_pca_models/` chứa các file `.pkl`:
```
thanh_hoa_best_model.pkl
thanh_hoa_scaler_pca.pkl
thanh_hoa_pca.pkl
thanh_hoa_strong_vars.pkl
thanh_hoa_inference_info.pkl
# tương tự cho nghe_an, ha_tinh, hue
```

---

### Bước 2 — Deploy Backend lên Render

1. [render.com](https://render.com) → **New → Web Service**
2. Kết nối repo GitHub, chọn thư mục **`backend/`**
3. Cấu hình:

   | Field | Value |
   |-------|-------|
   | Environment | Python 3 |
   | Region | Singapore |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

4. Thêm **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `GCP_SA_JSON` | Nội dung JSON của Google Service Account |
   | `DRIVE_FOLDER_ID` | ID thư mục Google Drive chứa file `.pkl` |
   | `ADMIN_TOKEN` | Chuỗi bí mật bất kỳ (bảo vệ `/api/sync`) |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` |

5. Deploy → ghi lại URL: `https://aqi-forecast-api.onrender.com`

> **Render Free tier:** Server ngủ sau 15 phút idle.
> Dùng [UptimeRobot](https://uptimerobot.com) ping mỗi 10 phút để giữ thức.

---

### Bước 3 — Deploy Frontend lên Vercel

1. [vercel.com](https://vercel.com) → **New Project**
2. Import repo, **Root Directory = `frontend/`**
3. Framework Preset: **Vite**
4. Environment Variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://aqi-forecast-api.onrender.com` |

5. Deploy → Vercel tự chạy `npm run build`

> Sau khi có Vercel URL, cập nhật `ALLOWED_ORIGINS` trong Render.

---

### Bước 4 — Dev Local

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt

export GCP_SA_JSON='{"type":"service_account",...}'
export DRIVE_FOLDER_ID='1abcXYZ...'

uvicorn main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
# Vite proxy: /api → localhost:8000
```

---

## Dependencies đáng chú ý

### Frontend
| Package | Mục đích |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `plotly.js-dist-min` + `react-plotly.js` | Biểu đồ (gauge, line, bar, pie) |
| `leaflet` (CDN, load runtime) | Bản đồ tương tác Tab Du lịch |
| OSRM public API | Routing chỉ đường trong map |
| OpenStreetMap / OpenTopoMap / Esri | Tile layers bản đồ |

### Backend
| Package | Mục đích |
|---------|---------|
| `fastapi` + `uvicorn` | Web server |
| `catboost` + `xgboost` + `lightgbm` | Inference models |
| `scikit-learn` | PCA + scaler |
| `pandas` + `numpy` | Feature engineering |
| `google-api-python-client` | Drive sync |

---

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/api/health` | Health check + cache info |
| `GET` | `/api/provinces` | Danh sách 4 tỉnh |
| `GET` | `/api/forecast/{slug}` | AQI hiện tại + dự báo 72h |
| `GET` | `/api/history/{slug}?days=7` | Lịch sử AQI (1–30 ngày) |
| `GET` | `/api/model-summary/{slug}` | Kết quả so sánh 16 model |
| `POST`| `/api/sync?force=false` | Sync artifacts từ Drive |
| `DELETE`| `/api/cache` | Xóa RAM cache thủ công |

Swagger UI: `https://your-api.onrender.com/docs`

---

## Biến môi trường

### Backend (Render)
| Key | Bắt buộc | Mô tả |
|-----|----------|-------|
| `GCP_SA_JSON` | Có* | JSON string của Google Service Account |
| `DRIVE_FOLDER_ID` | Có* | ID folder Google Drive chứa `.pkl` |
| `ADMIN_TOKEN` | Khuyến nghị | Bảo vệ `/api/sync` và `/api/cache` |
| `ALLOWED_ORIGINS` | Có | URL Vercel, phân tách bằng dấu phẩy |

> *Không bắt buộc nếu copy `.pkl` trực tiếp vào `backend/best_pca_models/`

### Frontend (Vercel)
| Key | Bắt buộc | Mô tả |
|-----|----------|-------|
| `VITE_API_URL` | Có | URL backend Render (không có `/` cuối) |

---

## Cập nhật Model mới

```bash
curl -X POST "https://YOUR_API_URL/api/sync?force=true" \
     -H "X-Admin-Token: YOUR_TOKEN"
```

```json
{ "success": true, "message": "Đã tải 20 file mới.", "downloaded": 20 }
```

---

## Ghi chú kỹ thuật

**Caching backend:**
- RAM cache TTL 2h (fresh), fallback stale 24h khi gặp rate limit 429 từ Open-Meteo
- Pre-warm 4 tỉnh lúc startup (chạy nền, không block)
- Endpoint `DELETE /api/cache` để force refresh khi cần

**Bản đồ Tab Du lịch:**
- Leaflet load qua CDN runtime (không bundle vào Vite build)
- Routing dùng OSRM public API (`router.project-osrm.org`) — miễn phí, không cần API key
- Tọa độ điểm du lịch nguồn: UNESCO World Heritage Centre, Sandee Beach Maps, OpenStreetMap Nominatim

**Dữ liệu:**
- Nguồn: Open-Meteo Air Quality API (CAMS Global) + ERA5 Weather
- Giai đoạn training: 08/2022 – 03/2026
- 16 model so sánh, pipeline: PCA 95% → best model (CatBoost / Lasso tuỳ tỉnh)
- 7 horizon dự báo: 1h, 3h, 6h, 12h, 24h, 48h, 72h
- 4 tỉnh: Thanh Hóa, Nghệ An, Hà Tĩnh, Huế
