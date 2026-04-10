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

  const mockAQI = { thanh_hoa: 147, nghe_an: 89, ha_tinh: 112, hue: 65 };

  const provinces = [
    { slug: 'thanh_hoa', name: 'Thanh Hóa', lat: 19.808, lon: 105.776 },
    { slug: 'nghe_an',   name: 'Nghệ An',   lat: 18.679, lon: 105.682 },
    { slug: 'ha_tinh',   name: 'Hà Tĩnh',   lat: 18.343, lon: 105.906 },
    { slug: 'hue',       name: 'Huế',        lat: 16.462, lon: 107.595 },
  ];

  const lats    = provinces.map(p => p.lat);
  const lons    = provinces.map(p => p.lon);
  const aqiVals = provinces.map(p => p.slug === activeSlug ? aqi : mockAQI[p.slug]);
  const colors  = aqiVals.map(v => aqiColor(v));
  const labels  = provinces.map(p => p.name);
  const sizes   = provinces.map(p => p.slug === activeSlug ? 36 : 26);
  const texts   = aqiVals.map((v, i) =>
    `<b>${provinces[i].name}</b><br>AQI: <b>${Math.round(v)}</b> — ${AQI_LABELS[aqiLevel(v)]}`
  );

  return (
    <Plot
      data={[{
        type: 'scattermapbox',
        lat: lats, lon: lons,
        mode: 'markers+text',
        marker: {
          size: sizes,
          color: colors,
          opacity: 0.92,
          allowoverlap: true,
        },
        text: provinces.map((p, i) =>
          `<b style="font-size:14px">${Math.round(aqiVals[i])}</b>`
        ),
        textposition: 'middle center',
        textfont: {
          size: provinces.map(p => p.slug === activeSlug ? 13 : 11),
          color: aqiVals.map(v => AQI_TEXT_COLORS[aqiLevel(v)]),
        },
        customdata: texts,
        hovertemplate: '%{customdata}<extra></extra>',
      }]}
      layout={{
        mapbox: {
          style: 'open-street-map',
          center: { lat: 18.2, lon: 106.2 },
          zoom: 5.4,
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, t: 0, b: 0 },
        height: 340,
        showlegend: false,
      }}
      config={{ displayModeBar: false, responsive: true, scrollZoom: false }}
      style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }}
    />
  );
}


      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '8px 10px', fontSize: '0.68rem' }}>
        <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>Mức AQI</div>
        {[['Tốt','#00e400'],['Trung bình','#ffff00'],['Kém','#ff7e00'],['Xấu','#ff0000']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
            <span style={{ color: '#475569' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Title */}
      <div style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
        Bản đồ AQI — Miền Trung VN
      </div>

      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.3); opacity: 0.2; } }`}</style>
    </div>
  );
}

// ── Evaluation Card ───────────────────────────────────────────────────────────
function EvalCard({ slug }) {
  const evalData = {
    thanh_hoa: { model: 'CatBoost', rmse: 13.97, wla: 77.5, r2: 0.781, n_pc: 18 },
    nghe_an:   { model: 'CatBoost', rmse: 10.47, wla: 83.3, r2: 0.836, n_pc: 17 },
    ha_tinh:   { model: 'Lasso',    rmse: 10.52, wla: 82.9, r2: 0.831, n_pc: 18 },
    hue:       { model: 'CatBoost', rmse:  9.38, wla: 88.6, r2: 0.865, n_pc: 19 },
  };
  const d = evalData[slug] || evalData.thanh_hoa;
  const metrics = [
    { label: 'Mô hình',  value: d.model,            color: '#1565c0' },
    { label: 'RMSE',     value: d.rmse.toFixed(3),  color: '#dc2626', note: '↓ tốt hơn' },
    { label: 'R²',       value: d.r2.toFixed(3),    color: '#16a34a', note: '↑ tốt hơn' },
    { label: 'WLA',      value: `${d.wla}%`,        color: '#7c3aed', note: 'độ chính xác' },
    { label: 'Số PC',    value: `${d.n_pc} PC`,     color: '#0891b2' },
  ];
  return (
    <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px' }}>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.88rem' }}>Đánh giá hiệu suất mô hình dự báo</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {metrics.map(({ label, value, color, note }) => (
          <div key={label} style={{ textAlign: 'center', minWidth: 70 }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
            {note && <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{note}</div>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#64748b' }}>
        Giai đoạn dữ liệu: 08/2022 – 03/2026 · Dự báo đa bước: 1h / 3h / 6h / 12h / 24h / 48h / 72h
      </div>
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

      {/* ── Eval Card ─────────────────────────────────────────────────── */}
      <EvalCard slug={slug || 'thanh_hoa'} />

    </div>
  );
}
