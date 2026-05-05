import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import Tab1Forecast from './components/Tab1Forecast.jsx';
import Tab2Classification from './components/Tab2Classification.jsx';
import Tab3History from './components/Tab3History.jsx';
import Tab5ModelData from './components/Tab5ModelData.jsx';
import Tab6Tourism from './components/Tab6Tourism.jsx';

const TABS = [
  { id: 'forecast',       label: 'Dự báo'                 },
  { id: 'classification', label: 'Phân loại & Khuyến nghị'},
  { id: 'history',        label: 'Lịch sử'                },
  { id: 'models',         label: 'Dữ liệu & Mô hình'      },
  { id: 'tourism',        label: 'Du lịch'                },
];

const LEVEL_BG     = ['#e8f5e9','#fffde7','#fff3e0','#fdecea','#f3e5f5','#fdecea'];
const LEVEL_BORDER = ['#4caf50','#f9a825','#ff9800','#f44336','#9c27b0','#b71c1c'];

// ── Inject CSS responsive một lần ────────────────────────────────────────────
const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box;}

/* Tab nav cuộn ngang trên mobile */
.tab-nav{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tab-nav::-webkit-scrollbar{display:none;}

/* Sidebar desktop */
.province-sticky{
  position:fixed;top:200px;right:14px;z-index:998;
  background:rgba(255,255,255,.97);
  border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.15);
  border:1px solid #e0e7f0;overflow:hidden;transition:width .25s ease;
}

/* Mobile province bar */
.mobile-prov{
  display:none;overflow-x:auto;-webkit-overflow-scrolling:touch;
  gap:8px;padding:8px 14px;background:#fff;border-bottom:1px solid #e0e7f0;
  flex-shrink:0;
}
.mobile-prov::-webkit-scrollbar{display:none;}

/* Responsive breakpoints */
@media(max-width:768px){
  .province-sticky{display:none!important;}
  .main-content{padding-right:16px!important;}
  .mobile-prov{display:flex;}
  .header-sub{display:none;}
}

/* Grid helpers – dùng style prop override khi cần */
@media(max-width:900px){
  .g-gauge{grid-template-columns:1fr!important;}
  .g-4prov{grid-template-columns:repeat(2,1fr)!important;}
  .g-5{grid-template-columns:repeat(3,1fr)!important;}
}
@media(max-width:600px){
  .g-2{grid-template-columns:1fr!important;}
  .g-3{grid-template-columns:1fr 1fr!important;}
  .g-5{grid-template-columns:repeat(2,1fr)!important;}
  .g-4prov{grid-template-columns:1fr 1fr!important;}
  .g-cards{grid-template-columns:1fr!important;}
  .hero-flex{flex-direction:column!important;gap:12px!important;}
  .hero-div{display:none!important;}
  .map-h-main{height:260px!important;}
  .map-h-tour{height:300px!important;}
  .steps-panel{max-height:160px!important;}
  .health-slots{grid-template-columns:repeat(2,1fr)!important;}
  .safe-win{grid-template-columns:1fr!important;}
  .pollutant-g{grid-template-columns:repeat(2,1fr)!important;}
  .aqi-slider-row{flex-direction:column!important;}
}

