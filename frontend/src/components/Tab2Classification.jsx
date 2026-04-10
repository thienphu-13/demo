import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { api } from '../api.js';
import { AQI_LABELS, AQI_COLORS, AQI_TEXT_COLORS, AQI_BINS, aqiLevel, aqiColor } from '../constants.js';

const PROVINCES = [
  { slug: 'thanh_hoa', name: 'Thanh Hóa' },
  { slug: 'nghe_an',   name: 'Nghệ An'   },
  { slug: 'ha_tinh',   name: 'Hà Tĩnh'   },
  { slug: 'hue',       name: 'Huế'        },
];

const L = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

// ── AQI Province Card ─────────────────────────────────────────────────────────
function ProvinceCard({ name, data, isActive }) {
  if (!data) return (
    <div style={{ background: '#f8fafd', borderRadius: 14, padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
      Đang tải {name}...
    </div>
  );
  const { current } = data;
  const color = AQI_COLORS[current.level];
  const tc    = AQI_TEXT_COLORS[current.level];
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      boxShadow: isActive ? `0 4px 20px ${color}55` : '0 1px 8px rgba(0,0,0,0.08)',
      border: isActive ? `2px solid ${color}` : '2px solid transparent',
      transition: 'all 0.2s',
    }}>
      {/* Header */}
      <div style={{ background: color, color: tc, padding: '14px 18px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.85 }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>{current.aqi}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{current.label}</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ background: '#fff', padding: '12px 16px' }}>
        {/* Mini pollutants */}
        {['pm2_5','pm10','ozone'].map(key => {
          const d = data.pollutants?.[key]; if (!d) return null;
          const pct = Math.min((d.value / d.who) * 100, 200);
          const c2  = d.value <= d.who ? '#2e7d32' : d.value <= d.vn ? '#f57c00' : '#c62828';
          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 2 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>{d.name}</span>
                <span style={{ color: c2, fontWeight: 700 }}>{d.value.toFixed(1)} {d.unit}</span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: 3, height: 4 }}>
                <div style={{ width: `${Math.min(pct,100)}%`, background: c2, height: 4, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
        {/* Weather */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
          {[
            { label: 'Nhiệt độ', key: 'temperature_2m',       unit: '°C'   },
            { label: 'Độ ẩm',    key: 'relative_humidity_2m', unit: '%'    },
            { label: 'Gió',      key: 'wind_speed_10m',       unit: 'km/h' },
          ].map(({ label, key, unit }) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1' }}>
                {data.weather?.[key] != null ? data.weather[key].toFixed(1) : '—'}
                <span style={{ fontSize: '0.6rem', color: '#64748b' }}> {unit}</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Comparison Bar Chart ──────────────────────────────────────────────────────
function ComparisonChart({ allData }) {
  const loaded = allData.filter(d => d);
  if (loaded.length === 0) return null;

  const names  = allData.map((d, i) => d?.province || PROVINCES[i].name);
  const aqiVals= allData.map(d => d?.current?.aqi ?? 0);
  const colors = aqiVals.map(v => aqiColor(v));
  const labels = aqiVals.map(v => AQI_LABELS[aqiLevel(v)]);

  const shapes = AQI_BINS.slice(0,-1).map((lo, i) => ({
    type:'rect', xref:'paper', x0:0, x1:1,
    yref:'y', y0:lo, y1:AQI_BINS[i+1],
    fillcolor: ['rgba(0,228,0,0.08)','rgba(255,255,0,0.08)','rgba(255,126,0,0.08)','rgba(255,0,0,0.08)','rgba(143,63,151,0.08)'][i] || 'rgba(0,0,0,0)',
    line:{width:0}, layer:'below',
  }));

  return (
    <Plot
      data={[{
        type: 'bar',
        x: names, y: aqiVals,
        marker: { color: colors, line: { color: 'rgba(0,0,0,0.1)', width: 1 } },
        text: aqiVals.map((v,i) => `<b>${Math.round(v)}</b><br>${labels[i]}`),
        textposition: 'outside',
        textfont: { size: 11 },
        customdata: labels,
        hovertemplate: '<b>%{x}</b><br>AQI: <b>%{y:.0f}</b><br>%{customdata}<extra></extra>',
      }]}
      layout={{
        ...L,
        xaxis: { tickfont: { size: 12 } },
        yaxis: { title: 'US AQI', range: [0, Math.max(...aqiVals, 50) * 1.5], gridcolor: 'rgba(0,0,0,0.06)' },
        shapes,
        showlegend: false, height: 320, bargap: 0.45,
        margin: { l: 50, r: 30, t: 20, b: 50 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Pollutant Cross-Province Table ────────────────────────────────────────────
function PollutantCompareTable({ allData }) {
  const pollutantKeys = [
    { key: 'pm2_5', who: 15, vn: 25, name: 'PM2.5 (µg/m³)' },
    { key: 'pm10',  who: 45, vn: 50, name: 'PM10 (µg/m³)'  },
    { key: 'nitrogen_dioxide', who: 25,  vn: 100, name: 'NO₂ (µg/m³)' },
    { key: 'ozone', who: 100, vn: 120, name: 'O₃ (µg/m³)'  },
  ];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Chỉ số</th>
            {PROVINCES.map(p => (
              <th key={p.slug} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>{p.name}</th>
            ))}
            <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Ngưỡng WHO</th>
            <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>QCVN</th>
          </tr>
        </thead>
        <tbody>
          {pollutantKeys.map(({ key, who, vn, name }) => (
            <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '9px 14px', fontWeight: 600, color: '#334155' }}>{name}</td>
              {allData.map((d, i) => {
                const val = d?.pollutants?.[key]?.value;
                if (val == null) return <td key={i} style={{ padding: '9px 14px', textAlign: 'center', color: '#94a3b8' }}>—</td>;
                const color = val <= who ? '#2e7d32' : val <= vn ? '#f57c00' : '#c62828';
                return (
                  <td key={i} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color }}>
                    {val.toFixed(1)}
                  </td>
                );
              })}
              <td style={{ padding: '9px 14px', textAlign: 'center', color: '#2e7d32', fontWeight: 600 }}>{who}</td>
              <td style={{ padding: '9px 14px', textAlign: 'center', color: '#1565c0', fontWeight: 600 }}>{vn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function Tab2Classification({ data: activeData }) {
  const [allData, setAllData] = useState([null, null, null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(PROVINCES.map(p => api.getForecast(p.slug).catch(() => null)))
      .then(results => { setAllData(results); setLoading(false); });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1565c0,#0097a7)', borderRadius: 14, padding: '18px 22px', color: '#fff' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>
          So sánh Chất lượng Không khí — 4 tỉnh Miền Trung
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.88 }}>
          Dữ liệu quan trắc tổng hợp từ Open-Meteo CAMS Global · Giai đoạn: 08/2022 – 03/2026
        </div>
      </div>

      {/* 4 Province Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {PROVINCES.map((p, i) => (
          <ProvinceCard key={p.slug} name={p.name} data={allData[i]} isActive={p.slug === activeData?.slug} />
        ))}
      </div>

      {/* Comparison Bar Chart */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
          Biểu đồ so sánh AQI — 4 tỉnh
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 10 }}>
          Giá trị AQI hiện tại. Màu thanh theo mức phân loại AQI (US Standard).
        </div>
        {loading ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Đang tải...</div>
          : <ComparisonChart allData={allData} />}
      </div>

      {/* Pollutant Comparison Table */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
          Bảng so sánh chỉ số ô nhiễm — 4 tỉnh
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 12 }}>
          Xanh = dưới WHO · Cam = trên WHO · Đỏ = vượt QCVN 05:2023
        </div>
        {loading ? <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>Đang tải...</div>
          : <PollutantCompareTable allData={allData} />}
      </div>

      {/* Forecast comparison mini */}
      {!loading && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 12, fontSize: '0.95rem' }}>
            Dự báo AQI 72h — So sánh 4 tỉnh
          </div>
          <Plot
            data={PROVINCES.map((p, i) => ({
              type: 'scatter', mode: 'lines+markers',
              x: allData[i]?.forecast?.map(f => `${f.time_str} (${f.date_str})`),
              y: allData[i]?.forecast?.map(f => f.aqi),
              name: p.name,
              line: { width: 2 },
              marker: { size: 8 },
            })).filter(d => d.x)}
            layout={{
              plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Inter, sans-serif', size: 11 },
              xaxis: { tickfont: { size: 9 }, gridcolor: 'rgba(0,0,0,0.04)' },
              yaxis: { title: 'US AQI', gridcolor: 'rgba(0,0,0,0.06)' },
              legend: { orientation: 'h', x: 0, y: 1.08 },
              height: 300,
              hovermode: 'x unified',
              margin: { l: 50, r: 20, t: 30, b: 60 },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      )}

    </div>
  );
}
