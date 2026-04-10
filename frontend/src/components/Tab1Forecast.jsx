import React from 'react';
import Plot from 'react-plotly.js';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, AQI_RGBA, AQI_TEXT_COLORS, aqiLevel, aqiColor } from '../constants.js';

const LAYOUT_BASE = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

// ── Gauge ────────────────────────────────────────────────
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
        height: 250, margin: { l: 15, r: 15, t: 15, b: 5 },
        paper_bgcolor: 'rgba(0,0,0,0)',
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Pollutant Card ────────────────────────────────────────────────────────────
function PollutantCard({ data }) {
  const pct   = data.who ? Math.min((data.value / data.who) * 100, 200) : 0;
  const color = data.value <= data.who ? '#2e7d32' : data.value <= data.vn ? '#f57c00' : '#c62828';
  const status = data.value <= data.who ? 'Dưới ngưỡng WHO' : data.value <= data.vn ? 'Trên ngưỡng WHO' : 'Vượt QCVN';
  return (
    <div style={{ background: '#f8fafd', border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#333', marginBottom: 4 }}>{data.name}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>
        {data.value.toFixed(1)}
        <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 400 }}> {data.unit}</span>
      </div>
      <div style={{ background: '#e8e8e8', borderRadius: 4, height: 5, margin: '6px 0' }}>
        <div style={{ width: `${Math.min(pct, 100).toFixed(0)}%`, background: color, height: 5, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: '0.7rem', color: '#777', lineHeight: 1.5 }}>
        <span style={{ color }}>● {status}</span><br />
        WHO: {data.who} {data.unit}<br />
        QCVN 05:2023: {data.vn} {data.unit}
      </div>
    </div>
  );
}

