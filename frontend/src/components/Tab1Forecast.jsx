import React, { useEffect, useState, useCallback } from 'react';
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
    { label: 'Nhiệt độ',    key: 'temperature_2m',       unit: '°C'},
    { label: 'Độ ẩm',       key: 'relative_humidity_2m', unit: '%'},
    { label: 'Tốc độ gió',  key: 'wind_speed_10m',       unit: 'km/h'},
    { label: 'Mây che phủ', key: 'cloud_cover',          unit: '%'},
    { label: 'Áp suất',     key: 'pressure_msl',         unit: 'hPa'},
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
  const [layers, setLayers] = useState({ aqi: true, tourism: false, terrain: false });
  const [mapStyle, setMapStyle] = useState('open-street-map');
  const [selectedSpot, setSelectedSpot] = useState(null);

  const toggleLayer = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const aqi = forecastData?.current?.aqi ?? 0;
  const mockAQI = { thanh_hoa: 147, nghe_an: 89, ha_tinh: 112, hue: 65 };
  const provinces = [
    { slug: 'thanh_hoa', name: 'Thanh Hóa', lat: 19.808, lon: 105.776 },
    { slug: 'nghe_an',   name: 'Nghệ An',   lat: 18.679, lon: 105.682 },
    { slug: 'ha_tinh',   name: 'Hà Tĩnh',   lat: 18.343, lon: 105.906 },
    { slug: 'hue',       name: 'Huế',        lat: 16.462, lon: 107.595 },
  ];
  const aqiVals = provinces.map(p => p.slug === activeSlug ? aqi : mockAQI[p.slug]);

  // Build traces
  const traces = [];

  // Layer 1: AQI circles
  if (layers.aqi) {
    traces.push({
      type: 'scattermapbox',
      lat: provinces.map(p => p.lat),
      lon: provinces.map(p => p.lon),
      mode: 'markers+text',
      name: 'AQI',
      marker: {
        size: provinces.map(p => p.slug === activeSlug ? 44 : 32),
        color: aqiVals.map(v => aqiColor(v)),
        opacity: 0.9,
      },
      text: aqiVals.map(v => `${Math.round(v)}`),
      textposition: 'middle center',
      textfont: {
        size: provinces.map(p => p.slug === activeSlug ? 13 : 11),
        color: aqiVals.map(v => AQI_TEXT_COLORS[aqiLevel(v)]),
        family: 'Inter, sans-serif',
      },
      customdata: provinces.map((p, i) =>
        `<b>${p.name}</b><br>AQI: <b>${Math.round(aqiVals[i])}</b> · ${AQI_LABELS[aqiLevel(aqiVals[i])]}`
      ),
      hovertemplate: '%{customdata}<extra></extra>',
    });
  }

  // Layer 2: Tourism spots
  if (layers.tourism) {
    const allSpots = [];
    Object.entries(TOURISM_SPOTS).forEach(([slug, spots]) => {
      spots.forEach(s => allSpots.push({ ...s, province: slug }));
    });
    traces.push({
      type: 'scattermapbox',
      lat: allSpots.map(s => s.lat),
      lon: allSpots.map(s => s.lon),
      mode: 'markers+text',
      name: 'Du lịch',
      marker: {
        size: 18,
        color: allSpots.map(s => CAT_COLORS[s.cat] || '#64748b'),
        opacity: 0.85,
        symbol: 'circle',
      },
      text: allSpots.map(s => CAT_ICONS[s.cat] || '📍'),
      textposition: 'middle center',
      textfont: { size: 9, color: '#fff', family: 'Inter, sans-serif' },
      customdata: allSpots.map(s =>
        `<b>${s.name}</b><br>${CAT_ICONS[s.cat]} ${s.cat}<br>📍 ${s.province.replace('_',' ')}`
      ),
      hovertemplate: '%{customdata}<extra></extra>',
    });
  }

  const mapStyleVal = layers.terrain ? 'stamen-terrain' : mapStyle;

  // AQI filter badge
  const aqiLvl = aqiLevel(aqi);
  const aqiLevelConfig = [
    { color: '#00c853', bg: '#f0fdf4' },
    { color: '#f9a825', bg: '#fffde7' },
    { color: '#ef6c00', bg: '#fff3e0' },
    { color: '#c62828', bg: '#fdecea' },
    { color: '#6a1b9a', bg: '#f3e5f5' },
    { color: '#880e4f', bg: '#fce4ec' },
  ][aqiLvl];

  return (
    <div>
      {/* Map Style & Layer Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {/* Layer toggles */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lớp bản đồ:</span>
          {[
            { key: 'aqi',     label: 'AQI',       desc: 'Chỉ số không khí' },
            { key: 'tourism', label: 'Du lịch',   desc: 'Điểm tham quan' },
            { key: 'terrain', label: 'Địa hình',  desc: 'Nền địa hình' },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              title={desc}
              style={{
                padding: '5px 12px', borderRadius: 20,
                border: `2px solid ${layers[key] ? '#1565c0' : '#e0e7f0'}`,
                background: layers[key] ? '#1565c0' : '#fff',
                color: layers[key] ? '#fff' : '#64748b',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
              }}
            >
              {label}
              {layers[key] && <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '0 4px' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Map base style */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Nền:</span>
          {[
            { val: 'open-street-map', label: '🗺 OSM' },
            { val: 'carto-positron',  label: '⬜ Sáng' },
            { val: 'carto-darkmatter',label: '⬛ Tối' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => { setMapStyle(val); if (val !== 'open-street-map') setLayers(l => ({ ...l, terrain: false })); }}
              style={{
                padding: '3px 9px', borderRadius: 6, fontSize: '0.7rem',
                border: `1px solid ${(!layers.terrain && mapStyle === val) ? '#1565c0' : '#e0e7f0'}`,
                background: (!layers.terrain && mapStyle === val) ? '#eff6ff' : '#fff',
                color: (!layers.terrain && mapStyle === val) ? '#1565c0' : '#64748b',
                cursor: 'pointer', fontWeight: 500,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend row */}
      {layers.aqi && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {AQI_LABELS.map((lbl, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: AQI_COLORS[i], border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ color: '#64748b' }}>{lbl}</span>
            </div>
          ))}
        </div>
      )}
      {layers.tourism && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(CAT_COLORS).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ color: '#64748b' }}>{CAT_ICONS[cat]} {cat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e0e7f0' }}>
        <Plot
          data={traces.length > 0 ? traces : [{
            type: 'scattermapbox', lat: [18.0], lon: [105.8], mode: 'markers',
            marker: { size: 0, opacity: 0 }, hoverinfo: 'none',
          }]}
          layout={{
            mapbox: {
              style: layers.terrain ? 'stamen-terrain' : mapStyleVal,
              center: { lat: 18.0, lon: 105.8 },
              zoom: 5.8,
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 0, r: 0, t: 0, b: 0 },
            height: 380,
            showlegend: false,
          }}
          config={{ displayModeBar: false, responsive: true, scrollZoom: true }}
          style={{ width: '100%' }}
        />
      </div>

      {/* AQI filter tips */}
      <div style={{
        marginTop: 10, padding: '8px 14px', borderRadius: 8,
        background: aqiLevelConfig.bg, border: `1px solid ${aqiLevelConfig.color}22`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: aqiLevelConfig.color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.78rem', color: '#334155' }}>
          <b>Lọc AQI:</b> Tỉnh được chọn đang ở mức <b style={{ color: aqiLevelConfig.color }}>{AQI_LABELS[aqiLvl]} ({Math.round(aqi)})</b>.
          Bật layer <b>Du lịch</b> để xem điểm tham quan phù hợp với mức AQI hiện tại.
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
