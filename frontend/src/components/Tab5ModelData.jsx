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



      {/* ── RMSE bar chart ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
          So sánh RMSE - {data.name}
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 10 }}>
          Mô hình màu vàng = best model. RMSE thấp hơn = dự báo chính xác hơn.
        </p>
        <Plot
          data={[{
            type: 'bar', orientation: 'h',
            x: sorted.map(m => m.rmse),
            y: sorted.map(m => (m.is_best ? '⭐ ' : '') + m.name),
            marker: { color: barColors, line: { color: 'rgba(0,0,0,0.1)', width: 1 } },
            text: sorted.map(m => m.rmse.toFixed(3)),
            textposition: 'outside',
            textfont: { size: 11 },
          }]}
          layout={{
            ...L,
            xaxis: { title: 'RMSE (thấp hơn = tốt hơn)', gridcolor: 'rgba(0,0,0,0.06)' },
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
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{m.r2?.toFixed(3) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Best model tổng hợp 4 tỉnh (centered) ──────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
          Best model tổng hợp 4 tỉnh
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 14 }}>
          So sánh hiệu suất mô hình tốt nhất trên từng tỉnh.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Tỉnh', 'Best Model', 'Số PC (PCA 95%)', 'RMSE', 'WLA (%)', 'R²'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.all_best.map((row, i) => (
                <tr key={i} style={{ background: row.slug === slug ? '#e3f2fd' : i % 2 === 0 ? '#fff' : '#fafbfc', fontWeight: row.slug === slug ? 700 : 400, borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: row.slug === slug ? '#1565c0' : '#334155', fontWeight: row.slug === slug ? 800 : 500 }}>{row.province}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>{row.model}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{row.n_pc}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: 'monospace', color: '#dc2626' }}>{row.rmse.toFixed(3)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: 'monospace', color: '#7c3aed' }}>{row.wla.toFixed(1)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700 }}>{row.r2?.toFixed(3) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info footer */}
      <div style={{ background: '#e8f4fd', borderLeft: '3px solid #1565c0', borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: '0.8rem', color: '#1a3a5c' }}>
        Nguồn dữ liệu: Open-Meteo Air Quality API (CAMS Global) + ERA5 Weather.
      </div>

    </div>
  );
}
