import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import Tab1Forecast from './components/Tab1Forecast.jsx';
import Tab2Classification from './components/Tab2Classification.jsx';
import Tab3History from './components/Tab3History.jsx';
import Tab5ModelData from './components/Tab5ModelData.jsx';

const TABS = [
  { id: 'forecast',       icon: '📡', label: 'Dự báo' },
  { id: 'classification', icon: '📊', label: 'Phân loại & Khuyến nghị' },
  { id: 'history',        icon: '📅', label: 'Lịch sử' },
  { id: 'models',         icon: '📂', label: 'Dữ liệu & Mô hình' },
];

export default function App() {
  const [provinces, setProvinces]     = useState([]);
  const [activeSlug, setActiveSlug]   = useState('thanh_hoa');
  const [activeTab, setActiveTab]     = useState('forecast');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // Load provinces list once
  useEffect(() => {
    api.getProvinces()
      .then(setProvinces)
      .catch(() => setProvinces([
        { name: 'Thanh Hóa', slug: 'thanh_hoa', lat: 19.808, lon: 105.776 },
        { name: 'Nghệ An',   slug: 'nghe_an',   lat: 19.234, lon: 104.920 },
        { name: 'Hà Tĩnh',   slug: 'ha_tinh',   lat: 18.343, lon: 105.906 },
        { name: 'Huế',       slug: 'hue',        lat: 16.462, lon: 107.595 },
      ]));
  }, []);

  const loadForecast = useCallback(async (slug) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getForecast(slug);
      setForecastData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load forecast on province change
  useEffect(() => {
    loadForecast(activeSlug);
  }, [activeSlug, loadForecast]);

  const currentProvince = provinces.find(p => p.slug === activeSlug);
  const currentLevel    = forecastData?.current?.level ?? 0;
  const alertColors     = ['#e8f5e9', '#fffde7', '#fff3e0', '#fdecea', '#f3e5f5', '#fdecea'];
  const borderColors    = ['#4caf50', '#f9a825', '#ff9800', '#f44336', '#9c27b0', '#b71c1c'];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #1565c0 0%, #0097a7 100%)',
        color: '#fff',
        padding: '16px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 800 }}>
              🌬️ Dự báo Chất lượng Không khí
            </h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: 4 }}>
              Miền Trung Việt Nam · Mô hình huấn luyện 08/2022 – 03/2026
            </p>
          </div>

          {/* Province Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>📍</span>
            <select
              value={activeSlug}
              onChange={e => setActiveSlug(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                cursor: 'pointer',
                outline: 'none',
                backdropFilter: 'blur(8px)',
              }}
            >
              {provinces.map(p => (
                <option key={p.slug} value={p.slug} style={{ color: '#1a202c', background: '#fff' }}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => loadForecast(activeSlug)}
              disabled={loading}
              title="Làm mới dữ liệu"
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
              }}
            >
              {loading ? '⏳' : '🔄'}
            </button>
          </div>
        </div>
      </header>

      {/* ── AQI Alert Banner (nếu AQI >= Kém) ─────────────────────────── */}
      {forecastData && currentLevel >= 2 && (
        <div style={{
          background: alertColors[currentLevel],
          borderBottom: `3px solid ${borderColors[currentLevel]}`,
          padding: '10px 24px',
          textAlign: 'center',
          fontSize: '0.92rem',
          fontWeight: 600,
        }}>
          {['⚠️', '⚠️', '⚠️', '🚨', '🚨', '⛔'][currentLevel]}
          {' '}AQI hiện tại tại <b>{forecastData.province}</b> đang ở mức{' '}
          <b style={{ color: borderColors[currentLevel] }}>
            {forecastData.current.label} ({forecastData.current.aqi})
          </b>
          {' '}— {forecastData.recommendation?.desc}
        </div>
      )}

      {/* ── Error State ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          margin: '16px 24px',
          padding: '14px 18px',
          background: '#fdecea',
          border: '1px solid #f44336',
          borderRadius: 10,
          color: '#c62828',
        }}>
          ❌ Lỗi: {error}
        </div>
      )}

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e0e7f0',
        padding: '0 24px',
        overflowX: 'auto',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 18px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #1565c0' : '3px solid transparent',
                background: 'none',
                color: activeTab === tab.id ? '#1565c0' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {loading && !forecastData ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activeTab === 'forecast'       && <Tab1Forecast data={forecastData} loading={loading} />}
            {activeTab === 'classification' && <Tab2Classification data={forecastData} />}
            {activeTab === 'history'        && <Tab3History slug={activeSlug} />}
            {activeTab === 'models'         && <Tab5ModelData slug={activeSlug} />}
          </>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: '#94a3b8',
        fontSize: '0.8rem',
        borderTop: '1px solid #e0e7f0',
        marginTop: 40,
        background: '#fff',
      }}>
        Dữ liệu: <a href="https://open-meteo.com" target="_blank" rel="noreferrer" style={{ color: '#1565c0' }}>Open-Meteo CAMS Global</a>
        {' '}· React + FastAPI · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[240, 180, 400].map((h, i) => (
        <div key={i} style={{
          height: h,
          borderRadius: 12,
          background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
