import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, AQI_RGBA, AQI_TEXT_COLORS, aqiLevel, aqiColor } from '../constants.js';

const L = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

// ── AQI Hero Card ─────────────────────────────────────────────────────────────
function AQIHero({ current, recommendation, province }) {
  const lvl   = current.level;
  const color = AQI_COLORS[lvl];
  const tc    = AQI_TEXT_COLORS[lvl];
  const bgGrad = [
    'linear-gradient(135deg,#00c853,#00e676)',
    'linear-gradient(135deg,#f9a825,#ffee58)',
    'linear-gradient(135deg,#ef6c00,#ffa726)',
    'linear-gradient(135deg,#c62828,#ef5350)',
    'linear-gradient(135deg,#6a1b9a,#ab47bc)',
    'linear-gradient(135deg,#880e4f,#c2185b)',
  ][lvl];

  return (
    <div style={{ background: bgGrad, borderRadius: 16, padding: '24px 28px', color: tc, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      {/* AQI số lớn */}
      <div style={{ textAlign: 'center', minWidth: 120 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>US AQI</div>
        <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, margin: '4px 0' }}>{current.aqi}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{current.label}</div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 80, background: `${tc}33`, flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 6 }}>{province}</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: 10 }}>{recommendation?.desc}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {recommendation?.activities?.slice(0, 3).map((act, i) => (
            <span key={i} style={{ background: `${tc === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
              {act}
            </span>
          ))}
        </div>
      </div>

      {/* Safe hours */}
      <div style={{ background: `${tc === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, padding: '12px 16px', minWidth: 180, fontSize: '0.82rem', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Khung giờ an toàn</div>
        <div style={{ opacity: 0.9 }}>{recommendation?.safe_hours}</div>
      </div>
    </div>
  );
}

// ── Pollutant Grid ────────────────────────────────────────────────────────────
function PollutantGrid({ pollutants }) {
  const keys = ['pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone', 'sulphur_dioxide', 'carbon_monoxide'];

  return (
    <div>
      <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Chỉ số ô nhiễm — So sánh ngưỡng WHO & QCVN 05:2023
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {keys.map(key => {
          const d = pollutants[key];
          if (!d) return null;
          const pct   = Math.min((d.value / d.who) * 100, 200);
          const color = d.value <= d.who ? '#2e7d32' : d.value <= d.vn ? '#f57c00' : '#c62828';
          const status = d.value <= d.who ? 'Dưới ngưỡng WHO' : d.value <= d.vn ? 'Trên ngưỡng WHO' : 'Vượt QCVN';
          return (
            <div key={key} style={{ background: '#f8fafd', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>{d.name}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{d.value.toFixed(1)}<span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400 }}> {d.unit}</span></span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: 3, height: 4, marginBottom: 6 }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: 4, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: '0.68rem', color, fontWeight: 600, marginBottom: 2 }}>{status}</div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>WHO: {d.who} · QCVN: {d.vn} {d.unit}</div>
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
    { label: 'Nhiệt độ',     key: 'temperature_2m',       unit: '°C',   icon: '🌡️' },
    { label: 'Độ ẩm',        key: 'relative_humidity_2m', unit: '%',    icon: '💧' },
    { label: 'Tốc độ gió',   key: 'wind_speed_10m',       unit: 'km/h', icon: '💨' },
    { label: 'Mây che phủ',  key: 'cloud_cover',          unit: '%',    icon: '☁️' },
    { label: 'Áp suất',      key: 'pressure_msl',         unit: 'hPa',  icon: '📊' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
      {items.map(({ label, key, unit, icon }) => (
        <div key={key} style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>{icon}</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>
            {weather[key] != null ? weather[key].toFixed(1) : '—'}
            <span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#64748b' }}> {unit}</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Forecast Line Chart ───────────────────────────────────────────────────────
function ForecastChart({ forecast }) {
  const xLabels = forecast.map(f => `${f.time_str}<br>${f.date_str}`);
  const vals    = forecast.map(f => f.aqi);
  const colors  = forecast.map(f => f.color);
  const labels  = forecast.map(f => f.label);

  const shapes = AQI_BINS.slice(0, -1).map((lo, i) => ({
    type: 'rect', xref: 'paper', x0: 0, x1: 1,
    yref: 'y', y0: lo, y1: AQI_BINS[i + 1],
    fillcolor: AQI_RGBA[i] || 'rgba(0,0,0,0)', line: { width: 0 }, layer: 'below',
  }));

  const threshAnnotations = [[50,'Tốt','#009a00'],[100,'Trung bình','#b8a000'],[150,'Kém','#c05a00'],[200,'Xấu','#aa0000']].map(
    ([y, text, color]) => ({ xref:'paper',x:1,yref:'y',y, text:`<b>${text}</b>`, showarrow:false, xanchor:'left', xshift:6, font:{color,size:9}, bgcolor:'rgba(255,255,255,0.85)', borderpad:2 })
  );

  return (
    <Plot
      data={[{
        type: 'scatter', mode: 'lines+markers+text',
        x: xLabels, y: vals,
        line: { color: '#1565c0', width: 2.5, shape: 'spline' },
        marker: { color: colors, size: 16, line: { color: '#fff', width: 2 } },
        text: vals.map(v => `<b>${Math.round(v)}</b>`),
        textposition: 'top center',
        textfont: { size: 11, color: '#333' },
        customdata: labels,
        hovertemplate: '<b>%{x}</b><br>AQI: <b>%{y:.0f}</b><br>%{customdata}<extra></extra>',
      }]}
      layout={{
        ...L,
        xaxis: { tickfont: { size: 10 }, gridcolor: 'rgba(0,0,0,0.04)' },
        yaxis: { title: 'US AQI', range: [0, Math.max(...vals) * 1.5], gridcolor: 'rgba(0,0,0,0.06)' },
        shapes, annotations: threshAnnotations,
        showlegend: false, height: 340,
        margin: { l: 40, r: 70, t: 20, b: 10 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Safe/Unsafe Windows ───────────────────────────────────────────────────────
function SafeWindows({ forecast }) {
  const safe   = forecast.filter(f => f.level <= 1);
  const unsafe = forecast.filter(f => f.level >= 3);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 8, fontSize: '0.85rem' }}>Khung giờ an toàn</div>
        {safe.length ? safe.map(f => (
          <span key={f.horizon} style={{ display: 'inline-block', margin: '2px 3px', background: '#dcfce7', color: '#15803d', borderRadius: 6, padding: '2px 9px', fontSize: '0.8rem', fontWeight: 600 }}>
            {f.time_str} ({f.date_str})
          </span>
        )) : <span style={{ color: '#666', fontSize: '0.82rem' }}>Không có trong 72h tới</span>}
      </div>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8, fontSize: '0.85rem' }}>Khung giờ cần hạn chế</div>
        {unsafe.length ? unsafe.map(f => (
          <span key={f.horizon} style={{ display: 'inline-block', margin: '2px 3px', background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '2px 9px', fontSize: '0.8rem', fontWeight: 600 }}>
            {f.time_str} ({f.date_str})
          </span>
        )) : <span style={{ color: '#666', fontSize: '0.82rem' }}>Không có trong 72h tới</span>}
      </div>
    </div>
  );
}


// ── Gauge Chart ───────────────────────────────────────────────────────────────
function GaugeChart({ aqi, label, color }) {
  return (
    <Plot
      data={[{
        type: 'indicator', mode: 'gauge+number', value: aqi,
        number: { font: { size: 56, color }, suffix: '' },
        title: { text: `<b>${label}</b>`, font: { size: 15, color } },
        gauge: {
          axis: { range: [0, 300], tickwidth: 1, tickfont: { size: 10 }, nticks: 7 },
          bar: { color, thickness: 0.28 }, bgcolor: 'white', borderwidth: 0,
          steps: [
            { range: [0,   50],  color: '#d4f8d4' }, { range: [50,  100], color: '#fdfac4' },
            { range: [100, 150], color: '#fde3bc' }, { range: [150, 200], color: '#fbbaba' },
            { range: [200, 300], color: '#e8c7ee' },
          ],
          threshold: { line: { color: '#333', width: 3 }, thickness: 0.8, value: aqi },
        },
        domain: { x: [0, 1], y: [0.08, 1] },
      }]}
      layout={{
        height: 230, margin: { l: 15, r: 15, t: 15, b: 5 },
        paper_bgcolor: 'rgba(0,0,0,0)',
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Province Map Wide (full-width) ──────────────────────────────────────────
const PROVINCE_COORDS = {
  thanh_hoa: { x: 30, y: 18,  name: 'Thanh Hóa' },
  nghe_an:   { x: 22, y: 38,  name: 'Nghệ An'   },
  ha_tinh:   { x: 27, y: 55,  name: 'Hà Tĩnh'   },
  hue:       { x: 38, y: 82,  name: 'Huế'        },
};

function ProvinceMapWide({ activeSlug, forecastData }) {
  const aqi   = forecastData?.current?.aqi ?? 0;
  const color = forecastData?.current?.color ?? '#ccc';
  const label = forecastData?.current?.label ?? '';

  // Mock AQI for other provinces (in real app would fetch all)
  const mockAQI = { thanh_hoa: 147, nghe_an: 89, ha_tinh: 112, hue: 65 };

  return (
    <div style={{ position: 'relative', background: 'linear-gradient(180deg,#dceeff 0%,#e8f5e9 100%)', borderRadius: 12, overflow: 'hidden', height: 260 }}>
      {/* SVG map background - simplified Vietnam coast outline */}
      <svg viewBox="0 0 120 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
        <path d="M60,5 L75,20 L80,40 L70,60 L75,80 L65,100 L70,120 L60,140 L50,160 L45,180 L55,195 L40,190 L35,170 L45,150 L40,130 L50,110 L45,90 L55,70 L50,50 L55,30 Z" fill="#2196f3" />
      </svg>

      {/* Province markers */}
      {Object.entries(PROVINCE_COORDS).map(([slug, pos]) => {
        const isActive = slug === activeSlug;
        const mAqi     = isActive ? aqi : mockAQI[slug];
        const mColor   = aqiColor(mAqi);
        const mLabel   = isActive ? label : AQI_LABELS[aqiLevel(mAqi)];

        return (
          <div key={slug} style={{
            position: 'absolute',
            left: `${pos.x}%`, top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: isActive ? 10 : 5,
          }}>
            {/* Pulse ring for active */}
            {isActive && (
              <div style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%', border: `3px solid ${mColor}`,
                animation: 'pulse 1.5s infinite',
                opacity: 0.5,
              }} />
            )}
            {/* Marker */}
            <div style={{
              width: isActive ? 52 : 44, height: isActive ? 52 : 44,
              borderRadius: '50%', background: mColor,
              border: `3px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.7)'}`,
              boxShadow: isActive ? `0 4px 16px ${mColor}88` : '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: isActive ? '0.95rem' : '0.8rem', fontWeight: 900, color: AQI_TEXT_COLORS[aqiLevel(mAqi)], lineHeight: 1 }}>
                {Math.round(mAqi)}
              </div>
            </div>
            {/* Label */}
            <div style={{
              position: 'absolute', top: '105%', left: '50%',
              transform: 'translateX(-50%)',
              background: isActive ? '#1e293b' : 'rgba(30,41,59,0.75)',
              color: '#fff', borderRadius: 6, padding: '2px 7px',
              fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap',
              marginTop: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>
              {pos.name}
            </div>
          </div>
        );
      })}

// ── Health Advisory Card (thay thế EvalCard — không trùng Tab5) ──────────────
function HealthAdvisory({ recommendation, forecast }) {
  if (!recommendation) return null;
  const HOUR_SLOTS = [
    { label: 'Sáng sớm', range: '5–8h',  icon: '🌅' },
    { label: 'Buổi sáng', range: '8–12h', icon: '☀️' },
    { label: 'Buổi trưa', range: '12–14h',icon: '🌞' },
    { label: 'Buổi chiều',range: '14–18h',icon: '🌤️' },
    { label: 'Chiều tối', range: '18–21h',icon: '🌆' },
    { label: 'Ban đêm',   range: '21–5h', icon: '🌙' },
  ];
  // Tính mức AQI trung bình theo slot từ forecast
  const slotLevels = [0,1,2,3,4,5].map(i => {
    const h = [6,9,12,15,18,22][i];
    const match = forecast?.find(f => {
      const fh = new Date(f.datetime).getHours();
      return Math.abs(fh - h) <= 2;
    });
    return match?.level ?? 1;
  });
  const SLOT_BG = ['#f0fdf4','#fffde7','#fff7ed','#fef2f2','#f5f3ff','#f8fafc'];
  const SLOT_TC = ['#15803d','#a16207','#c2410c','#dc2626','#7c3aed','#475569'];

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
        Khuyến nghị hoạt động theo khung giờ
      </div>
      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 14 }}>
        Dựa trên mức AQI dự báo và tiêu chuẩn WHO/QCVN 05:2023
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        {HOUR_SLOTS.map((slot, i) => {
          const lvl = slotLevels[i];
          const bg  = SLOT_BG[Math.min(lvl, 5)];
          const tc  = SLOT_TC[Math.min(lvl, 5)];
          const statusText = ['An toàn','Chấp nhận','Hạn chế','Tránh ra ngoài','Nguy hiểm','Khẩn cấp'][lvl] || 'Chấp nhận';
          return (
            <div key={i} style={{ background: bg, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '1.1rem' }}>{slot.icon}</span>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>{slot.label}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{slot.range}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: tc }}>{statusText}</div>
            </div>
          );
        })}
      </div>

      {/* Nhóm dễ bị ảnh hưởng */}
      {recommendation.sensitive?.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontWeight: 700, color: '#c2410c', fontSize: '0.82rem', marginBottom: 6 }}>
            Lưu ý — Nhóm dễ bị ảnh hưởng
          </div>
          {recommendation.sensitive.map((s, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: '#7c3f00', marginBottom: 3, display: 'flex', gap: 6 }}>
              <span style={{ flexShrink: 0 }}>•</span> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function Tab1Forecast({ data }) {
  if (!data) return null;
  const { current, forecast, pollutants, weather, recommendation, province, slug } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Hero AQI ──────────────────────────────────────────────────── */}
      <AQIHero current={current} recommendation={recommendation} province={province} />

      {/* ── 2-col: Gauge + Pollutants ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <GaugeChart aqi={current.aqi} label={current.label} color={current.color} />
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#555', marginTop: 4, lineHeight: 1.5, padding: '0 6px' }}>
            {recommendation?.desc}
          </p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <PollutantGrid pollutants={pollutants} />
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
            <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Điều kiện thời tiết</div>
            <WeatherRow weather={weather} />
          </div>
        </div>
      </div>

      {/* ── Map full-width ────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: '0.92rem' }}>
          Bản đồ AQI — 4 tỉnh Miền Trung
        </div>
        <ProvinceMapWide activeSlug={slug || 'thanh_hoa'} forecastData={data} />
      </div>

      {/* ── Forecast Chart ────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Dự báo AQI — 72 giờ tiếp theo</div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 10 }}>Kết quả từ mô hình PCA + ML tốt nhất. Giai đoạn dữ liệu: 08/2022 – 03/2026.</div>
        <ForecastChart forecast={forecast} />
        <SafeWindows forecast={forecast} />
      </div>

      {/* ── Health Advisory ───────────────────────────────────────────── */}
      <HealthAdvisory recommendation={recommendation} forecast={forecast} />

    </div>
  );
}
