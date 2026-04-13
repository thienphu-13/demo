import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { api } from '../api.js';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, AQI_RGBA, aqiLevel, aqiColor } from '../constants.js';

const L = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: '#f8fafd', border: '1px solid #e0e7f0', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1565c0' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function HistoryLineChart({ records }) {
  const times   = records.map(r => r.time);
  const aqiVals = records.map(r => r.aqi);
  const pm25    = records.map(r => r.pm2_5);
  const hasPm25 = pm25.some(v => v != null);

  const shapes = AQI_BINS.slice(0, -1).map((lo, i) => ({
    type: 'rect', xref: 'paper', x0: 0, x1: 1,
    yref: 'y', y0: lo, y1: AQI_BINS[i + 1],
    fillcolor: AQI_RGBA[i] || 'rgba(0,0,0,0)', line: { width: 0 }, layer: 'below',
  }));

  const threshAnnotations = [[50,'Tốt','#009a00'],[100,'Trung bình','#b8a000'],[150,'Kém','#c05a00'],[200,'Xấu','#aa0000']].map(
    ([y, text, color]) => ({ xref:'paper',x:1,yref:'y',y, text:`<b>${text}</b>`, showarrow:false, xanchor:'left', xshift:5, font:{color,size:9}, bgcolor:'rgba(255,255,255,0.85)', borderpad:1 })
  );

  const traces = [
    {
      x: times, y: aqiVals, mode: 'lines+markers', name: 'AQI',
      line: { color: '#1565c0', width: 2 },
      marker: { color: aqiVals.map(aqiColor), size: 4, line: { color: '#fff', width: 0.5 } },
      hovertemplate: '<b>%{x|%d/%m %H:%M}</b><br>AQI: <b>%{y:.0f}</b><extra></extra>',
    },
    ...(hasPm25 ? [{
      x: times, y: pm25, mode: 'lines', name: 'PM2.5 (µg/m³)',
      line: { color: '#e53935', width: 1.5, dash: 'dot' },
      yaxis: 'y2', opacity: 0.7,
      hovertemplate: '<b>%{x|%d/%m %H:%M}</b><br>PM2.5: <b>%{y:.1f}</b><extra></extra>',
    }] : []),
  ];

  return (
    <Plot
      data={traces}
      layout={{
        ...L,
        title: { text: 'Lịch sử AQI theo thời gian', font: { size: 14, color: '#333' }, x: 0.02 },
        xaxis: {
          title: 'Thời gian', gridcolor: 'rgba(0,0,0,0.05)',
          tickformat: '%d/%m\n%H:%M',
          tickangle: -30,
          nticks: 12,
          automargin: true,
        },
        yaxis: { title: 'US AQI', gridcolor: 'rgba(0,0,0,0.06)',    
        range: [0, Math.max(...aqiVals, 50) * 1.3] },
        ...(hasPm25 ? { yaxis2: { title: 'PM2.5 (µg/m³)', overlaying: 'y', side: 'right', showgrid: false } } : {}),
        shapes,
        height: 480,
        hovermode: 'x unified',
        legend: { orientation: 'h', x: 0, y: 1.06, font: { size: 11 } },
        margin: { l: 50, r: 55, t: 50, b: 60 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

function HourlyPatternChart({ pattern }) {
  const hours = pattern.map(p => p.hour);
  const means = pattern.map(p => p.mean);
  const stds  = pattern.map(p => p.std);
  const upper = means.map((m, i) => m + stds[i]);
  const lower = means.map((m, i) => Math.max(0, m - stds[i]));

  return (
    <Plot
      data={[
        {
          x: [...hours, ...hours.slice().reverse()],
          y: [...upper, ...lower.slice().reverse()],
          fill: 'toself', fillcolor: 'rgba(21,101,192,0.12)',
          line: { color: 'rgba(0,0,0,0)' }, name: '±1 Std', hoverinfo: 'skip',
        },
        {
          x: hours, y: means, mode: 'lines+markers', name: 'AQI trung bình',
          line: { color: '#1565c0', width: 2.2 },
          marker: { color: means.map(aqiColor), size: 7, line: { color: 'white', width: 1 } },
          hovertemplate: '<b>%{x:02d}:00</b><br>AQI TB: <b>%{y:.1f}</b><extra></extra>',
        },
      ]}
      layout={{
        ...L,
        title: { text: 'AQI trung bình theo giờ trong ngày', font: { size: 14, color: '#333' }, x: 0.02 },
        xaxis: {
          title: 'Giờ trong ngày', gridcolor: 'rgba(0,0,0,0.05)',
          tickmode: 'array',
          tickvals: [0,2,4,6,8,10,12,14,16,18,20,22],
          ticktext: ['0h','2h','4h','6h','8h','10h','12h','14h','16h','18h','20h','22h'],
        },
        yaxis: { title: 'AQI', gridcolor: 'rgba(0,0,0,0.06)', rangemode: 'tozero' },
        height: 320,
        legend: { orientation: 'h', x: 0, y: 1.08, font: { size: 11 } },
        margin: { l: 50, r: 20, t: 50, b: 50 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

function PieChart({ distribution }) {
  const entries = Object.entries(distribution).sort((a, b) => +a[0] - +b[0]);
  return (
    <Plot
      data={[{
        type: 'pie',
        labels: entries.map(([k]) => AQI_LABELS[+k]),
        values: entries.map(([, v]) => v),
        hole: 0.42,
        marker: { colors: entries.map(([k]) => AQI_COLORS[+k]), line: { color: '#fff', width: 2 } },
        textinfo: 'percent', hoverinfo: 'label+value+percent',
        textfont: { size: 11 },
      }]}
      layout={{
        ...L,
        showlegend: true,
        legend: { orientation: 'h', yanchor: 'bottom', y: -0.3, xanchor: 'center', x: 0.5, font: { size: 11 } },
        margin: { l: 10, r: 10, t: 20, b: 20 },
        height: 320,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

export default function Tab3History({ slug }) {
  const [days, setDays]       = useState(7);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    api.getHistory(slug, days)
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [slug, days]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.88rem' }}>Hiển thị:</span>
        {[3, 7, 14, 30].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            padding: '6px 16px', borderRadius: 8,
            border: `1px solid ${days === d ? '#1565c0' : '#e0e7f0'}`,
            background: days === d ? '#1565c0' : '#fff',
            color: days === d ? '#fff' : '#475569',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
          }}>
            {d} ngày
          </button>
        ))}
        {loading && <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>Đang tải...</span>}
      </div>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f44336', borderRadius: 8, padding: 12, color: '#c62828', fontSize: '0.88rem' }}>
          Lỗi: {error}
        </div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
            <StatCard label="Số giờ dữ liệu" value={data.stats.n_rows.toLocaleString()} sub="điểm" />
            <StatCard label="AQI trung bình"  value={data.stats.mean}  sub="US AQI" />
            <StatCard label="AQI cao nhất"    value={data.stats.max}   sub={AQI_LABELS[aqiLevel(data.stats.max)]} />
            <StatCard label="AQI thấp nhất"   value={data.stats.min}   sub={AQI_LABELS[aqiLevel(data.stats.min)]} />
            <StatCard label="Độ lệch chuẩn"   value={`±${data.stats.std}`} sub="" />
            <StatCard label="Giờ tốt (≤50)"   value={`${data.stats.n_good}%`} sub="thời gian" />
          </div>

          {/* Line chart */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <HistoryLineChart records={data.records} />
          </div>

          {/* Hourly + Pie */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <HourlyPatternChart pattern={data.hourly_pattern} />
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.92rem' }}>Phân bố mức AQI</h3>
              <PieChart distribution={data.level_distribution} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