// ── Forecast Bar Chart ────────────────────────────────────────────────────────
function ForecastChart({ forecast }) {
  const xLabels  = forecast.map(f => `${f.time_str}<br>${f.date_str}`);
  const vals     = forecast.map(f => f.aqi);
  const colors   = forecast.map(f => f.color);
  const labels   = forecast.map(f => f.label);
  const textColors = forecast.map(f => AQI_TEXT_COLORS[aqiLevel(f.aqi)]);

  const shapes = AQI_BINS.slice(0, -1).map((lo, i) => ({
    type: 'rect', xref: 'paper', x0: 0, x1: 1,
    yref: 'y', y0: lo, y1: AQI_BINS[i + 1],
    fillcolor: AQI_RGBA[i] || 'rgba(0,0,0,0)', line: { width: 0 }, layer: 'below',
  }));

  const threshAnnotations = [[50,'Tốt','#009a00'],[100,'Trung bình','#b8a000'],[150,'Kém','#c05a00'],[200,'Xấu','#aa0000']].map(
    ([y, text, color]) => ({ xref:'paper',x:1,yref:'y',y, text:`<b>${text}</b>`, showarrow:false, xanchor:'left', xshift:6, font:{color,size:9}, bgcolor:'rgba(255,255,255,0.85)', borderpad:2 })
  );
  const labelAnnotations = xLabels.map((xl, i) => ({
    x: xl, y: vals[i], text: `<b>${labels[i]}</b>`,
    showarrow: false, yshift: 11, font: { size: 10, color: '#333' },
    bgcolor: 'rgba(255,255,255,0.78)', borderpad: 2,
  }));

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
        ...LAYOUT_BASE,
        title: { text: 'Dự báo AQI theo các mốc thời gian', font: { size: 14, color: '#333' }, x: 0.02 },
        xaxis: { tickfont: { size: 10 } },
        yaxis: { title: 'US AQI', range: [0, Math.max(Math.max(...vals) * 1.5, 210)], gridcolor: 'rgba(0,0,0,0.06)' },
        shapes, annotations: [...threshAnnotations, ...labelAnnotations],
        showlegend: false, height: 400,
        margin: { l: 10, r: 70, t: 40, b: 10 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Safe / Unsafe Windows ─────────────────────────────────────────────────────
function SafeWindows({ forecast }) {
  const safe   = forecast.filter(f => f.level <= 1);
  const unsafe = forecast.filter(f => f.level >= 3);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 4 }}>
      <div style={{ background: '#e8f5e9', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#2e7d32', marginBottom: 8, fontSize: '0.9rem' }}>Khung giờ an toàn</div>
        {safe.length ? safe.map(f => (
          <span key={f.horizon} style={{ display: 'inline-block', margin: '3px 4px', background: '#c8e6c9', color: '#1b5e20', borderRadius: 6, padding: '3px 10px', fontSize: '0.82rem', fontWeight: 600 }}>
            {f.time_str} ({f.date_str})
          </span>
        )) : <span style={{ color: '#666', fontSize: '0.83rem' }}>Không có trong 72h tới</span>}
      </div>
      <div style={{ background: '#fdecea', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 8, fontSize: '0.9rem' }}>Khung giờ cần hạn chế</div>
        {unsafe.length ? unsafe.map(f => (
          <span key={f.horizon} style={{ display: 'inline-block', margin: '3px 4px', background: '#ffcdd2', color: '#b71c1c', borderRadius: 6, padding: '3px 10px', fontSize: '0.82rem', fontWeight: 600 }}>
            {f.time_str} ({f.date_str})
          </span>
        )) : <span style={{ color: '#666', fontSize: '0.83rem' }}>Không có trong 72h tới</span>}
      </div>
    </div>
  );
}

// ── Model Evaluation Card ─────────────────────────────────────────────────────
function EvalSection({ slug }) {
  const evalData = {
    thanh_hoa: { model: 'CatBoost', rmse: 13.97, wla: 77.5, r2: 0.781, n_pc: 18 },
    nghe_an:   { model: 'CatBoost', rmse: 10.47, wla: 83.3, r2: 0.836, n_pc: 17 },
    ha_tinh:   { model: 'Lasso',    rmse: 10.52, wla: 82.9, r2: 0.831, n_pc: 18 },
    hue:       { model: 'CatBoost', rmse:  9.38, wla: 88.6, r2: 0.865, n_pc: 19 },
  };
  const d = evalData[slug] || evalData.thanh_hoa;

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
        Đánh giá hiệu suất mô hình dự báo
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 14 }}>
        Kết quả đánh giá trên tập kiểm tra — mô hình tốt nhất được chọn tự động qua PCA ({d.n_pc} thành phần chính).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { label: 'Mô hình tốt nhất', value: d.model,             unit: '',   color: '#1565c0' },
          { label: 'RMSE',             value: d.rmse.toFixed(3),    unit: '',   color: '#e53935', note: 'thấp hơn = tốt hơn' },
          { label: 'R²',               value: d.r2.toFixed(3),      unit: '',   color: '#2e7d32', note: 'cao hơn = tốt hơn' },
          { label: 'WLA',              value: `${d.wla.toFixed(1)}%`, unit: '', color: '#6a1b9a', note: 'độ chính xác phân loại mức AQI' },
          { label: 'Số thành phần PCA',value: `${d.n_pc} PC`,       unit: '',   color: '#00838f' },
        ].map(({ label, value, color, note }) => (
          <div key={label} style={{ background: '#f8fafd', border: '1px solid #e0e7f0', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color }}>{value}</div>
            {note && <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 3 }}>{note}</div>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, background: '#e8f4fd', borderLeft: '3px solid #1565c0', borderRadius: '0 8px 8px 0', padding: '8px 12px', fontSize: '0.78rem', color: '#1a3a5c' }}>
        Mô hình được huấn luyện trên dữ liệu quan trắc 08/2022 – 03/2026.
        Dự báo đa bước: 1h / 3h / 6h / 12h / 24h / 48h / 72h.
        RMSE = Root Mean Squared Error &nbsp;|&nbsp; WLA = Weighted Level Accuracy &nbsp;|&nbsp; R² = Hệ số xác định
      </div>
    </div>
  );
}
function ProvinceMap({ provinces, forecastData, activeSlug }) {
  const coords = {
    thanh_hoa: { lat: 19.808, lon: 105.776, name: 'Thanh Hóa' },
    nghe_an:   { lat: 19.234, lon: 104.920, name: 'Nghệ An'   },
    ha_tinh:   { lat: 18.343, lon: 105.906, name: 'Hà Tĩnh'   },
    hue:       { lat: 16.462, lon: 107.595, name: 'Huế'        },
  };

  const aqi = forecastData?.current?.aqi ?? 0;
  const color = forecastData?.current?.color ?? '#ccc';
  const label = forecastData?.current?.label ?? '';

  return (
    <Plot
      data={[{
        type: 'scattergeo',
        mode: 'markers+text',
        lat: Object.values(coords).map(c => c.lat),
        lon: Object.values(coords).map(c => c.lon),
        text: Object.values(coords).map(c => c.name),
        textposition: 'top center',
        textfont: { size: 11, color: '#333' },
        marker: {
          size: Object.keys(coords).map(s => s === activeSlug ? 22 : 14),
          color: Object.keys(coords).map(s => s === activeSlug ? color : '#90caf9'),
          line: { color: '#fff', width: 2 },
          symbol: 'circle',
        },
        customdata: Object.keys(coords).map(s =>
          s === activeSlug ? `${aqi} — ${label}` : 'Chọn để xem'
        ),
        hovertemplate: '<b>%{text}</b><br>%{customdata}<extra></extra>',
      }]}
      layout={{
        geo: {
          scope: 'asia',
          center: { lat: 17.5, lon: 106.5 },
          projection: { scale: 12 },
          showland: true, landcolor: '#f0f4f0',
          showocean: true, oceancolor: '#dceeff',
          showcoastlines: true, coastlinecolor: '#aaa',
          showrivers: true, rivercolor: '#a8d4f5',
          showcountries: true, countrycolor: '#bbb',
          bgcolor: 'rgba(0,0,0,0)',
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, t: 0, b: 0 },
        height: 320,
        font: { family: 'Inter, sans-serif' },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Tab1Forecast({ data, loading }) {
  if (!data) return null;
  const { current, forecast, pollutants, weather, province, slug } = data;
  const pollutantKeys = ['pm2_5','pm10','nitrogen_dioxide','ozone','sulphur_dioxide','carbon_monoxide'];
  const weatherItems = [
    { label: 'Nhiệt độ',    key: 'temperature_2m',       unit: '°C'   },
    { label: 'Độ ẩm',       key: 'relative_humidity_2m', unit: '%'    },
    { label: 'Tốc độ gió',  key: 'wind_speed_10m',       unit: 'km/h' },
    { label: 'Mây che phủ', key: 'cloud_cover',          unit: '%'    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── AQI + Pollutants + Weather ─────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>
          Chỉ số AQI — {province}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px,240px) 1fr', gap: 20, alignItems: 'start' }}>

          {/* Gauge */}
          <div>
            <GaugeChart aqi={current.aqi} label={current.label} color={current.color} />
            <p style={{ textAlign: 'center', fontSize: '0.83rem', color: '#555', marginTop: 4, lineHeight: 1.4 }}>
              {data.recommendation?.desc}
            </p>
          <div>
            {/* Pollutants */}
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>
              Chỉ số ô nhiễm — so sánh với ngưỡng WHO và QCVN 05:2023
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {pollutantKeys.map(key => pollutants[key] && <PollutantCard key={key} data={pollutants[key]} />)}
            </div>
            </div>
            
            {/* ── Bản đồ vị trí ─────────────────────────────────────────────── */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  Vị trí các tỉnh quan trắc
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8 }}>
                  Chấm lớn = tỉnh đang xem. Màu thể hiện mức AQI hiện tại.
              </p>
              <ProvinceMap forecastData={data} activeSlug={data.slug} />
            </div>
            
            {/* Weather */}
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Điều kiện thời tiết</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {weatherItems.map(({ label, key, unit }) => (
                <div key={key} style={{ background: '#f8fafd', border: '1px solid #e0e7f0', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1a202c' }}>
                    {weather[key] != null ? weather[key].toFixed(1) : '—'}
                    <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 400 }}> {unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Forecast Chart ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
          Dự báo AQI
        </h2>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 12 }}>
          Dự báo đa bước sử dụng mô hình PCA + Machine Learning. Dữ liệu đầu vào: 08/2022 – 03/2026.
        </p>
        {forecast && <ForecastChart forecast={forecast} />}
      </div>

      {/* ── Safe / Unsafe Windows ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
          Khung giờ an toàn / cần hạn chế trong 72 giờ tới
        </h2>
        {forecast && <SafeWindows forecast={forecast} />}
      </div>

      {/* ── Model Evaluation ──────────────────────────────────────────────── */}
      <EvalSection slug={data.slug || 'thanh_hoa'} />

    </div>
  );
}
