import React from 'react';
import { AQI_LABELS, AQI_COLORS, AQI_TEXT_COLORS } from '../constants.js';

export default function Tab2Classification({ data }) {
  if (!data) return null;
  const { current, recommendation: rec } = data;
  const lvl   = current.level;
  const color = AQI_COLORS[lvl];
  const tc    = AQI_TEXT_COLORS[lvl];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Mức AQI ─────────────────────────────────────────────────────── */}
      <div style={{ background: color, color: tc, borderRadius: 12, padding: '18px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
          AQI {current.aqi} — {current.label} ({rec.label_en})
        </div>
        <div style={{ marginTop: 6, fontSize: '0.95rem', opacity: 0.92 }}>{rec.desc}</div>
      </div>

      {/* ── 2-col ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 10, color: '#1e293b', fontSize: '0.95rem' }}>Khuyến nghị chung</h3>
          {rec.general?.map((item, i) => (
            <p key={i} style={{ marginBottom: 6, fontSize: '0.88rem', display: 'flex', gap: 8 }}>
              <span style={{ color: '#1565c0', flexShrink: 0 }}>•</span> {item}
            </p>
          ))}

          <h3 style={{ fontWeight: 700, margin: '14px 0 8px', color: '#1e293b', fontSize: '0.95rem' }}>Nhóm dễ bị ảnh hưởng</h3>
          {rec.sensitive?.map((item, i) => (
            <p key={i} style={{ marginBottom: 6, fontSize: '0.88rem', display: 'flex', gap: 8 }}>
              <span style={{ color: '#e53935', flexShrink: 0 }}>•</span> {item}
            </p>
          ))}

          {rec.avoid?.length > 0 && (
            <>
              <h3 style={{ fontWeight: 700, margin: '14px 0 8px', color: '#1e293b', fontSize: '0.95rem' }}>Cần tránh</h3>
              {rec.avoid.map((item, i) => (
                <p key={i} style={{ marginBottom: 5, fontSize: '0.88rem', color: '#c62828' }}>{item}</p>
              ))}
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 10, color: '#1e293b', fontSize: '0.95rem' }}>Khung giờ an toàn</h3>
            <div style={{ background: '#f0f4ff', borderLeft: `4px solid ${color}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: '0.88rem' }}>
              {rec.safe_hours}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 10, color: '#1e293b', fontSize: '0.95rem' }}>Hoạt động phù hợp</h3>
            {rec.activities?.map((act, i) => (
              <div key={i} style={{ background: '#f8fafd', borderRadius: 8, padding: '7px 12px', marginBottom: 5, fontSize: '0.85rem', fontWeight: 500 }}>
                {act}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bảng phân loại AQI ───────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12, color: '#1e293b', fontSize: '0.95rem' }}>Bảng phân loại AQI (US Standard)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Mức', 'Phân loại', 'Khoảng AQI', 'Nhóm dễ bị ảnh hưởng', 'Ý nghĩa'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AQI_LABELS.map((label, i) => (
                <tr key={i} style={{
                  background: lvl === i ? `${AQI_COLORS[i]}22` : i % 2 === 0 ? '#fff' : '#fafbfc',
                  fontWeight: lvl === i ? 700 : 400,
                  outline: lvl === i ? `2px solid ${AQI_COLORS[i]}` : 'none',
                }}>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: AQI_COLORS[i], border: '1px solid rgba(0,0,0,0.1)', verticalAlign: 'middle', marginRight: 6 }} />
                    {i + 1}
                  </td>
                  <td style={{ padding: '9px 14px' }}>{label}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {['0–50','51–100','101–150','151–200','201–300','301–500'][i]}
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: '0.8rem', color: '#555' }}>
                    {[
                      'Không có',
                      'Nhóm rất nhạy cảm với ô nhiễm không khí',
                      'Người già, trẻ em, phụ nữ mang thai, bệnh hô hấp/tim mạch',
                      'Tất cả mọi người',
                      'Nguy hiểm — toàn bộ dân số',
                      'Tình trạng khẩn cấp toàn dân',
                    ][i]}
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: '0.8rem', color: '#555' }}>
                    {[
                      'Không ảnh hưởng đến sức khỏe',
                      'Nhóm dễ bị ảnh hưởng có thể bị tác động nhẹ',
                      'Có hại cho nhóm dễ bị ảnh hưởng',
                      'Có hại cho tất cả mọi người',
                      'Khẩn cấp với nhóm dễ bị ảnh hưởng',
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
