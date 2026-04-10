"""
config.py — Hằng số dùng chung toàn backend.
"""
from pathlib import Path

BASE_DIR       = Path(__file__).parent
BEST_MODEL_DIR = BASE_DIR / "best_pca_models"

TARGET      = "us_aqi"
HORIZONS    = [1, 3, 6, 12, 24, 48, 72]
TARGET_COLS = [f"target_t{h}h" for h in HORIZONS]

AQI_BINS   = [0, 50, 100, 150, 200, 300, 500]
AQI_LABELS = ["Tốt", "Trung bình", "Kém", "Xấu", "Rất xấu", "Nguy hại"]
AQI_COLORS = ["#00e400", "#ffff00", "#ff7e00", "#ff0000", "#8f3f97", "#7e0023"]

POLLUTANT_THRESHOLDS = {
    "pm2_5":            {"who": 15,    "vn": 25,    "unit": "µg/m³", "name": "PM2.5"},
    "pm10":             {"who": 45,    "vn": 50,    "unit": "µg/m³", "name": "PM10"},
    "nitrogen_dioxide": {"who": 25,    "vn": 100,   "unit": "µg/m³", "name": "NO₂"},
    "ozone":            {"who": 100,   "vn": 120,   "unit": "µg/m³", "name": "O₃"},
    "sulphur_dioxide":  {"who": 40,    "vn": 350,   "unit": "µg/m³", "name": "SO₂"},
    "carbon_monoxide":  {"who": 4000,  "vn": 10000, "unit": "µg/m³", "name": "CO"},
}

PHYSICAL_BOUNDS = {
    "us_aqi": (0, 500), "pm2_5": (0, 500), "pm10": (0, 1000),
    "carbon_monoxide": (0, 50_000), "nitrogen_dioxide": (0, 1000),
    "sulphur_dioxide": (0, 2000), "ozone": (0, 600),
    "temperature_2m": (-10, 50), "relative_humidity_2m": (0, 100),
    "pressure_msl": (900, 1100), "wind_speed_10m": (0, 150),
    "shortwave_radiation": (0, 1500),
}

PROVINCES = {
    "Thanh Hóa": {"slug": "thanh_hoa", "lat": 19.808, "lon": 105.776, "tz": "Asia/Bangkok"},
    "Nghệ An":   {"slug": "nghe_an",   "lat": 19.234, "lon": 104.920, "tz": "Asia/Bangkok"},
    "Hà Tĩnh":   {"slug": "ha_tinh",   "lat": 18.343, "lon": 105.906, "tz": "Asia/Bangkok"},
    "Huế":       {"slug": "hue",       "lat": 16.462, "lon": 107.595, "tz": "Asia/Bangkok"},
}

# Slug → Province name lookup
SLUG_TO_NAME = {v["slug"]: k for k, v in PROVINCES.items()}

AQ_VARS = [
    "us_aqi", "european_aqi", "pm2_5", "pm10",
    "carbon_monoxide", "nitrogen_dioxide",
    "sulphur_dioxide", "ozone",
    "aerosol_optical_depth", "dust",
]
WEATHER_VARS = [
    "temperature_2m", "relative_humidity_2m", "dew_point_2m",
    "apparent_temperature", "precipitation", "rain",
    "pressure_msl", "cloud_cover", "wind_speed_10m",
    "wind_direction_10m", "wind_gusts_10m", "shortwave_radiation",
]

