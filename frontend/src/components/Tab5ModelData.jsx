import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { api } from '../api.js';

const L = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

export default function Tab5ModelData({ slug }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getModelSummary(slug).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p style={{ color: '#94a3b8', padding: 20 }}>Đang tải...</p>;
  if (error)   return <p style={{ color: '#c62828', padding: 20 }}>Lỗi: {error}</p>;
  if (!data)   return null;

  const sorted     = [...data.models].sort((a, b) => a.rmse - b.rmse);
  const barColors  = sorted.map(m => m.is_best ? '#ffd700' : '#90caf9');
  const bestModel  = data.models.find(m => m.is_best);
  // Tính max label length để set left margin đủ rộng
  const maxLabelLen = Math.max(...sorted.map(m => ((m.is_best ? '⭐ ' : '') + m.name).length));
  const leftMargin  = Math.max(130, maxLabelLen * 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Info card ───────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#e3f2fd,#e8f5e9)', border: '1px solid #bbdefb', borderRadius: 12, padding: 18, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'TỈNH',         value: data.name,                        color: '#1565c0' },
          { label: 'BEST MODEL',   value: `⭐ ${data.best}`,                color: '#2e7d32' },
          { label: 'RMSE (Best)',  value: bestModel?.rmse.toFixed(3) ?? '—', color: '#37474f' },
          { label: 'R² (Best)',    value: bestModel?.r2?.toFixed(3) ?? '—', color: '#37474f' },
          { label: 'WLA (Best)',   value: `${bestModel?.wla.toFixed(1)}%`  ?? '—', color: '#37474f' },
          { label: 'Số PC (PCA 95%)', value: `${data.n_pc} PC`,            color: '#37474f' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: '0.72rem', color: '#546e7a', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── RMSE bar chart ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
          So sánh RMSE — {data.name}
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 10 }}>
          Mô hình màu vàng = best model. RMSE thấp hơn = dự báo chính xác hơn.
        </p>
        <Plot
        data={[{
          type: 'scatter', mode: 'markers+text',
          x: sorted.map(m => m.rmse),
          y: sorted.map(m => (m.is_best ? '⭐ ' : '') + m.name),
          marker: { color: barColors, size: 14, line: { color: 'rgba(0,0,0,0.2)', width: 1 } },
          text: sorted.map(m => m.rmse.toFixed(3)),
          textposition: 'middle right',
          textfont: { size: 11 },
        }]}
          layout={{
            ...L,
            xaxis: { title: 'RMSE', range: [0, 25], gridcolor: 'rgba(0,0,0,0.06)', zeroline: true },
            yaxis: { tickfont: { size: 11 }, automargin: true },
            height: 530,
            showlegend: false,
            margin: { l: leftMargin, r: 80, t: 20, b: 50 },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>

      {/* ── Bảng chi tiết với R² ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
          Bảng kết quả chi tiết (PCA 95%)
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 12 }}>
          RMSE = Root Mean Squared Error &nbsp;|&nbsp; WLA = Weighted Level Accuracy &nbsp;|&nbsp; R² = Hệ số xác định (Coefficient of Determination)
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Mô hình', 'RMSE', 'WLA (%)', 'R²'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Mô hình' ? 'left' : 'center', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.models.map((m, i) => (
                <tr key={i} style={{ background: m.is_best ? '#fff9c4' : i % 2 === 0 ? '#fff' : '#fafbfc', fontWeight: m.is_best ? 700 : 400 }}>
                  <td style={{ padding: '8px 16px' }}>{m.is_best ? '⭐ ' : ''}{m.name}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{m.rmse.toFixed(3)}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{m.wla.toFixed(1)}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{m.r2?.toFixed(3) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── So sánh 4 tỉnh ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 12, fontSize: '0.95rem' }}>
          So sánh Best Model — 4 tỉnh
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Tỉnh', 'Best Model', 'Số PC (PCA 95%)', 'RMSE', 'WLA (%)', 'R²'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.all_best.map((row, i) => (
                <tr key={i} style={{ background: row.slug === slug ? '#e3f2fd' : i % 2 === 0 ? '#fff' : '#fafbfc', fontWeight: row.slug === slug ? 700 : 400 }}>
                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>{row.province}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>{row.model}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>{row.n_pc}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{row.rmse.toFixed(3)}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{row.wla.toFixed(1)}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{row.r2?.toFixed(3) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info footer */}
      <div style={{ background: '#e8f4fd', borderLeft: '3px solid #1565c0', borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: '0.8rem', color: '#1a3a5c' }}>
        Nguồn dữ liệu: Open-Meteo Air Quality API (CAMS Global) + ERA5 Weather.
        Giai đoạn dữ liệu: 08/2022 – 03/2026. Dự báo đa bước: 1h / 3h / 6h / 12h / 24h / 48h / 72h.
        Mô hình NBEATS bị loại do kết quả âm ở một số tỉnh.
      </div>

    </div>
  );
}
