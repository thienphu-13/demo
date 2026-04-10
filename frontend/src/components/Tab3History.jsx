import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { api } from '../api.js';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, AQI_RGBA, aqiLevel, aqiColor } from '../constants.js';

const CHART_LAYOUT = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 13 } };

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: '#f8fafd', border: '1px solid #e0e7f0', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1565c0' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: '#999', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function HistoryLineChart({ records }) {
  const times  = records.map(r => r.time);
  const aqiVals = records.map(r => r.aqi);
  const pm25    = records.map(r => r.pm2_5);
  const hasPm25 = pm25.some(v => v != null);

  const shapes = AQI_BINS.slice(0, -1).map((lo, i) => ({
    type: 'rect', xref: 'paper', x0: 0, x1: 1,
    yref: 'y', y0: lo, y1: AQI_BINS[i + 1],
    fillcolor: AQI_RGBA[i] || 'rgba(0,0,0,0)', line: { width: 0 }, layer: 'below',
  }));

  const traces = [{
    x: times, y: aqiVals, mode: 'lines+markers', name: 'AQI',
    line: { color: '#1565c0', width: 2 },
    marker: { color: aqiVals.map(aqiColor), size: 4, line: { color: '#fff', width: 0.5 } },
    hovertemplate: '<b>%{x|%d/%m %H:%M}</b><br>AQI: <b>%{y:.0f}</b><extra></extra>',
  }];

  if (hasPm25) traces.push({
    x: times, y: pm25, mode: 'lines', name: 'PM2.5 (µg/m³)',
    line: { color: '#e53935', width: 1.5, dash: 'dot' },
    yaxis: 'y2', opacity: 0.75,
    hovertemplate: '<b>%{x|%d/%m %H:%M}</b><br>PM2.5: <b>%{y:.1f}</b><extra></extra>',
  });

  return (
    <Plot
      data={traces}
      layout={{
        ...CHART_LAYOUT,
        title: { text: 'Lịch sử AQI gần đây', font: { size: 15, color: '#333' }, x: 0.02 },
        xaxis: { title: 'Thời gian', gridcolor: 'rgba(0,0,0,0.05)' },
        yaxis: { title: 'US AQI', gridcolor: 'rgba(0,0,0,0.06)' },
        ...(hasPm25 ? { yaxis2: { title: 'PM2.5 (µg/m³)', overlaying: 'y', side: 'right', showgrid: false } } : {}),
        height: 420,
        hovermode: 'x unified',
        legend: { orientation: 'h', x: 0, y: 1.08 },
        shapes,
        margin: { l: 10, r: 80, t: 45, b: 10 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

function HourlyPatternChart({ pattern }) {
  const hours  = pattern.map(p => p.hour);
  const means  = pattern.map(p => p.mean);
  const stds   = pattern.map(p => p.std);
  const upper  = means.map((m, i) => m + stds[i]);
  const lower  = means.map((m, i) => Math.max(0, m - stds[i]));

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
          x: hours, y: means, mode: 'lines+markers', name: 'AQI TB',
          line: { color: '#1565c0', width: 2.2 },
          marker: { color: means.map(aqiColor), size: 7, line: { color: 'white', width: 1.2 } },
          hovertemplate: '<b>%{x:02d}:00</b><br>AQI TB: <b>%{y:.1f}</b><extra></extra>',
        },
      ]}
      layout={{
        ...CHART_LAYOUT,
        title: { text: 'AQI trung bình theo giờ trong ngày', font: { size: 15, color: '#333' }, x: 0.02 },
        xaxis: {
          title: 'Giờ trong ngày',
          tickmode: 'array', tickvals: [0,3,6,9,12,15,18,21,23],
          ticktext: ['0:00','3:00','6:00','9:00','12:00','15:00','18:00','21:00','23:00'],
          gridcolor: 'rgba(0,0,0,0.05)',
        },
        yaxis: { title: 'AQI', gridcolor: 'rgba(0,0,0,0.06)' },
        height: 300,
        legend: { orientation: 'h', x: 0, y: 1.08 },
        margin: { l: 10, r: 20, t: 45, b: 10 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

function PieChart({ distribution }) {
  const entries  = Object.entries(distribution);
  const labels   = entries.map(([k]) => AQI_LABELS[parseInt(k)]);
  const values   = entries.map(([, v]) => v);
  const colors   = entries.map(([k]) => AQI_COLORS[parseInt(k)]);

  return (
    <Plot
      data={[{
        type: 'pie', labels, values, hole: 0.4,
        marker: { colors, line: { color: '#fff', width: 2 } },
        textinfo: 'percent', hoverinfo: 'label+value',
      }]}
      layout={{
        ...CHART_LAYOUT,
        showlegend: true,
        legend: { orientation: 'h', yanchor: 'bottom', y: -0.25, xanchor: 'center', x: 0.5 },
        margin: { l: 10, r: 10, t: 30, b: 10 },
        height: 300,
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
    setLoading(true);
    setError(null);
    api.getHistory(slug, days)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, days]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 600, color: '#475569' }}>📅 Hiển thị:</span>
        {[3, 7, 14, 30].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            padding: '6px 16px', borderRadius: 8, border: '1px solid #e0e7f0',
            background: days === d ? '#1565c0' : '#fff',
            color: days === d ? '#fff' : '#475569',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
          }}>
            {d} ngày
          </button>
        ))}
        {loading && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>⏳ Đang tải...</span>}
      </div>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f44336', borderRadius: 10, padding: 14, color: '#c62828' }}>
          ❌ {error}
        </div>
      )}

      {data && (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            <StatCard label="Số giờ dữ liệu" value={`${data.stats.n_rows.toLocaleString()}`} sub="điểm" />
            <StatCard label="AQI trung bình"  value={data.stats.mean}  sub="US AQI" />
            <StatCard label="AQI cao nhất"    value={data.stats.max}   sub={AQI_LABELS[aqiLevel(data.stats.max)]} />
            <StatCard label="AQI thấp nhất"   value={data.stats.min}   sub={AQI_LABELS[aqiLevel(data.stats.min)]} />
            <StatCard label="Độ lệch chuẩn"   value={`±${data.stats.std}`} sub="" />
            <StatCard label="Giờ 'Tốt' (≤50)" value={`${data.stats.n_good}%`} sub="thời gian" />
          </div>

          {/* Line chart */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <HistoryLineChart records={data.records} />
          </div>

          {/* Bottom 2-col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>🕐 AQI TB theo giờ</h3>
              <HourlyPatternChart pattern={data.hourly_pattern} />
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>🥧 Phân bố mức AQI</h3>
              <PieChart distribution={data.level_distribution} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