MODEL_SUMMARY = {
    "thanh_hoa": {
        "name": "Thanh Hóa", "best": "CatBoost", "n_pc": 18,
        "models": [
            ("LinearRegression", 18.52, 67.8), ("Ridge", 18.48, 68.1),
            ("Lasso", 18.61, 67.3), ("DecisionTree", 22.14, 58.9),
            ("RandomForest", 16.83, 71.2), ("ExtraTrees", 16.91, 71.0),
            ("GradientBoosting", 15.87, 73.4), ("XGBoost", 15.12, 75.6),
            ("LightGBM", 14.89, 76.3), ("CatBoost", 13.97, 77.5),
            ("SVR", 19.23, 65.4), ("KNN", 20.11, 63.2),
            ("LSTM", 16.44, 72.1), ("GRU", 16.38, 72.3),
            ("BiLSTM", 16.21, 72.8), ("Transformer", 17.82, 69.5),
            ("NBEATS", 17.15, 70.8),
        ],
    },
    "nghe_an": {
        "name": "Nghệ An", "best": "CatBoost", "n_pc": 17,
        "models": [
            ("LinearRegression", 13.71, 75.2), ("Ridge", 13.68, 75.4),
            ("Lasso", 13.84, 74.8), ("DecisionTree", 16.92, 66.1),
            ("RandomForest", 12.43, 78.9), ("ExtraTrees", 12.51, 78.6),
            ("GradientBoosting", 11.72, 80.5), ("XGBoost", 11.18, 82.1),
            ("LightGBM", 10.98, 82.7), ("CatBoost", 10.47, 83.3),
            ("SVR", 14.21, 73.3), ("KNN", 14.88, 71.5),
            ("LSTM", 12.14, 79.6), ("GRU", 12.08, 79.8),
            ("BiLSTM", 11.93, 80.2), ("Transformer", 13.05, 76.9),
            ("NBEATS", 12.76, 77.8),
        ],
    },
    "ha_tinh": {
        "name": "Hà Tĩnh", "best": "Lasso", "n_pc": 18,
        "models": [
            ("LinearRegression", 13.82, 75.1), ("Ridge", 13.79, 75.3),
            ("Lasso", 10.52, 82.9), ("DecisionTree", 17.14, 65.8),
            ("RandomForest", 12.67, 78.3), ("ExtraTrees", 12.74, 78.1),
            ("GradientBoosting", 11.89, 80.1), ("XGBoost", 11.34, 81.7),
            ("LightGBM", 11.15, 82.2), ("CatBoost", 10.89, 82.6),
            ("SVR", 14.43, 72.9), ("KNN", 15.12, 70.8),
            ("LSTM", 12.31, 79.1), ("GRU", 12.25, 79.3),
            ("BiLSTM", 12.09, 79.8), ("Transformer", 13.22, 76.5),
            ("NBEATS", 12.94, 77.4),
        ],
    },
    "hue": {
        "name": "Huế", "best": "CatBoost", "n_pc": 19,
        "models": [
            ("LinearRegression", 12.34, 80.1), ("Ridge", 12.31, 80.3),
            ("Lasso", 12.47, 79.8), ("DecisionTree", 15.23, 72.4),
            ("RandomForest", 11.12, 83.5), ("ExtraTrees", 11.19, 83.3),
            ("GradientBoosting", 10.43, 85.1), ("XGBoost", 9.98, 86.7),
            ("LightGBM", 9.78, 87.2), ("CatBoost", 9.38, 88.6),
            ("SVR", 12.89, 78.4), ("KNN", 13.54, 76.5),
            ("LSTM", 10.87, 84.2), ("GRU", 10.81, 84.4),
            ("BiLSTM", 10.66, 84.9), ("Transformer", 11.74, 81.8),
            ("NBEATS", 11.46, 82.7),
        ],
    },
}

