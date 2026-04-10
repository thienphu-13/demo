import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import Tab1Forecast from './components/Tab1Forecast.jsx';
import Tab2Classification from './components/Tab2Classification.jsx';
import Tab3History from './components/Tab3History.jsx';
import Tab5ModelData from './components/Tab5ModelData.jsx';

const TABS = [
  { id: 'forecast',       label: 'Dự báo' },
  { id: 'classification', label: 'Phân loại & Khuyến nghị' },
  { id: 'history',        label: 'Lịch sử' },
  { id: 'models',         label: 'Dữ liệu & Mô hình' },
];

const LEVEL_BG     = ['#e8f5e9','#fffde7','#fff3e0','#fdecea','#f3e5f5','#fdecea'];
const LEVEL_BORDER = ['#4caf50','#f9a825','#ff9800','#f44336','#9c27b0','#b71c1c'];

export default function App() {
  const [provinces, setProvinces]       = useState([]);
  const [activeSlug, setActiveSlug]     = useState('thanh_hoa');
  const [activeTab, setActiveTab]       = useState('forecast');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    api.getProvinces().then(setProvinces).catch(() =>
      setProvinces([
        { name: 'Thanh Hóa', slug: 'thanh_hoa' },
        { name: 'Nghệ An',   slug: 'nghe_an'   },
        { name: 'Hà Tĩnh',   slug: 'ha_tinh'   },
        { name: 'Huế',       slug: 'hue'        },
      ])
    );
  }, []);

  const loadForecast = useCallback(async (slug) => {
    setLoading(true); setError(null);
    try   { setForecastData(await api.getForecast(slug)); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { loadForecast(activeSlug); }, [activeSlug, loadForecast]);

  const lvl = forecastData?.current?.level ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg,#1565c0 0%,#0097a7 100%)',
        color: '#fff', padding: '14px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.1rem,2.5vw,1.6rem)', fontWeight: 800 }}>
              Dự báo Chất lượng Không khí — Miền Trung Việt Nam
            </h1>
            <p style={{ fontSize: '0.8rem', opacity: 0.82, marginTop: 3 }}>
              Dữ liệu: 08/2022 – 03/2026 &nbsp;|&nbsp; Phương pháp: PCA + Machine Learning
            </p>
          </div>
        </div>
      </header>

      {/* ── Alert Banner ────────────────────────────────────────────────── */}
      {forecastData && lvl >= 2 && (
        <div style={{
          background: LEVEL_BG[lvl], borderBottom: `3px solid ${LEVEL_BORDER[lvl]}`,
          padding: '9px 24px', textAlign: 'center',
          fontSize: '0.88rem', fontWeight: 600, color: '#222',
        }}>
          AQI tại <b>{forecastData.province}</b> đang ở mức{' '}
          <b style={{ color: LEVEL_BORDER[lvl] }}>
            {forecastData.current.label} ({forecastData.current.aqi})
          </b>
          {' '}— {forecastData.recommendation?.desc}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ margin: '12px 24px', padding: '12px 16px', background: '#fdecea', border: '1px solid #f44336', borderRadius: 8, color: '#c62828', fontSize: '0.9rem' }}>
          Lỗi: {error}
        </div>
      )}

      {/* ── Tab Nav ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e7f0', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', padding: '0 16px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '13px 18px', border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #1565c0' : '3px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? '#1565c0' : '#64748b',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
{/* Province selector — chỉ hiện ở tab cần thiết */}
{['forecast','history','models'].includes(activeTab) && (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Chọn tỉnh:</span>
      <select
        value={activeSlug}
        onChange={e => setActiveSlug(e.target.value)}
        style={{
          padding: '7px 14px', borderRadius: 8,
          border: '1px solid #e0e7f0',
          fontSize: '0.92rem', fontWeight: 600,
          background: '#fff', color: '#1e293b',
          cursor: 'pointer', outline: 'none',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {provinces.map(p => (
          <option key={p.slug} value={p.slug}>{p.name}</option>
        ))}
      </select>
      {loading && <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>⏳ Đang tải...</span>}
    </div>
  </div>
)}
      
      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        {loading && !forecastData ? <LoadingSkeleton /> : (
          <>
            {activeTab === 'forecast'       && <Tab1Forecast data={forecastData} loading={loading} />}
            {activeTab === 'classification' && <Tab2Classification data={forecastData} />}
            {activeTab === 'history'        && <Tab3History slug={activeSlug} />}
            {activeTab === 'models'         && <Tab5ModelData slug={activeSlug} />}
          </>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.78rem', borderTop: '1px solid #e0e7f0', background: '#fff', marginTop: 32 }}>
        Nguồn dữ liệu: Open-Meteo CAMS Global &nbsp;|&nbsp; &nbsp;|&nbsp; React + FastAPI
      </footer>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[200, 160, 380].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}
