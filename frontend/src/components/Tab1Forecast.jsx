import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, AQI_RGBA, AQI_TEXT_COLORS, aqiLevel, aqiColor } from '../constants.js';

const L = { plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Inter, sans-serif', size: 12 } };

// ── Sticky AQI Legend (position:fixed top-right) ──────────────────────────────
function StickyAQILegend({ currentLevel }) {
  const [open, setOpen] = useState(true);
  const rows = [
    { label: 'Tốt',       range: '0 - 49',   desc: 'Không ảnh hưởng sức khỏe.' },
    { label: 'Trung bình',range: '50 - 99',  desc: 'Ảnh hưởng người rất nhạy cảm.' },
    { label: 'Kém',       range: '100 - 149',desc: 'Có hại cho nhóm dễ bị ảnh hưởng.' },
    { label: 'Xấu',       range: '150 - 199',desc: 'Ảnh hưởng sức khỏe toàn dân.' },
    { label: 'Rất xấu',   range: '200 - 299',desc: 'Khẩn cấp với nhóm dễ bị ảnh hưởng.' },
    { label: 'Nguy hại',  range: '300 - 499',desc: 'Tình trạng khẩn cấp môi trường.' },
  ];
  return (
    <div style={{
      position: 'fixed', top: 75, right: 14, zIndex: 999,
      background: 'rgba(255,255,255,0.97)',
      borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid #e0e7f0', overflow: 'hidden',
      width: open ? 340 : 'auto',
      transition: 'width 0.25s ease',
    }}>
      {/* Header - click để toggle */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: '0.65rem', fontWeight: 800, color: '#475569',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '7px 12px',
          borderBottom: open ? '1px solid #f1f5f9' : 'none',
          background: '#f8fafd',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Dot màu mức hiện tại */}
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: AQI_COLORS[currentLevel], display: 'inline-block' }} />
          Thang AQI
        </span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 10 }}>
          {open ? '▲ Thu gọn' : '▼ Mở rộng'}
        </span>
      </div>

      {/* Table - chỉ hiện khi open */}
      {open && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Mức', 'AQI', 'Ý nghĩa'].map(h => (
                <th key={h} style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isActive = i === currentLevel;
              return (
                <tr key={i} style={{
                  background: isActive ? `${AQI_COLORS[i]}18` : 'transparent',
                  borderLeft: isActive ? `3px solid ${AQI_COLORS[i]}` : '3px solid transparent',
                }}>
                  <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: AQI_COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontWeight: isActive ? 800 : 500, color: isActive ? AQI_COLORS[i] : '#334155' }}>{row.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px', color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.68rem' }}>{row.range}</td>
                  <td style={{ padding: '4px 10px', color: isActive ? '#334155' : '#64748b', fontWeight: isActive ? 600 : 400 }}>{row.desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── AQI Hero Card ─────────────────────────────────────────────────────────────
function AQIHero({ current, recommendation, province }) {
  const lvl   = current.level;
  const color = AQI_COLORS[lvl];
  const tc    = AQI_TEXT_COLORS[lvl];
  const bgGrad = [
    'linear-gradient(135deg,#00c853,#00e676)',
    'linear-gradient(135deg,#f9a825,#ffee58)',
    'linear-gradient(135deg,#ef6c00,#ffa726)',
    'linear-gradient(135deg,#c62828,#ef5350)',
    'linear-gradient(135deg,#6a1b9a,#ab47bc)',
    'linear-gradient(135deg,#880e4f,#c2185b)',
  ][lvl];
  return (
    <div style={{ background: bgGrad, borderRadius: 16, padding: '22px 26px', color: tc, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center', minWidth: 110 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>US AQI</div>
        <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, margin: '4px 0' }}>{current.aqi}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{current.label}</div>
      </div>
      <div style={{ width: 1, height: 70, background: `${tc}33`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 5 }}>{province}</div>
        <div style={{ fontSize: '0.88rem', opacity: 0.9, marginBottom: 8 }}>{recommendation?.desc}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {recommendation?.activities?.slice(0, 3).map((act, i) => (
            <span key={i} style={{ background: tc === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 20, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 600 }}>{act}</span>
          ))}
        </div>
      </div>
      <div style={{ background: tc === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px', minWidth: 170, fontSize: '0.8rem', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 3 }}>Khung giờ an toàn</div>
        <div style={{ opacity: 0.9 }}>{recommendation?.safe_hours}</div>
      </div>
    </div>
  );
}

// ── Pollutant Grid ────────────────────────────────────────────────────────────
function PollutantGrid({ pollutants }) {
  const keys = ['pm2_5','pm10','nitrogen_dioxide','ozone','sulphur_dioxide','carbon_monoxide'];
  return (
    <div>
      <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Chỉ số ô nhiễm - So sánh ngưỡng WHO & QCVN 05:2023
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {keys.map(key => {
          const d = pollutants[key]; if (!d) return null;
          const pct   = Math.min((d.value / d.who) * 100, 200);
          const color = d.value <= d.who ? '#2e7d32' : d.value <= d.vn ? '#f57c00' : '#c62828';
          const status= d.value <= d.who ? 'Dưới ngưỡng WHO' : d.value <= d.vn ? 'Trên ngưỡng WHO' : 'Vượt QCVN';
          return (
            <div key={key} style={{ background: '#f8fafd', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>{d.name}</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{d.value.toFixed(1)}<span style={{ fontSize: '0.6rem', color: '#94a3b8' }}> {d.unit}</span></span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: 3, height: 4, marginBottom: 4 }}>
                <div style={{ width: `${Math.min(pct,100)}%`, background: color, height: 4, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: '0.63rem', color, fontWeight: 600, marginBottom: 1 }}>{status}</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>WHO: {d.who} · QCVN: {d.vn} {d.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weather Row ───────────────────────────────────────────────────────────────
function WeatherRow({ weather }) {
  const items = [
    { label: 'Nhiệt độ',   key: 'temperature_2m',       unit: '°C',   icon: '🌡️' },
    { label: 'Độ ẩm',      key: 'relative_humidity_2m', unit: '%',    icon: '💧' },
    { label: 'Tốc độ gió', key: 'wind_speed_10m',       unit: 'km/h', icon: '💨' },
    { label: 'Mây che phủ',key: 'cloud_cover',          unit: '%',    icon: '☁️' },
    { label: 'Áp suất',    key: 'pressure_msl',         unit: 'hPa',  icon: '📊' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
      {items.map(({ label, key, unit, icon }) => (
        <div key={key} style={{ background: '#f0f9ff', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{icon}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0369a1' }}>
            {weather[key] != null ? weather[key].toFixed(1) : '-'}
            <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#64748b' }}> {unit}</span>
          </div>
          <div style={{ fontSize: '0.63rem', color: '#64748b', marginTop: 1 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Gauge Chart ───────────────────────────────────────────────────────────────
function GaugeChart({ aqi, label, color }) {
  return (
    <Plot
      data={[{
        type: 'indicator', mode: 'gauge+number', value: aqi,
        number: { font: { size: 52, color } },
        title: { text: `<b>${label}</b>`, font: { size: 14, color } },
        gauge: {
          axis: { range: [0, 300], tickwidth: 1, tickfont: { size: 9 }, nticks: 7 },
          bar: { color, thickness: 0.28 }, bgcolor: 'white', borderwidth: 0,
          steps: [
            { range: [0,50],   color: '#d4f8d4' }, { range: [50,100],  color: '#fdfac4' },
            { range: [100,150],color: '#fde3bc' }, { range: [150,200], color: '#fbbaba' },
            { range: [200,300],color: '#e8c7ee' },
          ],
          threshold: { line: { color: '#333', width: 3 }, thickness: 0.8, value: aqi },
        },
        domain: { x: [0,1], y: [0.08,1] },
      }]}
      layout={{ height: 220, margin: { l: 12, r: 12, t: 12, b: 4 }, paper_bgcolor: 'rgba(0,0,0,0)' }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

// ── Province Map - scattermapbox với OpenStreetMap thật ───────────────────────
function ProvinceMapWide({ activeSlug, forecastData }) {
  const aqi = forecastData?.current?.aqi ?? 0;
  const mockAQI = { thanh_hoa: 147, nghe_an: 89, ha_tinh: 112, hue: 65 };
  const provinces = [
    { slug: 'thanh_hoa', name: 'Thanh Hóa', lat: 19.808, lon: 105.776 },
    { slug: 'nghe_an',   name: 'Nghệ An',   lat: 18.679, lon: 105.682 },
    { slug: 'ha_tinh',   name: 'Hà Tĩnh',   lat: 18.343, lon: 105.906 },
    { slug: 'hue',       name: 'Huế',        lat: 16.462, lon: 107.595 },
  ];
  const aqiVals = provinces.map(p => p.slug === activeSlug ? aqi : mockAQI[p.slug]);
  const colors  = aqiVals.map(v => aqiColor(v));
  const sizes   = provinces.map(p => p.slug === activeSlug ? 38 : 28);
  const customdata = aqiVals.map((v, i) =>
    `<b>${provinces[i].name}</b><br>AQI: <b>${Math.round(v)}</b> - ${AQI_LABELS[aqiLevel(v)]}`
  );

  return (
    <Plot
      data={[{
        type: 'scattermapbox',
        lat: provinces.map(p => p.lat),
        lon: provinces.map(p => p.lon),
        mode: 'markers+text',
        marker: { size: sizes, color: colors, opacity: 0.9, allowoverlap: true },
        text: aqiVals.map(v => `${Math.round(v)}`),
        textposition: 'middle center',
        textfont: {
          size: provinces.map(p => p.slug === activeSlug ? 13 : 11),
          color: aqiVals.map(v => AQI_TEXT_COLORS[aqiLevel(v)]),
          family: 'Inter, sans-serif',
        },
        customdata,
        hovertemplate: '%{customdata}<extra></extra>',
      }]}
      layout={{
        mapbox: {
          style: 'open-street-map',
          center: { lat: 18.0, lon: 105.8 },
          zoom: 5.8,
          uirevision: 'true',
      },
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, t: 0, b: 0 },
        height: 360,
        showlegend: false,
      }}
      config={{ displayModeBar: true, responsive: true, scrollZoom: true,
        modeBarButtonsToRemove: ['pan2d','select2d','lasso2d','resetScale2d','toImage','autoScale2d'],
        modeBarButtonsToAdd: [],
        displaylogo: false,
      }}
      style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }}
    />
  );
}

// ── Forecast Line Chart ───────────────────────────────────────────────────────
function ForecastChart({ forecast }) {
  const xLabels = forecast.map(f => `${f.time_str}<br>${f.date_str}`);
  const vals    = forecast.map(f => f.aqi);
  const colors  = forecast.map(f => f.color);
  const labels  = forecast.map(f => f.label);
  const shapes  = AQI_BINS.slice(0,-1).map((lo,i) => ({
    type:'rect', xref:'paper', x0:0, x1:1,
    yref:'y', y0:lo, y1:AQI_BINS[i+1],
    fillcolor: AQI_RGBA[i]||'rgba(0,0,0,0)', line:{width:0}, layer:'below',
  }));
  const threshAnnotations = [[50,'Tốt','#009a00'],[100,'Trung bình','#b8a000'],[150,'Kém','#c05a00'],[200,'Xấu','#aa0000']].map(
    ([y,text,color]) => ({xref:'paper',x:1,yref:'y',y, text:`<b>${text}</b>`, showarrow:false, xanchor:'left', xshift:6, font:{color,size:9}, bgcolor:'rgba(255,255,255,0.85)', borderpad:2})
  );
  return (
    <Plot
      data={[{
        type:'scatter', mode:'lines+markers+text',
        x:xLabels, y:vals,
        line:{color:'#1565c0', width:2.5, shape:'spline'},
        marker:{color:colors, size:16, line:{color:'#fff', width:2}},
        text:vals.map(v=>`<b>${Math.round(v)}</b>`),
        textposition:'top center', textfont:{size:11, color:'#333'},
        customdata:labels,
        hovertemplate:'<b>%{x}</b><br>AQI: <b>%{y:.0f}</b><br>%{customdata}<extra></extra>',
      }]}
      layout={{
        ...L,
        xaxis:{tickfont:{size:10}, gridcolor:'rgba(0,0,0,0.04)'},
        yaxis:{title:'US AQI', range:[0, Math.max(...vals)*1.5], gridcolor:'rgba(0,0,0,0.06)'},
        shapes, annotations:threshAnnotations,
        showlegend:false, height:330,
        margin:{l:40, r:70, t:20, b:10},
      }}
      config={{displayModeBar:false, responsive:true}}
      style={{width:'100%'}}
    />
  );
}

// ── Safe/Unsafe Windows ───────────────────────────────────────────────────────
function SafeWindows({ forecast }) {
  const safe   = forecast.filter(f => f.level <= 1);
  const unsafe = forecast.filter(f => f.level >= 3);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 10, fontSize: '0.82rem' }}>Khung giờ an toàn</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {safe.length ? safe.map(f => (
            <div key={f.horizon} style={{
              background: '#dcfce7', color: '#15803d',
              borderRadius: 8, padding: '6px 12px',
              fontSize: '0.8rem', fontWeight: 600,
              textAlign: 'center', lineHeight: 1.4,
            }}>
              <div>{f.time_str}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.8 }}>{f.date_str}</div>
            </div>
          )) : <span style={{ color: '#666', fontSize: '0.8rem' }}>Không có trong 72h tới</span>}
        </div>
      </div>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 10, fontSize: '0.82rem' }}>Khung giờ cần hạn chế</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {unsafe.length ? unsafe.map(f => (
            <div key={f.horizon} style={{
              background: '#fee2e2', color: '#dc2626',
              borderRadius: 8, padding: '6px 12px',
              fontSize: '0.8rem', fontWeight: 600,
              textAlign: 'center', lineHeight: 1.4,
            }}>
              <div>{f.time_str}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.8 }}>{f.date_str}</div>
            </div>
          )) : <span style={{ color: '#666', fontSize: '0.8rem' }}>Không có trong 72h tới</span>}
        </div>
      </div>
    </div>
  );
}

// ── Health Advisory ───────────────────────────────────────────────────────────
function HealthAdvisory({ recommendation, forecast }) {
  if (!recommendation) return null;
  const HOUR_SLOTS = [
    {label:'Sáng sớm', range:'5-8h',   icon:'🌅'},
    {label:'Buổi sáng',range:'8-12h',  icon:'☀️'},
    {label:'Buổi trưa',range:'12-14h', icon:'🌞'},
    {label:'Buổi chiều',range:'14-18h',icon:'🌤️'},
    {label:'Chiều tối',range:'18-21h', icon:'🌆'},
    {label:'Ban đêm',  range:'21-5h',  icon:'🌙'},
  ];
  const slotLevels = [6,9,12,15,18,22].map(h => {
    const match = forecast?.find(f => Math.abs(new Date(f.datetime).getHours() - h) <= 2);
    return match?.level ?? 1;
  });
  const SLOT_BG = ['#f0fdf4','#fffde7','#fff7ed','#fef2f2','#f5f3ff','#f8fafc'];
  const SLOT_TC = ['#15803d','#a16207','#c2410c','#dc2626','#7c3aed','#475569'];
  const statusText = ['An toàn','Chấp nhận','Hạn chế','Tránh ra ngoài','Nguy hiểm','Khẩn cấp'];
  return (
    <div style={{background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
      <div style={{fontWeight:700, color:'#1e293b', marginBottom:3, fontSize:'0.92rem'}}>Khuyến nghị hoạt động theo khung giờ</div>
      <div style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:12}}>Dựa trên mức AQI dự báo và tiêu chuẩn WHO/QCVN 05:2023</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12}}>
        {HOUR_SLOTS.map((slot,i) => {
          const lvl = slotLevels[i];
          return (
            <div key={i} style={{background:SLOT_BG[Math.min(lvl,5)], borderRadius:8, padding:'8px 10px'}}>
              <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:3}}>
                <span style={{fontSize:'1rem'}}>{slot.icon}</span>
                <div>
                  <div style={{fontSize:'0.72rem', fontWeight:700, color:'#334155'}}>{slot.label}</div>
                  <div style={{fontSize:'0.6rem', color:'#94a3b8'}}>{slot.range}</div>
                </div>
              </div>
              <div style={{fontSize:'0.76rem', fontWeight:700, color:SLOT_TC[Math.min(lvl,5)]}}>{statusText[lvl]||'Chấp nhận'}</div>
            </div>
          );
        })}
      </div>
      {recommendation.sensitive?.length > 0 && (
        <div style={{background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'9px 12px'}}>
          <div style={{fontWeight:700, color:'#c2410c', fontSize:'0.78rem', marginBottom:5}}>Lưu ý - Nhóm dễ bị ảnh hưởng</div>
          {recommendation.sensitive.map((s,i) => (
            <div key={i} style={{fontSize:'0.76rem', color:'#7c3f00', marginBottom:2, display:'flex', gap:5}}>
              <span style={{flexShrink:0}}>•</span> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function Tab1Forecast({ data }) {
  if (!data) return null;
  const { current, forecast, pollutants, weather, recommendation, province, slug } = data;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:14}}>

      {/* Sticky AQI Legend */}
      <StickyAQILegend currentLevel={current.level} />

      {/* Hero */}
      <AQIHero current={current} recommendation={recommendation} province={province} />

      {/* 2-col: Gauge + Pollutants */}
      <div style={{display:'grid', gridTemplateColumns:'250px 1fr', gap:14, alignItems:'start'}}>
        <div style={{background:'#fff', borderRadius:14, padding:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
          <GaugeChart aqi={current.aqi} label={current.label} color={current.color} />
          <p style={{textAlign:'center', fontSize:'0.78rem', color:'#555', marginTop:4, lineHeight:1.5, padding:'0 6px'}}>{recommendation?.desc}</p>
        </div>
        <div style={{background:'#fff', borderRadius:14, padding:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:12}}>
          <PollutantGrid pollutants={pollutants} />
          <div style={{borderTop:'1px solid #f1f5f9', paddingTop:10}}>
            <div style={{fontWeight:700, color:'#475569', fontSize:'0.78rem', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em'}}>Điều kiện thời tiết</div>
            <WeatherRow weather={weather} />
          </div>
        </div>
      </div>

      {/* Map full-width */}
      <div style={{background:'#fff', borderRadius:14, padding:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
        <div style={{fontWeight:700, color:'#1e293b', marginBottom:8, fontSize:'0.9rem'}}>Bản đồ AQI - 4 tỉnh Miền Trung</div>
        <ProvinceMapWide activeSlug={slug||'thanh_hoa'} forecastData={data} />
      </div>

      {/* Forecast Chart */}
      <div style={{background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
        <div style={{fontWeight:700, color:'#1e293b', marginBottom:2}}>Dự báo AQI - 72 giờ tiếp theo</div>
        <div style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:10}}>Kết quả từ mô hình PCA + ML tốt nhất. Giai đoạn dữ liệu: 08/2022 - 03/2026.</div>
        <ForecastChart forecast={forecast} />
        <div style={{marginTop:10}}><SafeWindows forecast={forecast} /></div>
      </div>

      {/* Health Advisory */}
      <HealthAdvisory recommendation={recommendation} forecast={forecast} />

    </div>
  );
}