RECOMMENDATIONS = {
    0: {
        "icon": "🟢", "label_en": "Good",
        "desc": "Chất lượng không khí tốt. Không ảnh hưởng tới sức khỏe.",
        "general": ["Thích hợp cho mọi hoạt động ngoài trời.",
                    "Thời điểm lý tưởng để tập thể dục, đi bộ, đạp xe."],
        "sensitive": ["Nhóm nhạy cảm có thể hoạt động bình thường."],
        "safe_hours": "✅ Tất cả các giờ trong ngày đều an toàn.",
        "activities": ["🏃 Chạy bộ / đi bộ ngoài trời", "🚴 Đạp xe",
                       "⚽ Thể thao ngoài trời", "🧘 Yoga ngoài trời", "🌳 Dã ngoại"],
        "avoid": [],
    },
    1: {
        "icon": "🟡", "label_en": "Moderate",
        "desc": "Chất lượng không khí chấp nhận được.",
        "general": ["Đa số người có thể hoạt động ngoài trời bình thường.",
                    "Hạn chế hoạt động cường độ cao kéo dài."],
        "sensitive": ["Người hen suyễn, tim mạch nên hạn chế tập nặng ngoài trời.",
                      "Đeo khẩu trang N95 khi ra ngoài lâu."],
        "safe_hours": "⏰ Sáng sớm (5–8h) và chiều tối (17–20h) thường tốt hơn.",
        "activities": ["🚶 Đi bộ nhẹ nhàng", "🏋️ Tập trong nhà", "🛒 Sinh hoạt bình thường"],
        "avoid": ["❌ Tránh tập cardio cường độ cao ngoài trời kéo dài > 1 giờ"],
    },
    2: {
        "icon": "🟠", "label_en": "Unhealthy for Sensitive",
        "desc": "Chất lượng không khí kém. Có thể gây hại cho nhóm dễ bị ảnh hưởng.",
        "general": ["Giảm thời gian hoạt động ngoài trời.",
                    "Đóng cửa sổ, bật lọc không khí nếu có."],
        "sensitive": ["Người già, trẻ em, phụ nữ mang thai nên ở trong nhà.",
                      "Bắt buộc đeo khẩu trang N95/KN95 khi ra ngoài."],
        "safe_hours": "⏰ Tương đối an toàn: 6–8h sáng và 18–21h tối. Tránh 10–16h.",
        "activities": ["🏠 Ưu tiên hoạt động trong nhà",
                       "🚗 Di chuyển bằng phương tiện có điều hòa"],
        "avoid": ["❌ Tránh tập thể dục ngoài trời", "❌ Không mở cửa sổ ban ngày"],
    },
    3: {
        "icon": "🔴", "label_en": "Unhealthy",
        "desc": "Chất lượng không khí xấu. Ảnh hưởng sức khỏe toàn dân.",
        "general": ["Hạn chế ra ngoài ở mức tối thiểu.",
                    "Đóng kín cửa, dùng máy lọc không khí."],
        "sensitive": ["Người có bệnh hô hấp, tim mạch phải ở trong nhà hoàn toàn.",
                      "Liên hệ bác sĩ nếu có triệu chứng bất thường."],
        "safe_hours": "⚠️ Không có khung giờ thực sự an toàn. Nếu bắt buộc ra ngoài, chọn trước 7h sáng.",
        "activities": ["🏠 Ở trong nhà", "📱 Làm việc/học tập online"],
        "avoid": ["❌ Không ra ngoài không cần thiết", "❌ Không mở cửa sổ",
                  "❌ Không tập thể dục ngoài trời"],
    },
    4: {
        "icon": "🟣", "label_en": "Very Unhealthy",
        "desc": "Chất lượng không khí rất xấu. Khẩn cấp với nhóm nhạy cảm.",
        "general": ["Không ra ngoài trừ trường hợp khẩn cấp.",
                    "Dùng máy lọc không khí trong nhà liên tục."],
        "sensitive": ["Nguy hiểm — ở trong nhà hoàn toàn.",
                      "Gọi cấp cứu nếu khó thở, đau ngực."],
        "safe_hours": "🚫 Không có khung giờ an toàn. Tránh ra ngoài hoàn toàn.",
        "activities": ["🏠 Ở trong nhà tuyệt đối"],
        "avoid": ["❌ Tuyệt đối không ra ngoài", "❌ Không hoạt động thể chất"],
    },
    5: {
        "icon": "⛔", "label_en": "Hazardous",
        "desc": "Nguy hại — tình trạng khẩn cấp về môi trường.",
        "general": ["Tình trạng khẩn cấp. Thực hiện theo chỉ dẫn cơ quan chức năng.",
                    "Ở trong nhà kín, dùng máy lọc HEPA."],
        "sensitive": ["Sơ tán khỏi khu vực nếu được.", "Gọi hotline y tế: 1800 599 920."],
        "safe_hours": "🚫 Không có khung giờ an toàn. Đây là tình trạng khẩn cấp.",
        "activities": ["🏠 Ở trong nhà kín tuyệt đối"],
        "avoid": ["❌ Không ra ngoài dưới bất kỳ lý do nào"],
    },
}
