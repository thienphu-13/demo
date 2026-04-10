"""
drive_sync.py — Sync model artifacts từ Google Drive Service Account.
Dùng biến môi trường thay vì Streamlit secrets.
"""
from __future__ import annotations
import io, os, json
from datetime import datetime, timezone
from pathlib import Path

from config import BEST_MODEL_DIR


def _get_sa_info() -> dict | None:
    """Đọc service account JSON từ env var GCP_SA_JSON."""
    raw = os.environ.get("GCP_SA_JSON")
    if not raw:
        return None
    try:
        info = json.loads(raw)
        return info
    except Exception:
        return None


def _get_folder_id() -> str | None:
    return os.environ.get("DRIVE_FOLDER_ID")


def sync_from_drive(force: bool = False) -> tuple[bool, str, int]:
    """
    Tải artifacts (.pkl, .csv) từ Google Drive về BEST_MODEL_DIR.
    Trả về (success, message, n_downloaded).
    """
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaIoBaseDownload
    except ImportError:
        return False, "Thiếu thư viện: pip install google-api-python-client google-auth", 0

    sa_info = _get_sa_info()
    if not sa_info:
        return False, "Chưa đặt biến môi trường GCP_SA_JSON.", 0

    folder_id = _get_folder_id()
    if not folder_id:
        return False, "Chưa đặt biến môi trường DRIVE_FOLDER_ID.", 0

    try:
        creds   = service_account.Credentials.from_service_account_info(
            sa_info, scopes=["https://www.googleapis.com/auth/drive.readonly"])
        service = build("drive", "v3", credentials=creds, cache_discovery=False)
    except Exception as e:
        return False, f"Lỗi khởi tạo Drive service: {e}", 0

    try:
        drive_files = service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="files(id, name, modifiedTime, size)",
            pageSize=100,
        ).execute().get("files", [])
    except Exception as e:
        return False, f"Lỗi liệt kê file Drive: {e}", 0

    drive_files = [f for f in drive_files if Path(f["name"]).suffix in {".pkl", ".csv"}]
    if not drive_files:
        return False, "Không tìm thấy file .pkl/.csv trong thư mục Drive.", 0

    BEST_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    downloaded = 0

    for f in drive_files:
        local_path  = BEST_MODEL_DIR / f["name"]
        drive_mtime = datetime.fromisoformat(f["modifiedTime"].replace("Z", "+00:00"))

        if not force and local_path.exists():
            local_mtime = datetime.fromtimestamp(local_path.stat().st_mtime, tz=timezone.utc)
            if drive_mtime <= local_mtime:
                continue

        try:
            buf     = io.BytesIO()
            request = service.files().get_media(fileId=f["id"])
            dl      = MediaIoBaseDownload(buf, request)
            done    = False
            while not done:
                _, done = dl.next_chunk()
            local_path.write_bytes(buf.getvalue())
            ts = drive_mtime.timestamp()
            os.utime(local_path, (ts, ts))
            downloaded += 1
        except Exception:
            continue

    msg = f"Đã tải {downloaded} file mới." if downloaded else "Tất cả model đã up-to-date."
    return True, msg, downloaded