/* Touch tap targets */
@media(max-width:600px){
  button{min-height:36px;}
}
`;

function injectGlobalCSS() {
  if (document.getElementById('aqi-global-css')) return;
  const s = document.createElement('style');
  s.id = 'aqi-global-css';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ── Mobile Province Bar ───────────────────────────────────────────────────────
function MobileProvBar({ provinces, activeSlug, setActiveSlug, loading }) {
  return (
    <div className="mobile-prov">
      {provinces.map(p => (
        <button key={p.slug} onClick={() => setActiveSlug(p.slug)} style={{
          padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: p.slug === activeSlug ? '#1565c0' : '#f1f5f9',
          color: p.slug === activeSlug ? '#fff' : '#475569',
          fontWeight: p.slug === activeSlug ? 700 : 500, fontSize: '0.82rem', whiteSpace: 'nowrap',
        }}>
          {p.name}{loading && p.slug === activeSlug ? ' …' : ''}
        </button>
      ))}
    </div>
  );
}

// ── Desktop Sticky Sidebar ────────────────────────────────────────────────────
function StickyProvSidebar({ provinces, activeSlug, setActiveSlug, loading }) {
  const [open, setOpen] = useState(true);
  const current = provinces.find(p => p.slug === activeSlug);
  return (
    <div className="province-sticky" style={{ width: open ? 180 : 'auto' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: '7px 12px', background: '#f8fafd', cursor: 'pointer', userSelect: 'none',
        borderBottom: open ? '1px solid #f1f5f9' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {open ? 'Chọn tỉnh' : (current?.name || '')}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '4px 0' }}>
          {provinces.map(p => (
            <div key={p.slug} onClick={() => setActiveSlug(p.slug)} style={{
              padding: '7px 14px', fontSize: '0.82rem',
              fontWeight: p.slug === activeSlug ? 700 : 500,
              color: p.slug === activeSlug ? '#1565c0' : '#334155',
              background: p.slug === activeSlug ? '#eff6ff' : 'transparent',
              borderLeft: p.slug === activeSlug ? '3px solid #1565c0' : '3px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (p.slug !== activeSlug) e.currentTarget.style.background = '#f8fafd'; }}
              onMouseLeave={e => { if (p.slug !== activeSlug) e.currentTarget.style.background = 'transparent'; }}
            >
              {p.slug === activeSlug ? '▶ ' : ''}{p.name}
              {loading && p.slug === activeSlug && ' ⏳'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [provinces, setProvinces]       = useState([]);
  const [activeSlug, setActiveSlug]     = useState('thanh_hoa');
  const [activeTab, setActiveTab]       = useState('forecast');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => { injectGlobalCSS(); }, []);

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

  const lvl         = forecastData?.current?.level ?? 0;
  const hasSelector = activeTab !== 'classification';

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg,#1565c0 0%,#0097a7 100%)',
        color: '#fff', padding: '12px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1rem,3vw,1.5rem)', fontWeight: 800, margin: 0 }}>
            Dự báo Chất lượng Không khí - Miền Trung VN
          </h1>
          <p className="header-sub" style={{ fontSize: '0.78rem', opacity: 0.82, marginTop: 3, marginBottom: 0 }}>
            Dữ liệu: 08/2022 – 03/2026 · PCA + Machine Learning
          </p>
        </div>
      </header>

      {/* Alert banner */}
      {forecastData && lvl >= 2 && (
        <div style={{
          background: LEVEL_BG[lvl], borderBottom: `3px solid ${LEVEL_BORDER[lvl]}`,
          padding: '8px 16px', textAlign: 'center',
          fontSize: 'clamp(0.76rem,2vw,0.86rem)', fontWeight: 600, color: '#222',
        }}>
          AQI tại <b>{forecastData.province}</b>:{' '}
          <b style={{ color: LEVEL_BORDER[lvl] }}>{forecastData.current.label} ({forecastData.current.aqi})</b>
          {' '}- {forecastData.recommendation?.desc}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ margin: '10px 16px', padding: '10px 14px', background: '#fdecea', border: '1px solid #f44336', borderRadius: 8, color: '#c62828', fontSize: '0.88rem' }}>
          Lỗi tải dữ liệu: {error}
        </div>
      )}

      {/* Tab nav */}
      <div className="tab-nav" style={{ background: '#fff', borderBottom: '1px solid #e0e7f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', padding: '0 12px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: 'clamp(10px,1.5vw,13px) clamp(10px,1.5vw,18px)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #1565c0' : '3px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? '#1565c0' : '#64748b',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 'clamp(0.76rem,1.8vw,0.88rem)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile province bar - hiện < 768px */}
      {hasSelector && (
        <MobileProvBar
          provinces={provinces} activeSlug={activeSlug}
          setActiveSlug={setActiveSlug} loading={loading}
        />
      )}

      {/* Desktop sticky sidebar - ẩn < 768px qua CSS */}
      {hasSelector && (
        <StickyProvSidebar
          provinces={provinces} activeSlug={activeSlug}
          setActiveSlug={setActiveSlug} loading={loading}
        />
      )}

      {/* Main content */}
      <main className="main-content" style={{
        maxWidth: 1200, margin: '0 auto', padding: '16px',
        // Desktop: nhường chỗ cho sidebar 180px + gap 30px = 210px
        paddingRight: hasSelector ? 'clamp(16px,17vw,210px)' : '16px',
      }}>
        {loading && !forecastData
          ? <LoadingSkeleton />
          : <>
              {activeTab === 'forecast'       && <Tab1Forecast data={forecastData} loading={loading} />}
              {activeTab === 'classification' && <Tab2Classification data={forecastData} />}
              {activeTab === 'history'        && <Tab3History slug={activeSlug} />}
              {activeTab === 'models'         && <Tab5ModelData slug={activeSlug} />}
              {activeTab === 'tourism'        && <Tab6Tourism data={forecastData} slug={activeSlug} />}
            </>
        }
      </main>

      <footer style={{
        textAlign: 'center', padding: '14px 16px', marginTop: 24,
        color: '#94a3b8', fontSize: 'clamp(0.66rem,1.5vw,0.76rem)',
        borderTop: '1px solid #e0e7f0', background: '#fff',
      }}>
        Nguồn: Open-Meteo CAMS Global · 08/2022–03/2026 · React + FastAPI
      </footer>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[180, 140, 300].map((h, i) => (
        <div key={i} style={{
          height: h, borderRadius: 12,
          background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}
