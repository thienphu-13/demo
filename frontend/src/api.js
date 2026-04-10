/**
 * api.js — Wrapper gọi FastAPI backend.
 * BASE_URL đọc từ env var VITE_API_URL (set trong Vercel).
 * Dev: proxy qua vite.config.js → localhost:8000
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /** Danh sách tỉnh */
  getProvinces: () => apiFetch('/api/provinces'),

  /** Dự báo AQI (current + 72h forecast) */
  getForecast: (slug) => apiFetch(`/api/forecast/${slug}`),

  /** Lịch sử AQI */
  getHistory: (slug, days = 7) => apiFetch(`/api/history/${slug}?days=${days}`),

  /** So sánh mô hình */
  getModelSummary: (slug) => apiFetch(`/api/model-summary/${slug}`),

  /** Sync Drive (admin) */
  syncDrive: (force = false, adminToken = '') =>
    apiFetch(`/api/sync?force=${force}`, {
      method: 'POST',
      headers: { 'X-Admin-Token': adminToken },
    }),
};
