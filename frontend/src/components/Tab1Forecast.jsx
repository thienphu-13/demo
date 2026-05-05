import React, { useEffect, useState, useCallback, useRef } from 'react';
import Plot from 'react-plotly.js';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, AQI_RGBA, AQI_TEXT_COLORS, aqiLevel, aqiColor } from '../constants.js';

const L = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

// ── AQI Legend Table ──────────────────────────────────────────────────────────
const AQI_TABLE_DATA = [
  { range: '0 – 49',    desc: 'Không ảnh hưởng tới sức khỏe.' },
  { range: '50 – 99',   desc: 'Một số chất ô nhiễm ảnh hưởng người rất nhạy cảm.' },
  { range: '100 – 149', desc: 'Có thể gây hại cho nhóm dễ bị ảnh hưởng.' },
  { range: '150 – 199', desc: 'Ảnh hưởng sức khỏe toàn dân.' },
  { range: '200 – 299', desc: 'Khẩn cấp với nhóm dễ bị ảnh hưởng.' },
  { range: '300 – 499', desc: 'Nguy hại - tình trạng khẩn cấp về môi trường.' },
];

function StickyAQILegend({ currentLevel }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{
      position: 'fixed', top: 390, right: 14, zIndex: 999,
      background: 'rgba(255,255,255,0.97)',
      borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid #e0e7f0', overflow: 'hidden',
      width: open ? 390 : 'auto', transition: 'width 0.25s ease',
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: '6px 12px', background: '#f8fafd',
        borderBottom: open ? '1px solid #f1f5f9' : 'none',
        cursor: 'pointer', userSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: AQI_COLORS[currentLevel] }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thang AQI</span>
        </div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{open ? '▲ Thu gọn' : '▼ Mở rộng'}</span>
      </div>
      {open && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Mức', 'AQI', 'Ý nghĩa'].map(h => (
                <th key={h} style={{ padding: '4px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.62rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AQI_LABELS.map((label, i) => {
              const active = i === currentLevel;
              return (
                <tr key={i} style={{
                  background: active ? `${AQI_COLORS[i]}12` : 'transparent',
                  borderLeft: active ? `3px solid ${AQI_COLORS[i]}` : '3px solid transparent',
                }}>
                  <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: AQI_COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.7rem', fontWeight: active ? 800 : 500, color: active ? AQI_COLORS[i] : '#334155' }}>{label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px', fontFamily: 'monospace', fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>{AQI_TABLE_DATA[i].range}</td>
                  <td style={{ padding: '4px 10px', fontSize: '0.68rem', color: active ? '#1e293b' : '#64748b', fontWeight: active ? 600 : 400, lineHeight: 1.3 }}>{AQI_TABLE_DATA[i].desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── AQI Hero Card ─────────────────────────────────────────────────────────────
function AQIHero({ current, recommendation, province }) {
  const lvl = current.level;
  const tc  = AQI_TEXT_COLORS[lvl];
  const bgGrad = [
    'linear-gradient(135deg,#00c853,#00e676)',
    'linear-gradient(135deg,#f9a825,#ffee58)',
    'linear-gradient(135deg,#ef6c00,#ffa726)',
    'linear-gradient(135deg,#c62828,#ef5350)',
    'linear-gradient(135deg,#6a1b9a,#ab47bc)',
    'linear-gradient(135deg,#880e4f,#c2185b)',
  ][lvl];
  return (
    <div style={{ background: bgGrad, borderRadius: 16, padding: '22px 26px', color: tc, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center', minWidth: 110 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>US AQI</div>
        <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, margin: '4px 0' }}>{current.aqi}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{current.label}</div>
      </div>
      <div style={{ width: 1, height: 70, background: `${tc}33`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 5 }}>{province}</div>
        <div style={{ fontSize: '0.88rem', opacity: 0.9, marginBottom: 8 }}>{recommendation?.desc}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {recommendation?.activities?.slice(0, 3).map((act, i) => (
            <span key={i} style={{ background: tc === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 20, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 600 }}>{act}</span>
          ))}
        </div>
      </div>
      <div style={{ background: tc === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px', minWidth: 170, fontSize: '0.8rem', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 3 }}>Khung giờ an toàn</div>
        <div style={{ opacity: 0.9 }}>{recommendation?.safe_hours}</div>
      </div>
    </div>
  );
}

// ── Pollutant Grid ────────────────────────────────────────────────────────────
function PollutantGrid({ pollutants }) {
  const keys = ['pm2_5','pm10','nitrogen_dioxide','ozone','sulphur_dioxide','carbon_monoxide'];
  return (
    <div>
      <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Chỉ số ô nhiễm - So sánh ngưỡng WHO & QCVN 05:2023
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {keys.map(key => {
          const d = pollutants[key]; if (!d) return null;
          const pct    = Math.min((d.value / d.who) * 100, 200);
          const color  = d.value <= d.who ? '#2e7d32' : d.value <= d.vn ? '#f57c00' : '#c62828';
          const status = d.value <= d.who ? 'Dưới ngưỡng WHO' : d.value <= d.vn ? 'Trên ngưỡng WHO' : 'Vượt QCVN';
          return (
            <div key={key} style={{ background: '#f8fafd', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>{d.name}</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{d.value.toFixed(1)}<span style={{ fontSize: '0.6rem', color: '#94a3b8' }}> {d.unit}</span></span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: 3, height: 4, marginBottom: 4 }}>
                <div style={{ width: `${Math.min(pct,100)}%`, background: color, height: 4, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: '0.63rem', color, fontWeight: 600, marginBottom: 1 }}>{status}</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>WHO: {d.who} · QCVN: {d.vn} {d.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weather Row ───────────────────────────────────────────────────────────────
function WeatherRow({ weather }) {
  const items = [
    { label: 'Nhiệt độ',    key: 'temperature_2m',       unit: '°C',   icon: '🌡️' },
    { label: 'Độ ẩm',       key: 'relative_humidity_2m', unit: '%',    icon: '💧' },
    { label: 'Tốc độ gió',  key: 'wind_speed_10m',       unit: 'km/h', icon: '💨' },
    { label: 'Mây che phủ', key: 'cloud_cover',          unit: '%',    icon: '☁️' },
    { label: 'Áp suất',     key: 'pressure_msl',         unit: 'hPa',  icon: '📊' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
      {items.map(({ label, key, unit, icon }) => (
        <div key={key} style={{ background: '#f0f9ff', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{icon}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0369a1' }}>
            {weather[key] != null ? weather[key].toFixed(1) : '-'}
            <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#64748b' }}> {unit}</span>
          </div>
          <div style={{ fontSize: '0.63rem', color: '#64748b', marginTop: 1 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Gauge Chart ───────────────────────────────────────────────────────────────
function GaugeChart({ aqi, label, color }) {
  return (
    <Plot
      data={[{
        type: 'indicator', mode: 'gauge+number', value: aqi,
        number: { font: { size: 52, color } },
        title: { text: `<b>${label}</b>`, font: { size: 14, color } },
        gauge: {
          axis: { range: [0, 300], tickwidth: 1, tickfont: { size: 9 }, nticks: 7 },
          bar: { color, thickness: 0.28 }, bgcolor: 'white', borderwidth: 0,
          steps: [
            { range: [0,50],   color: '#d4f8d4' }, { range: [50,100],  color: '#fdfac4' },
            { range: [100,150],color: '#fde3bc' }, { range: [150,200], color: '#fbbaba' },
            { range: [200,300],color: '#e8c7ee' },
          ],
          threshold: { line: { color: '#333', width: 3 }, thickness: 0.8, value: aqi },
        },
        domain: { x: [0,1], y: [0.08,1] },
      }]}
      layout={{ height: 220, margin: { l: 12, r: 12, t: 12, b: 4 }, paper_bgcolor: 'rgba(0,0,0,0)' }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Tourism data tích hợp vào bản đồ ─────────────────────────────────────────
const TOURISM_SPOTS = {
  thanh_hoa: [
    { name: 'Bãi biển Sầm Sơn',    cat: 'beach',    lat: 19.7318, lon: 105.9047 },
    { name: 'Thành Nhà Hồ',         cat: 'heritage', lat: 20.0667, lon: 105.5833 },
    { name: 'Suối cá Cẩm Lương',    cat: 'nature',   lat: 20.2833, lon: 105.2500 },
    { name: 'Khu du lịch Pù Luông', cat: 'trekking', lat: 20.4167, lon: 105.1167 },
    { name: 'Biển Hải Tiến',        cat: 'beach',    lat: 20.0500, lon: 105.8167 },
  ],
  nghe_an: [
    { name: 'Bãi biển Cửa Lò',     cat: 'beach',    lat: 18.8167, lon: 105.7167 },
    { name: 'Khu di tích Kim Liên', cat: 'heritage', lat: 18.6833, lon: 105.3167 },
    { name: 'Vườn QG Pù Mát',      cat: 'trekking', lat: 18.9167, lon: 104.5000 },
    { name: 'Thác Khe Kèm',        cat: 'nature',   lat: 19.0167, lon: 104.4167 },
    { name: 'Đảo Ngư',             cat: 'beach',    lat: 18.7833, lon: 105.7667 },
  ],
  ha_tinh: [
    { name: 'Biển Thiên Cầm',       cat: 'beach',    lat: 18.3500, lon: 106.0167 },
    { name: 'Ngã Ba Đồng Lộc',      cat: 'heritage', lat: 18.3167, lon: 105.6333 },
    { name: 'Chùa Hương Tích',      cat: 'heritage', lat: 18.3833, lon: 105.7167 },
    { name: 'Hồ Kẻ Gỗ',            cat: 'nature',   lat: 18.2167, lon: 105.6500 },
    { name: 'Khu lưu niệm Nguyễn Du',cat:'heritage', lat: 18.3667, lon: 105.6000 },
  ],
  hue: [
    { name: 'Đại Nội Huế',         cat: 'heritage', lat: 16.4698, lon: 107.5796 },
    { name: 'Lăng Tự Đức',         cat: 'heritage', lat: 16.4333, lon: 107.5500 },
    { name: 'Chùa Thiên Mụ',       cat: 'heritage', lat: 16.4540, lon: 107.5460 },
    { name: 'Biển Lăng Cô',        cat: 'beach',    lat: 16.2167, lon: 108.0833 },
    { name: 'Vườn QG Bạch Mã',     cat: 'trekking', lat: 16.1833, lon: 107.8500 },
    { name: 'Phá Tam Giang',        cat: 'nature',   lat: 16.5333, lon: 107.5833 },
  ],
};

const CAT_ICONS = { beach: '🏖', trekking: '🌄', nature: '🌿', heritage: '🏛', food: '🍜' };
const CAT_COLORS = { beach: '#0ea5e9', trekking: '#16a34a', nature: '#22c55e', heritage: '#a855f7', food: '#f97316' };

// ── Interactive Layer Map ─────────────────────────────────────────────────────
function InteractiveLayerMap({ activeSlug, forecastData }) {
  const divRef  = useRef(null);
  const stRef   = useRef({ map: null, tile: null, aqiGroup: null, tourGroup: null });
  const wrapRef = useRef(null);
  const [layers,   setLayers]   = useState({ aqi: true, tourism: false });
  const [basemap,  setBasemap]  = useState('osm');
  const [isFS,     setIsFS]     = useState(false);
  const [popup,    setPopup]    = useState(null);
  const [ready,    setReady]    = useState(false);

  const aqi      = forecastData?.current?.aqi ?? 0;
  const mockAQI  = { thanh_hoa: 147, nghe_an: 89, ha_tinh: 112, hue: 65 };
  const PROVINCES = [
    { slug: 'thanh_hoa', name: 'Thanh Hóa', lat: 19.808, lon: 105.776 },
    { slug: 'nghe_an',   name: 'Nghệ An',   lat: 18.679, lon: 105.682 },
    { slug: 'ha_tinh',   name: 'Hà Tĩnh',   lat: 18.343, lon: 105.906 },
    { slug: 'hue',       name: 'Huế',        lat: 16.462, lon: 107.595 },
  ];

  const BASES = {
    osm:  { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',       label: 'Bản đồ',  attr: '© OpenStreetMap' },
    topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',         label: 'Địa hình', attr: '© OpenTopoMap'  },
    sat:  { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Vệ tinh', attr: '© Esri'         },
  };

  // Khởi tạo Leaflet
  useEffect(() => {
    if (!divRef.current) return;
    if (!document.getElementById('lf-css')) {
      const l = document.createElement('link');
      l.id = 'lf-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    if (window.L) { initMap(); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = initMap;
    document.head.appendChild(s);
    return () => { if (stRef.current.map) { stRef.current.map.remove(); stRef.current.map = null; } };
  }, []);

  function initMap() {
    if (stRef.current.map || !divRef.current) return;
    const L = window.L;
    const map = L.map(divRef.current, { center: [18.0, 106.0], zoom: 7, zoomControl: false });
    L.control.zoom({ position: 'topright' }).addTo(map);
    stRef.current.map = map;
    stRef.current.tile = L.tileLayer(BASES.osm.url, { attribution: BASES.osm.attr }).addTo(map);
    stRef.current.aqiGroup  = L.layerGroup().addTo(map);
    stRef.current.tourGroup = L.layerGroup();
    setReady(true);
  }

  // Vẽ markers AQI
  useEffect(() => {
    if (!ready) return;
    const L = window.L; const st = stRef.current;
    st.aqiGroup.clearLayers();
    if (!layers.aqi) return;
    PROVINCES.forEach(p => {
      const val   = p.slug === activeSlug ? aqi : mockAQI[p.slug];
      const lvl   = aqiLevel(val);
      const color = AQI_COLORS[lvl];
      const tc    = AQI_TEXT_COLORS[lvl];
      const size  = p.slug === activeSlug ? 44 : 36;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:${p.slug===activeSlug?13:11}px;font-weight:800;color:${tc};font-family:Inter,sans-serif;">${Math.round(val)}</div>`,
        iconSize: [size, size], iconAnchor: [size/2, size/2],
      });
      L.marker([p.lat, p.lon], { icon })
        .addTo(st.aqiGroup)
        .on('click', () => setPopup({ title: p.name, body: `AQI: ${Math.round(val)} · ${AQI_LABELS[lvl]}`, color }));
    });
  }, [ready, layers.aqi, aqi, activeSlug]);

  // Vẽ markers du lịch
  useEffect(() => {
    if (!ready) return;
    const L = window.L; const st = stRef.current;
    st.tourGroup.clearLayers();
    if (!layers.tourism) { st.tourGroup.remove(); return; }
    st.tourGroup.addTo(st.map);
    Object.entries(TOURISM_SPOTS).forEach(([slug, spots]) => {
      spots.forEach(s => {
        const color = CAT_COLORS[s.cat] || '#64748b';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:10px;">${CAT_ICONS[s.cat]||'●'}</div>`,
          iconSize: [22, 22], iconAnchor: [11, 11],
        });
        L.marker([s.lat, s.lon], { icon })
          .addTo(st.tourGroup)
          .on('click', () => setPopup({ title: s.name, body: `${CAT_ICONS[s.cat]} ${s.cat} · ${slug.replace('_',' ')}`, color }));
      });
    });
  }, [ready, layers.tourism]);

  // Đổi basemap
  useEffect(() => {
    if (!ready) return;
    const L = window.L; const st = stRef.current;
    if (st.tile) st.tile.remove();
    st.tile = L.tileLayer(BASES[basemap].url, { attribution: BASES[basemap].attr }).addTo(st.map);
    st.map.getPane('tilePane').style.zIndex = 200;
    // Đưa các layer markers lên trên tile
    if (st.aqiGroup)  st.aqiGroup.bringToFront?.();
    if (st.tourGroup) st.tourGroup.bringToFront?.();
  }, [basemap, ready]);

  function toggleFS() {
    const el = wrapRef.current; if (!el) return;
    if (!isFS) { (el.requestFullscreen || el.webkitRequestFullscreen || (()=>{})).call(el); }
    else       { (document.exitFullscreen || document.webkitExitFullscreen || (()=>{})).call(document); }
    setIsFS(f => !f);
    setTimeout(() => stRef.current.map?.invalidateSize(), 350);
  }

  const aqiLvl = aqiLevel(aqi);
  const aqiBg  = ['#f0fdf4','#fffde7','#fff3e0','#fdecea','#f3e5f5','#fce4ec'][aqiLvl];
  const aqiClr = ['#00c853','#f9a825','#ef6c00','#c62828','#6a1b9a','#880e4f'][aqiLvl];

  return (
    <div ref={wrapRef} style={{ background: isFS ? '#fff' : 'transparent', padding: isFS ? 12 : 0 }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Lớp:</span>
        {[
          { key: 'aqi',     label: 'AQI' },
          { key: 'tourism', label: 'Du lịch' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setLayers(l => ({ ...l, [key]: !l[key] }))} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: '0.74rem', cursor: 'pointer',
            border: `2px solid ${layers[key] ? '#1565c0' : '#e0e7f0'}`,
            background: layers[key] ? '#1565c0' : '#fff',
            color: layers[key] ? '#fff' : '#64748b', fontWeight: 600,
          }}>{label}{layers[key] ? ' ✓' : ''}</button>
        ))}

        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 8 }}>Nền:</span>
        {Object.entries(BASES).map(([k, b]) => (
          <button key={k} onClick={() => setBasemap(k)} style={{
            padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
            border: `1.5px solid ${basemap === k ? '#1565c0' : '#e0e7f0'}`,
            background: basemap === k ? '#eff6ff' : '#fff',
            color: basemap === k ? '#1565c0' : '#64748b', fontWeight: basemap === k ? 700 : 400,
          }}>{b.label}</button>
        ))}

        <button onClick={toggleFS} title={isFS ? 'Thu nhỏ' : 'Toàn màn hình'} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer', border: '1.5px solid #e0e7f0', background: '#fff', color: '#64748b' }}>
          {isFS ? '⊠ Thu nhỏ' : '⊞ Toàn màn hình'}
        </button>
      </div>

      {/* Legend */}
      {layers.aqi && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: '0.67rem' }}>
          {AQI_LABELS.map((lbl, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: AQI_COLORS[i], display: 'inline-block', border: '1px solid rgba(0,0,0,.1)' }} />
              <span style={{ color: '#64748b' }}>{lbl}</span>
            </span>
          ))}
        </div>
      )}
      {layers.tourism && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: '0.67rem' }}>
          {Object.entries(CAT_COLORS).map(([cat, color]) => (
            <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ color: '#64748b' }}>{CAT_ICONS[cat]} {cat}</span>
            </span>
          ))}
        </div>
      )}

      {/* Map */}
      <div ref={divRef} style={{ width: '100%', height: isFS ? 'calc(100vh - 140px)' : 380, borderRadius: 10, border: '1px solid #e0e7f0' }} />

      {/* Click popup */}
      {popup && (
        <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, background: '#fff', border: `1.5px solid ${popup.color}44`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: popup.color, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '0.8rem', color: '#334155' }}>
            <b>{popup.title}</b> - {popup.body}
          </div>
          <button onClick={() => setPopup(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* AQI tip */}
      <div style={{ marginTop: 8, padding: '7px 12px', borderRadius: 8, background: aqiBg, border: `1px solid ${aqiClr}22`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: aqiClr, flexShrink: 0 }} />
        <span style={{ fontSize: '0.75rem', color: '#334155' }}>
          Tỉnh đang chọn: <b style={{ color: aqiClr }}>{AQI_LABELS[aqiLvl]} (AQI {Math.round(aqi)})</b>.
          Bật layer <b>Du lịch</b> để xem các điểm tham quan trong vùng.
        </span>
      </div>
    </div>
  );
}

// ── Forecast Line Chart ───────────────────────────────────────────────────────
function ForecastChart({ forecast }) {
  const xLabels = forecast.map(f => `${f.time_str}<br>${f.date_str}`);
  const vals    = forecast.map(f => f.aqi);
  const colors  = forecast.map(f => f.color);
  const labels  = forecast.map(f => f.label);
  const shapes  = AQI_BINS.slice(0,-1).map((lo,i) => ({
    type:'rect', xref:'paper', x0:0, x1:1,
    yref:'y', y0:lo, y1:AQI_BINS[i+1],
    fillcolor: AQI_RGBA[i]||'rgba(0,0,0,0)', line:{width:0}, layer:'below',
  }));
  const threshAnnotations = [[50,'Tốt','#009a00'],[100,'Trung bình','#b8a000'],[150,'Kém','#c05a00'],[200,'Xấu','#aa0000']].map(
    ([y,text,color]) => ({xref:'paper',x:1,yref:'y',y, text:`<b>${text}</b>`, showarrow:false, xanchor:'left', xshift:6, font:{color,size:9}, bgcolor:'rgba(255,255,255,0.85)', borderpad:2})
  );
  return (
    <Plot
      data={[{
        type:'scatter', mode:'lines+markers+text',
        x:xLabels, y:vals,
        line:{color:'#1565c0', width:2.5, shape:'spline'},
        marker:{color:colors, size:16, line:{color:'#fff', width:2}},
        text:vals.map(v=>`<b>${Math.round(v)}</b>`),
        textposition:'top center', textfont:{size:11, color:'#333'},
        customdata:labels,
        hovertemplate:'<b>%{x}</b><br>AQI: <b>%{y:.0f}</b><br>%{customdata}<extra></extra>',
      }]}
      layout={{
        ...L,
        xaxis:{tickfont:{size:10}, gridcolor:'rgba(0,0,0,0.04)'},
        yaxis:{title:'US AQI', range:[0, Math.max(...vals)*1.5], gridcolor:'rgba(0,0,0,0.06)'},
        shapes, annotations:threshAnnotations,
        showlegend:false, height:330,
        margin:{l:40, r:70, t:20, b:10},
      }}
      config={{displayModeBar:false, responsive:true}}
      style={{width:'100%'}}
    />
  );
}

// ── Safe/Unsafe Windows ───────────────────────────────────────────────────────
function getHour(f) {
  try { return new Date(f.datetime).getHours(); } catch { return parseInt(f.time_str); }
}

function mergeToRanges(items) {
  if (!items.length) return [];
  const ranges = [];
  let startH = getHour(items[0]);
  let endH   = startH + (items[0].horizon <= 6 ? 1 : 2);
  let prevH  = startH;
  for (let i = 1; i < items.length; i++) {
    const h = getHour(items[i]);
    if (h - prevH <= 6) { endH = h + 1; prevH = h; }
    else { ranges.push([startH, endH]); startH = h; endH = h + 1; prevH = h; }
  }
  ranges.push([startH, endH]);
  return ranges;
}

function fmt(h) { return `${h % 24}h`; }

function SafeWindows({ forecast }) {
  const safe    = forecast.filter(f => f.level <= 1);
  const unsafe  = forecast.filter(f => f.level >= 3);
  const safeR   = mergeToRanges(safe);
  const unsafeR = mergeToRanges(unsafe);
  const Tag = ({ range, bg, color }) => (
    <div style={{ background: bg, color, borderRadius: 8, padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {fmt(range[0])} – {fmt(range[1])}
    </div>
  );
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
      <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:12}}>
        <div style={{fontWeight:700, color:'#15803d', marginBottom:8, fontSize:'0.82rem'}}>Khung giờ an toàn</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:8, minHeight:32, alignItems:'center'}}>
          {safeR.length
            ? safeR.map((r,i) => <Tag key={i} range={r} bg="#dcfce7" color="#15803d" />)
            : <span style={{color:'#94a3b8', fontSize:'0.8rem', fontStyle:'italic'}}>Không có trong 72h tới</span>}
        </div>
      </div>
      <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:12}}>
        <div style={{fontWeight:700, color:'#dc2626', marginBottom:8, fontSize:'0.82rem'}}>Khung giờ cần hạn chế</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:8, minHeight:32, alignItems:'center'}}>
          {unsafeR.length
            ? unsafeR.map((r,i) => <Tag key={i} range={r} bg="#fee2e2" color="#dc2626" />)
            : <span style={{color:'#94a3b8', fontSize:'0.8rem', fontStyle:'italic'}}>Không có trong 72h tới</span>}
        </div>
      </div>
    </div>
  );
}

// ── Health Advisory ───────────────────────────────────────────────────────────
function HealthAdvisory({ recommendation, forecast }) {
  if (!recommendation) return null;
  const HOUR_SLOTS = [
    {label:'Sáng sớm',   range:'5–8h',   icon:'🌅', midH: 6  },
    {label:'Buổi sáng',  range:'8–12h',  icon:'☀️', midH: 9  },
    {label:'Buổi trưa',  range:'12–14h', icon:'🌞', midH: 12 },
    {label:'Buổi chiều', range:'14–18h', icon:'🌤️', midH: 15 },
    {label:'Chiều tối',  range:'18–21h', icon:'🌆', midH: 18 },
    {label:'Ban đêm',    range:'21–5h',  icon:'🌙', midH: 22 },
  ];
  const slotData = HOUR_SLOTS.map(slot => {
    const match = forecast?.reduce((best, f) => {
      try {
        const fh   = new Date(f.datetime).getHours();
        const diff = Math.abs(fh - slot.midH);
        const bh   = best ? Math.abs(new Date(best.datetime).getHours() - slot.midH) : 999;
        return diff < bh ? f : best;
      } catch { return best; }
    }, null);
    return { level: match?.level ?? 1, aqi: match ? Math.round(match.aqi) : null, label: match?.label ?? '' };
  });
  const SLOT_BG = ['#f0fdf4','#fffde7','#fff7ed','#fef2f2','#f5f3ff','#f8fafc'];
  const SLOT_TC = ['#15803d','#a16207','#c2410c','#dc2626','#7c3aed','#475569'];
  const statusText = ['An toàn','Chấp nhận','Hạn chế','Tránh ra ngoài','Nguy hiểm','Khẩn cấp'];
  return (
    <div style={{background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
      <div style={{fontWeight:700, color:'#1e293b', marginBottom:3, fontSize:'0.92rem'}}>Khuyến nghị hoạt động theo khung giờ</div>
      <div style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:12}}>Dựa trên AQI dự báo và tiêu chuẩn WHO/QCVN 05:2023</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12}}>
        {HOUR_SLOTS.map((slot, i) => {
          const { level: lvl, aqi, label } = slotData[i];
          const bg = SLOT_BG[Math.min(lvl,5)];
          const tc = SLOT_TC[Math.min(lvl,5)];
          return (
            <div key={i} style={{background:bg, borderRadius:10, padding:'10px 12px', borderLeft:`3px solid ${tc}`}}>
              <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:6}}>
                <span style={{fontSize:'1.1rem'}}>{slot.icon}</span>
                <div>
                  <div style={{fontSize:'0.75rem', fontWeight:700, color:'#334155'}}>{slot.label}</div>
                  <div style={{fontSize:'0.62rem', color:'#94a3b8'}}>{slot.range}</div>
                </div>
              </div>
              {aqi != null && (
                <div style={{display:'flex', alignItems:'baseline', gap:4, marginBottom:4}}>
                  <span style={{fontSize:'1.1rem', fontWeight:900, color:tc}}>{aqi}</span>
                  <span style={{fontSize:'0.65rem', color:'#94a3b8'}}>AQI · {label}</span>
                </div>
              )}
              <div style={{fontSize:'0.76rem', fontWeight:700, color:tc}}>{statusText[Math.min(lvl,5)]}</div>
            </div>
          );
        })}
      </div>
      {recommendation.sensitive?.length > 0 && (
        <div style={{background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'9px 12px'}}>
          <div style={{fontWeight:700, color:'#c2410c', fontSize:'0.78rem', marginBottom:5}}>Lưu ý - Nhóm dễ bị ảnh hưởng</div>
          {recommendation.sensitive.map((s,i) => (
            <div key={i} style={{fontSize:'0.76rem', color:'#7c3f00', marginBottom:2, display:'flex', gap:5}}>
              <span style={{flexShrink:0}}>•</span> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function Tab1Forecast({ data }) {
  if (!data) return null;
  const { current, forecast, pollutants, weather, recommendation, province, slug } = data;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:14}}>

      {/* Sticky AQI Legend */}
      <StickyAQILegend currentLevel={current.level} />

      {/* Hero */}
      <AQIHero current={current} recommendation={recommendation} province={province} />

      {/* 2-col: Gauge + Pollutants */}
      <div style={{display:'grid', gridTemplateColumns:'250px 1fr', gap:14, alignItems:'start'}}>
        <div style={{background:'#fff', borderRadius:14, padding:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
          <GaugeChart aqi={current.aqi} label={current.label} color={current.color} />
          <p style={{textAlign:'center', fontSize:'0.78rem', color:'#555', marginTop:4, lineHeight:1.5, padding:'0 6px'}}>{recommendation?.desc}</p>
        </div>
        <div style={{background:'#fff', borderRadius:14, padding:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:12}}>
          <PollutantGrid pollutants={pollutants} />
          <div style={{borderTop:'1px solid #f1f5f9', paddingTop:10}}>
            <div style={{fontWeight:700, color:'#475569', fontSize:'0.78rem', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em'}}>Điều kiện thời tiết</div>
            <WeatherRow weather={weather} />
          </div>
        </div>
      </div>

      {/* Interactive Layer Map */}
      <div style={{background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8}}>
          <div>
            <div style={{fontWeight:700, color:'#1e293b', fontSize:'0.95rem'}}>🗺️ Bản đồ Tương tác - Miền Trung</div>
            <div style={{fontSize:'0.74rem', color:'#94a3b8', marginTop:2}}>Bật/tắt các lớp: AQI · Du lịch · Địa hình. Scroll để zoom, kéo để di chuyển.</div>
          </div>
        </div>
        <InteractiveLayerMap activeSlug={slug || 'thanh_hoa'} forecastData={data} />
      </div>

      {/* Forecast Chart */}
      <div style={{background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
        <div style={{fontWeight:700, color:'#1e293b', marginBottom:2}}>Dự báo AQI - 72 giờ tiếp theo</div>
        <div style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:10}}>Kết quả từ mô hình PCA + ML tốt nhất. Giai đoạn dữ liệu: 08/2022 – 03/2026.</div>
        <ForecastChart forecast={forecast} />
        <div style={{marginTop:10}}><SafeWindows forecast={forecast} /></div>
      </div>

      {/* Health Advisory */}
      <HealthAdvisory recommendation={recommendation} forecast={forecast} />

    </div>
  );
}
