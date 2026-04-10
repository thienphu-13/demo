import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { api } from '../api.js';

const CHART_LAYOUT = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

export default function Tab5ModelData({ slug }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getModelSummary(slug)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p style={{ color: '#94a3b8', padding: 20 }}>⏳ Đang tải...</p>;
  if (error)   return <p style={{ color: '#c62828', padding: 20 }}>❌ {error}</p>;
  if (!data)   return null;

  const sorted = [...data.models].sort((a, b) => a.rmse - b.rmse);
  const barColors = sorted.map(m => m.is_best ? '#ffd700' : '#90caf9');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Best model info card ─────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #e3f2fd, #e8f5e9)',
        border: '1px solid #bbdefb', borderRadius: 14, padding: 20,
        display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#546e7a', fontWeight: 600 }}>TỈNH</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1565c0' }}>{data.name}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#546e7a', fontWeight: 600 }}>BEST MODEL</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2e7d32' }}>⭐ {data.best}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#546e7a', fontWeight: 600 }}>RMSE (Best)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#37474f' }}>
            {data.models.find(m => m.is_best)?.rmse.toFixed(3) ?? '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#546e7a', fontWeight: 600 }}>WLA (Best)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#37474f' }}>
            {data.models.find(m => m.is_best)?.wla.toFixed(1) ?? '—'}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#546e7a', fontWeight: 600 }}>PCA (95%)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#37474f' }}>{data.n_pc} PC</div>
        </div>
      </div>

      {/* ── RMSE bar chart ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
          📊 So sánh RMSE — {data.name}
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 12 }}>
          ⭐ = Best model (vàng). RMSE thấp hơn = tốt hơn.
        </p>
        <Plot
          data={[{
            type: 'bar', orientation: 'h',
            x: sorted.map(m => m.rmse),
            y: sorted.map(m => (m.is_best ? '⭐ ' : '') + m.name),
            marker: { color: barColors },
            text: sorted.map(m => m.rmse.toFixed(3)),
            textposition: 'outside',
          }]}
          layout={{
            ...CHART_LAYOUT,
            title: { text: `So sánh RMSE — ${data.name}`, font: { size: 14 }, x: 0.02 },
            xaxis: { title: 'RMSE (thấp hơn = tốt hơn)' },
            yaxis: { tickfont: { size: 11 } },
            height: 520,
            showlegend: false,
            margin: { l: 10, r: 80, t: 45, b: 10 },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>

      {/* ── Model table ──────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
          🏆 Bảng kết quả chi tiết (PCA 95%)
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 14 }}>
          RMSE = Root Mean Squared Error | WLA = Weighted Level Accuracy
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Mô hình', 'RMSE', 'WLA (%)'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.models.map((m, i) => (
                <tr key={i} style={{
                  background: m.is_best ? '#fff9c4' : (i % 2 === 0 ? '#fff' : '#fafbfc'),
                  fontWeight: m.is_best ? 700 : 400,
                }}>
                  <td style={{ padding: '9px 16px' }}>{m.is_best ? '⭐ ' : ''}{m.name}</td>
                  <td style={{ padding: '9px 16px', fontFamily: 'monospace' }}>{m.rmse.toFixed(3)}</td>
                  <td style={{ padding: '9px 16px', fontFamily: 'monospace' }}>{m.wla.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cross-province best model summary ────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>🗺️ So sánh Best Model — 4 tỉnh</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Tỉnh', 'Best Model', 'n_PC (PCA 95%)', 'RMSE', 'WLA (%)'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.all_best.map((row, i) => (
                <tr key={i} style={{
                  background: row.slug === slug ? '#e3f2fd' : (i % 2 === 0 ? '#fff' : '#fafbfc'),
                  fontWeight: row.slug === slug ? 700 : 400,
                }}>
                  <td style={{ padding: '9px 16px' }}>{row.province}</td>
                  <td style={{ padding: '9px 16px' }}>{row.model}</td>
                  <td style={{ padding: '9px 16px', textAlign: 'center' }}>{row.n_pc}</td>
                  <td style={{ padding: '9px 16px', fontFamily: 'monospace' }}>{row.rmse.toFixed(3)}</td>
                  <td style={{ padding: '9px 16px', fontFamily: 'monospace' }}>{row.wla.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Data sources info ─────────────────────────────────────────────── */}
      <div style={{
        background: '#e8f4fd', borderLeft: '4px solid #1565c0',
        borderRadius: '0 10px 10px 0', padding: '14px 18px', fontSize: '0.87rem', color: '#1a3a5c',
      }}>
        📡 <strong>Nguồn dữ liệu:</strong> Open-Meteo Air Quality API (CAMS Global) + ERA5 Weather.
        Dữ liệu huấn luyện: 08/2022 – 03/2026. Mô hình dự báo multi-horizon: 1h / 3h / 6h / 12h / 24h / 48h / 72h.
      </div>
    </div>
  );
}
