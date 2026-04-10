# 🌬️ AQI Forecast — Miền Trung VN
## React + FastAPI (Vercel + Render)

Chuyển đổi từ Streamlit monolith sang kiến trúc tách bạch:
- **Backend**: FastAPI trên [Render](https://render.com) (Singapore)
- **Frontend**: React + Vite + Plotly.js trên [Vercel](https://vercel.com)

---

## 📁 Cấu trúc dự án

```
aqi-app/
├── backend/
│   ├── main.py              # FastAPI app + tất cả routes
│   ├── config.py            # Hằng số (AQI bins, tỉnh, model summary...)
│   ├── data.py              # Fetch Open-Meteo + feature engineering
│   ├── model_inference.py   # Load pkl artifacts + predict
│   ├── drive_sync.py        # Sync model từ Google Drive
│   ├── requirements.txt
│   └── render.yaml          # Render deployment config
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # Entry point
│   │   ├── App.jsx          # Root component (header, tabs, province selector)
│   │   ├── api.js           # Axios wrapper → FastAPI
│   │   ├── constants.js     # AQI colors, labels, helper functions
│   │   └── components/
│   │       ├── Tab1Forecast.jsx        # Gauge + dự báo 72h + chỉ số ô nhiễm
│   │       ├── Tab2Classification.jsx  # Phân loại + khuyến nghị sức khỏe
│   │       ├── Tab3History.jsx         # Lịch sử AQI + hourly pattern + pie
│   │       └── Tab5ModelData.jsx       # Bảng so sánh mô hình + RMSE chart
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       # Dev proxy: /api → localhost:8000
│   └── vercel.json          # SPA rewrite rules
│
└── README.md
```

---

## 🚀 Hướng dẫn Deploy từng bước

### Bước 1 — Chuẩn bị

```bash
git clone https://github.com/your-username/aqi-app.git
cd aqi-app
```

Đảm bảo thư mục `backend/best_pca_models/` chứa các file:
```
thanh_hoa_best_model.pkl
thanh_hoa_scaler_pca.pkl
thanh_hoa_pca.pkl
thanh_hoa_strong_vars.pkl
thanh_hoa_inference_info.pkl
# ... tương tự cho nghe_an, ha_tinh, hue
```

---

### Bước 2 — Deploy Backend lên Render

1. Vào [render.com](https://render.com) → **New → Web Service**
2. Kết nối repo GitHub, chọn thư mục **`backend/`**
3. Cấu hình:
   | Field | Value |
   |-------|-------|
   | Environment | Python 3 |
   | Region | Singapore |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

4. Thêm **Environment Variables** (tab "Environment"):

   | Key | Value |
   |-----|-------|
   | `GCP_SA_JSON` | Nội dung JSON của Google Service Account (copy toàn bộ) |
   | `DRIVE_FOLDER_ID` | ID thư mục Google Drive chứa file `.pkl` |
   | `ADMIN_TOKEN` | Chuỗi bí mật bất kỳ (bảo vệ endpoint `/api/sync`) |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (điền sau khi có Vercel URL) |

5. Click **Deploy** → đợi ~2 phút. Ghi lại URL dạng:
   `https://aqi-forecast-api.onrender.com`

> **Lưu ý Render Free:** Server sẽ "ngủ" sau 15 phút idle.
> Dùng [UptimeRobot](https://uptimerobot.com) để ping mỗi 10 phút giữ server thức.

---

### Bước 3 — Deploy Frontend lên Vercel

1. Vào [vercel.com](https://vercel.com) → **New Project**
2. Import repo, chọn **Root Directory = `frontend/`**
3. Framework Preset: **Vite**
4. Thêm **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://aqi-forecast-api.onrender.com` |

5. Click **Deploy** → Vercel tự chạy `npm run build`

> Sau khi có Vercel URL, quay lại Render và cập nhật `ALLOWED_ORIGINS`.

---

### Bước 4 — Dev Local (không cần deploy)

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt

# Đặt env vars tạm thời (hoặc tạo file .env)
export GCP_SA_JSON='{"type":"service_account",...}'
export DRIVE_FOLDER_ID='1abcXYZ...'

uvicorn main:app --reload --port 8000
# → API docs: http://localhost:8000/docs
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# → App: http://localhost:5173
# Vite tự proxy /api → localhost:8000
```

---

## 🔌 API Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/provinces` | Danh sách 4 tỉnh |
| `GET` | `/api/forecast/{slug}` | Dự báo AQI hiện tại + 72h |
| `GET` | `/api/history/{slug}?days=7` | Lịch sử AQI (1–30 ngày) |
| `GET` | `/api/model-summary/{slug}` | Kết quả so sánh mô hình |
| `POST`| `/api/sync?force=false` | Sync artifacts từ Drive |

**Swagger UI:** `https://your-api.onrender.com/docs`

---

## 🌍 Biến môi trường

### Backend (Render)
| Key | Bắt buộc | Mô tả |
|-----|----------|-------|
| `GCP_SA_JSON` | Có* | JSON string của Google Service Account |
| `DRIVE_FOLDER_ID` | Có* | ID folder Google Drive chứa `.pkl` |
| `ADMIN_TOKEN` | Khuyến nghị | Bảo vệ endpoint `/api/sync` |
| `ALLOWED_ORIGINS` | Có | URL Vercel, phân tách bằng dấu phẩy |

> *Không bắt buộc nếu copy `.pkl` trực tiếp vào `backend/best_pca_models/`

### Frontend (Vercel)
| Key | Bắt buộc | Mô tả |
|-----|----------|-------|
| `VITE_API_URL` | Có | URL backend Render (không có dấu `/` cuối) |

---

## 🔄 Cập nhật Model mới

Khi có model artifact mới trên Google Drive:

```bash
# Gọi API sync (thay YOUR_TOKEN và YOUR_API_URL)
curl -X POST "https://YOUR_API_URL/api/sync?force=true" \
     -H "X-Admin-Token: YOUR_TOKEN"
```

Response:
```json
{ "success": true, "message": "Đã tải 20 file mới.", "downloaded": 20 }
```

---

## ⚖️ So sánh Streamlit vs React+FastAPI

| | Streamlit | React + FastAPI |
|--|-----------|-----------------|
| Deploy | Streamlit Cloud (1 nơi) | Vercel + Render (2 nơi) |
| Chi phí | Free | Free (có giới hạn) |
| Tốc độ | Chậm hơn (Python render) | Nhanh hơn (SPA) |
| Tuỳ chỉnh UI | Hạn chế | Tự do hoàn toàn |
| Caching | `@st.cache_data` | `lru_cache` + React state |
| Scale | Khó | Dễ (tách BE/FE) |
| Phức tạp | Thấp | Trung bình |
