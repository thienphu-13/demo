import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, AQI_RGBA, AQI_TEXT_COLORS, aqiLevel, aqiColor } from '../constants.js';

const CHART_LAYOUT = {
  plot_bgcolor:  'rgba(0,0,0,0)',
  paper_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif', size: 13 },
};

// ── Gauge ─────────────────────────────────────────────────────────────────────
function GaugeChart({ aqi, label, color, timeStr }) {
  return (
    <Plot
      data={[{
        type:  'indicator',
        mode:  'gauge+number',
        value: aqi,
        number: { font: { size: 52, color }, suffix: '' },
        title:  { text: `<b>${label}</b>`, font: { size: 16, color } },
        gauge: {
          axis: { range: [0, 300], tickwidth: 1, tickfont: { size: 10 }, nticks: 7 },
          bar:  { color, thickness: 0.28 },
          bgcolor: 'white',
          borderwidth: 0,
          steps: [
            { range: [0,   50],  color: '#d4f8d4' },
            { range: [50,  100], color: '#fdfac4' },
            { range: [100, 150], color: '#fde3bc' },
            { range: [150, 200], color: '#fbbaba' },
            { range: [200, 300], color: '#e8c7ee' },
          ],
          threshold: { line: { color: '#333', width: 3 }, thickness: 0.8, value: aqi },
        },
        domain: { x: [0, 1], y: [0.05, 1] },
      }]}
      layout={{
        height: 260,
        margin: { l: 15, r: 15, t: 20, b: 5 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        annotations: [{
          text: `<span style="color:#888;font-size:11px">${timeStr}</span>`,
          x: 0.5, y: 0.0, xref: 'paper', yref: 'paper',
          showarrow: false, xanchor: 'center',
        }],
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Forecast Bar + Line ───────────────────────────────────────────────────────
function ForecastChart({ forecast }) {
  const xLabels = forecast.map(f => `${f.time_str}<br>${f.date_str}`);
  const vals    = forecast.map(f => f.aqi);
  const colors  = forecast.map(f => f.color);
  const labels  = forecast.map(f => f.label);
  const insideTC = forecast.map(f => AQI_TEXT_COLORS[aqiLevel(f.aqi)]);

  const hrects = AQI_BINS.slice(0, -1).map((lo, i) => ({
    type: 'rect', xref: 'paper', x0: 0, x1: 1,
    yref: 'y', y0: lo, y1: AQI_BINS[i + 1],
    fillcolor: AQI_RGBA[i] || 'rgba(0,0,0,0)', line: { width: 0 },
    layer: 'below',
  }));

  const thresholdAnnotations = [
    [50,  'Tốt',       '#009a00'],
    [100, 'Trung bình','#b8a000'],
    [150, 'Kém',       '#c05a00'],
    [200, 'Xấu',       '#aa0000'],
  ].map(([y, text, color]) => ({
    xref: 'paper', x: 1, yref: 'y', y,
    text: `<b>${text}</b>`, showarrow: false,
    xanchor: 'left', xshift: 6,
    font: { color, size: 10 },
    bgcolor: 'rgba(255,255,255,0.85)', borderpad: 2,
  }));

  const labelAnnotations = xLabels.map((xl, i) => ({
    x: xl, y: vals[i],
    text: `<b>${labels[i]}</b>`,
    showarrow: false, yshift: 11,
    font: { size: 11, color: '#333' },
    bgcolor: 'rgba(255,255,255,0.78)', borderpad: 2,
  }));

  return (
    <Plot
      data={[{
        type: 'bar',
        x: xLabels, y: vals,
        marker: { color: colors, line: { color: 'rgba(0,0,0,0.15)', width: 1 } },
        text: vals.map(v => `<b>${Math.round(v)}</b>`),
        textposition: 'inside',
        insidetextanchor: 'middle',
        textfont: { size: 15, color: insideTC },
        customdata: labels,
        hovertemplate: '<b>%{x}</b><br>AQI: <b>%{y:.0f}</b><br>Mức: <b>%{customdata}</b><extra></extra>',
      }]}
      layout={{
        ...CHART_LAYOUT,
        title: { text: 'Dự báo AQI — Các mốc trong 72 giờ tới', font: { size: 15, color: '#333' }, x: 0.02 },
        xaxis: { title: null, tickfont: { size: 11 } },
        yaxis: { title: 'US AQI', range: [0, Math.max(Math.max(...vals) * 1.38, 210)], gridcolor: 'rgba(0,0,0,0.06)' },
        shapes: hrects,
        annotations: [...thresholdAnnotations, ...labelAnnotations],
        showlegend: false,
        height: 430,
        bargap: 0.38,
        margin: { l: 10, r: 70, t: 45, b: 10 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Pollutant Card ────────────────────────────────────────────────────────────
function PollutantCard({ data }) {
  const pct   = data.who ? Math.min((data.value / data.who) * 100, 200) : 0;
  const color = data.value <= data.who ? '#2e7d32'
              : data.value <= data.vn  ? '#f57c00'
              : '#c62828';
  return (
    <div style={{
      background: '#f8fafd', border: '1px solid #e0e7f0', borderRadius: 10,
      padding: '12px', marginBottom: 10,
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>{data.name}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>
        {data.value.toFixed(1)}
        <span style={{ fontSize: '0.75rem', color: '#888' }}> {data.unit}</span>
      </div>
      <div style={{ background: '#eee', borderRadius: 4, height: 6, margin: '6px 0' }}>
        <div style={{ width: `${Math.min(pct, 100).toFixed(0)}%`, background: color, height: 6, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: '0.75rem', color: '#666' }}>
        WHO: {data.who} | QCVN: {data.vn} {data.unit}
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, delta, deltaColor, unit }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e7f0', borderRadius: 12,
      padding: '14px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a202c' }}>
        {value}<span style={{ fontSize: '0.8rem', color: '#888' }}> {unit}</span>
      </div>
      {delta !== undefined && (
        <div style={{ fontSize: '0.75rem', color: deltaColor || '#64748b', marginTop: 2 }}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ── Safe/Unsafe Windows ───────────────────────────────────────────────────────
function SafeWindows({ forecast }) {
  const safe   = forecast.filter(f => f.level <= 1);
  const unsafe = forecast.filter(f => f.level >= 3);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
      <div style={{ background: '#e8f5e9', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#2e7d32', marginBottom: 8 }}>✅ Khung giờ an toàn</div>
        {safe.length ? safe.map(f => (
          <span key={f.horizon} style={{
            display: 'inline-block', margin: '3px 4px',
            background: '#c8e6c9', color: '#1b5e20',
            borderRadius: 6, padding: '3px 10px', fontSize: '0.85rem', fontWeight: 600,
          }}>
            {f.time_str} ({f.date_str})
          </span>
        )) : <span style={{ color: '#666', fontSize: '0.85rem' }}>Không có trong 72h tới</span>}
      </div>
      <div style={{ background: '#fdecea', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 8 }}>⚠️ Khung giờ cần tránh</div>
        {unsafe.length ? unsafe.map(f => (
          <span key={f.horizon} style={{
            display: 'inline-block', margin: '3px 4px',
            background: '#ffcdd2', color: '#b71c1c',
            borderRadius: 6, padding: '3px 10px', fontSize: '0.85rem', fontWeight: 600,
          }}>
            {f.time_str} ({f.date_str})
          </span>
        )) : <span style={{ color: '#666', fontSize: '0.85rem' }}>Không có trong 72h tới 🎉</span>}
      </div>
    </div>
  );
}

// ── Main Tab Component ─────────────────────────────────────────────────────────
export default function Tab1Forecast({ data, loading }) {
  if (!data) return null;

  const { current, forecast, pollutants, weather, province } = data;
  const lvlColors = ['#e8f5e9','#fffde7','#fff3e0','#fdecea','#f3e5f5','#fdecea'];

  const pollutantKeys = ['pm2_5','pm10','nitrogen_dioxide','ozone','sulphur_dioxide','carbon_monoxide'];
  const weatherItems = [
    { label: '🌡️ Nhiệt độ', key: 'temperature_2m',       unit: '°C' },
    { label: '💧 Độ ẩm',    key: 'relative_humidity_2m',  unit: '%' },
    { label: '💨 Tốc độ gió',key: 'wind_speed_10m',       unit: 'km/h' },
    { label: '☁️ Mây che phủ',key: 'cloud_cover',         unit: '%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Thời điểm hiện tại ─────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>
          📌 Thời điểm hiện tại — {province}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 24, alignItems: 'start' }}>

          {/* Gauge */}
          <div>
            <GaugeChart
              aqi={current.aqi}
              label={current.label}
              color={current.color}
              timeStr={current.time_str}
            />
            <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#555', marginTop: 4 }}>
              {data.recommendation?.desc}
            </p>
          </div>

          {/* Pollutants + Weather */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: 12 }}>
              🔬 Chỉ số ô nhiễm (so với ngưỡng WHO / QCVN)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
              {pollutantKeys.map(key => pollutants[key] && (
                <PollutantCard key={key} data={pollutants[key]} />
              ))}
            </div>

            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: 10 }}>
              🌤️ Thời tiết
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {weatherItems.map(({ label, key, unit }) => (
                <MetricCard
                  key={key}
                  label={label}
                  value={weather[key] != null ? weather[key].toFixed(1) : '—'}
                  unit={unit}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Biểu đồ dự báo ─────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
          📈 Dự báo AQI — 72 giờ tới
        </h2>
        <p style={{ fontSize: '0.83rem', color: '#94a3b8', marginBottom: 16 }}>
          Dự báo từ thời điểm quan trắc mới nhất dùng mô hình PCA + ML.
        </p>
        {forecast && <ForecastChart forecast={forecast} />}
      </section>

      {/* ── Safe Windows ────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
          ⏰ Khung giờ an toàn trong 72 giờ tới
        </h2>
        {forecast && <SafeWindows forecast={forecast} />}
      </section>

    </div>
  );
}
