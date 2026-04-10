import React from 'react';
import { AQI_LABELS, AQI_COLORS, AQI_TEXT_COLORS } from '../constants.js';

export default function Tab2Classification({ data }) {
  if (!data) return null;
  const { current, recommendation: rec, forecast } = data;
  const lvl   = current.level;
  const color = AQI_COLORS[lvl];
  const tc    = AQI_TEXT_COLORS[lvl];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Mức AQI hiện tại ────────────────────────────────────────────── */}
      <div style={{
        background: color, color: tc,
        borderRadius: 14, padding: '20px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          {rec.icon} AQI {current.aqi} — {current.label} ({rec.label_en})
        </div>
        <div style={{ marginTop: 6, fontSize: '1rem', opacity: 0.92 }}>{rec.desc}</div>
      </div>

      {/* ── 2-col: Khuyến nghị + Hoạt động ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>📋 Khuyến nghị chung</h3>
          {rec.general?.map((item, i) => (
            <p key={i} style={{ marginBottom: 6, fontSize: '0.9rem', display: 'flex', gap: 8 }}>
              <span style={{ color: '#1565c0' }}>•</span> {item}
            </p>
          ))}

          <h3 style={{ fontWeight: 700, margin: '16px 0 10px', color: '#1e293b' }}>⚠️ Nhóm dễ bị ảnh hưởng</h3>
          {rec.sensitive?.map((item, i) => (
            <p key={i} style={{ marginBottom: 6, fontSize: '0.9rem', display: 'flex', gap: 8 }}>
              <span style={{ color: '#e53935' }}>•</span> {item}
            </p>
          ))}

          {rec.avoid?.length > 0 && (
            <>
              <h3 style={{ fontWeight: 700, margin: '16px 0 10px', color: '#1e293b' }}>🚫 Cần tránh</h3>
              {rec.avoid.map((item, i) => (
                <p key={i} style={{ marginBottom: 6, fontSize: '0.9rem', color: '#c62828' }}>{item}</p>
              ))}
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>⏰ Khung giờ an toàn</h3>
            <div style={{
              background: '#f0f4ff', borderLeft: `4px solid ${color}`,
              borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: '0.9rem',
            }}>
              {rec.safe_hours}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>✅ Hoạt động phù hợp</h3>
            {rec.activities?.map((act, i) => (
              <div key={i} style={{
                background: '#f8fafd', borderRadius: 8,
                padding: '8px 12px', marginBottom: 6,
                fontSize: '0.88rem', fontWeight: 500,
              }}>
                {act}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AQI Reference Table ──────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 14, color: '#1e293b' }}>📊 Bảng phân loại AQI (US Standard)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Mức', 'Phân loại', 'Khoảng AQI', 'Ý nghĩa'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AQI_LABELS.map((label, i) => (
                <tr key={i} style={{
                  background: lvl === i ? `${AQI_COLORS[i]}22` : (i % 2 === 0 ? '#fff' : '#fafbfc'),
                  fontWeight: lvl === i ? 700 : 400,
                  border: lvl === i ? `2px solid ${AQI_COLORS[i]}` : 'none',
                }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-block', width: 14, height: 14,
                      borderRadius: '50%', background: AQI_COLORS[i],
                      border: '1px solid rgba(0,0,0,0.1)',
                      verticalAlign: 'middle', marginRight: 6,
                    }} />
                    {i + 1}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{label}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {i < 5 ? `${[0,51,101,151,201,301][i]} – ${[50,100,150,200,300,500][i]}` : '301 – 500'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#555', fontSize: '0.83rem' }}>
                    {[
                      'Không ảnh hưởng đến sức khỏe',
                      'Nhóm nhạy cảm có thể bị ảnh hưởng nhẹ',
                      'Có hại cho nhóm nhạy cảm',
                      'Có hại cho tất cả mọi người',
                      'Khẩn cấp với nhóm nhạy cảm',
                      'Tình trạng khẩn cấp về môi trường',
                    ][i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
