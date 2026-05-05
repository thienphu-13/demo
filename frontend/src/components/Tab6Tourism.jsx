import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { AQI_LABELS, AQI_COLORS, aqiLevel } from '../constants.js';

// ── Dữ liệu điểm du lịch ─────────────────────────────────────────────────────
const TOURISM_DATA = {
  thanh_hoa: [
    { name: 'Bãi biển Sầm Sơn',    type: 'outdoor', cat: 'beach',    lat: 19.7318, lon: 105.9047, hours: '24/7',        desc: 'Bãi biển nổi tiếng dài 9km, tắm biển và thể thao nước' },
    { name: 'Thành Nhà Hồ',         type: 'mixed',   cat: 'heritage', lat: 20.0667, lon: 105.5833, hours: '7:00–17:00',  desc: 'Di sản UNESCO, tường đá granit thế kỷ 14' },
    { name: 'Suối cá Cẩm Lương',    type: 'outdoor', cat: 'nature',   lat: 20.2833, lon: 105.2500, hours: '6:00–18:00',  desc: 'Suối cá thần với hàng nghìn cá anh vũ quý hiếm' },
    { name: 'Khu du lịch Pù Luông', type: 'outdoor', cat: 'trekking', lat: 20.4167, lon: 105.1167, hours: '24/7',        desc: 'Ruộng bậc thang, bản làng dân tộc, trekking rừng' },
    { name: 'Động Từ Thức',         type: 'indoor',  cat: 'nature',   lat: 20.1167, lon: 105.4833, hours: '7:00–17:00',  desc: 'Hang động đẹp trong núi đá vôi' },
    { name: 'Đền Bà Triệu',         type: 'mixed',   cat: 'heritage', lat: 19.9833, lon: 105.6333, hours: '6:00–18:00',  desc: 'Di tích thờ Bà Triệu, lễ hội tháng 2 âm lịch' },
    { name: 'Biển Hải Tiến',        type: 'outdoor', cat: 'beach',    lat: 20.0500, lon: 105.8167, hours: '24/7',        desc: 'Bãi biển nguyên sơ, nước trong, ít đông khách' },
    { name: 'Chợ đêm Sầm Sơn',     type: 'indoor',  cat: 'food',     lat: 19.7350, lon: 105.9050, hours: '18:00–23:00', desc: 'Hải sản tươi sống, ẩm thực địa phương' },
  ],
  nghe_an: [
    { name: 'Bãi biển Cửa Lò',      type: 'outdoor', cat: 'beach',    lat: 18.8167, lon: 105.7167, hours: '24/7',        desc: 'Bãi biển lớn nhất Nghệ An, cát trắng nước trong' },
    { name: 'Khu di tích Kim Liên',  type: 'mixed',   cat: 'heritage', lat: 18.6833, lon: 105.3167, hours: '7:00–17:00',  desc: 'Quê Bác Hồ, nhà lưu niệm và làng Sen' },
    { name: 'Vườn QG Pù Mát',       type: 'outdoor', cat: 'trekking', lat: 18.9167, lon: 104.5000, hours: '6:00–17:00',  desc: 'Rừng nguyên sinh, đa dạng sinh học phong phú' },
    { name: 'Đảo Ngư',              type: 'outdoor', cat: 'beach',    lat: 18.7833, lon: 105.7667, hours: '24/7',        desc: 'Đảo nhỏ ngoài khơi Cửa Lò, nước biển trong xanh' },
    { name: 'Thác Khe Kèm',         type: 'outdoor', cat: 'nature',   lat: 19.0167, lon: 104.4167, hours: '6:00–17:00',  desc: 'Thác nước đẹp trong vườn quốc gia Pù Mát' },
    { name: 'Quảng trường HCM',     type: 'outdoor', cat: 'heritage', lat: 18.6667, lon: 105.6667, hours: '24/7',        desc: 'Quảng trường lớn, tượng đài, không gian công cộng' },
    { name: 'Chợ Vinh',             type: 'indoor',  cat: 'food',     lat: 18.6733, lon: 105.6922, hours: '6:00–20:00',  desc: 'Chợ trung tâm, ẩm thực đặc sản Nghệ An' },
    { name: 'Hồ Khe Gỗ',           type: 'outdoor', cat: 'nature',   lat: 18.5500, lon: 105.3000, hours: '6:00–18:00',  desc: 'Hồ nhân tạo yên tĩnh, phù hợp picnic và câu cá' },
  ],
  ha_tinh: [
    { name: 'Biển Thiên Cầm',       type: 'outdoor', cat: 'beach',    lat: 18.3500, lon: 106.0167, hours: '24/7',        desc: 'Bãi biển hoang sơ, nước trong, ít du khách' },
    { name: 'Ngã Ba Đồng Lộc',      type: 'mixed',   cat: 'heritage', lat: 18.3167, lon: 105.6333, hours: '7:00–17:00',  desc: 'Di tích 10 cô gái TNXP, khu tưởng niệm lịch sử' },
    { name: 'Chùa Hương Tích',      type: 'mixed',   cat: 'heritage', lat: 18.3833, lon: 105.7167, hours: '6:00–18:00',  desc: 'Chùa cổ trên núi Hồng Lĩnh, cáp treo hoặc leo bộ' },
    { name: 'Biển Xuân Thành',      type: 'outdoor', cat: 'beach',    lat: 18.5500, lon: 105.9833, hours: '24/7',        desc: 'Bãi biển yên tĩnh, phù hợp nghỉ dưỡng và câu cá' },
    { name: 'Khu lưu niệm Nguyễn Du',type:'mixed',   cat: 'heritage', lat: 18.3667, lon: 105.6000, hours: '7:30–17:00', desc: 'Cố hương đại thi hào Nguyễn Du, vườn cây xanh' },
    { name: 'Hồ Kẻ Gỗ',            type: 'outdoor', cat: 'nature',   lat: 18.2167, lon: 105.6500, hours: '6:00–18:00',  desc: 'Hồ thủy lợi lớn, cảnh quan thiên nhiên đẹp' },
    { name: 'Đền Cờn',             type: 'mixed',   cat: 'heritage', lat: 18.9000, lon: 105.7500, hours: '6:00–18:00',  desc: 'Đền cổ linh thiêng bên cửa biển Cửa Hội' },
    { name: 'Biển Thạch Hải',       type: 'outdoor', cat: 'beach',    lat: 18.4333, lon: 106.0333, hours: '24/7',        desc: 'Bãi biển hoang sơ dài, rừng phi lao ven biển' },
  ],
  hue: [
    { name: 'Đại Nội Huế',          type: 'mixed',   cat: 'heritage', lat: 16.4698, lon: 107.5796, hours: '8:00–17:30',  desc: 'Kinh thành triều Nguyễn, Di sản UNESCO' },
    { name: 'Lăng Tự Đức',         type: 'outdoor', cat: 'heritage', lat: 16.4333, lon: 107.5500, hours: '7:00–17:30',  desc: 'Lăng mộ đẹp nhất, hồ sen và rừng thông' },
    { name: 'Lăng Khải Định',       type: 'mixed',   cat: 'heritage', lat: 16.4167, lon: 107.5833, hours: '7:00–17:30',  desc: 'Lăng kết hợp kiến trúc Đông–Tây độc đáo' },
    { name: 'Chùa Thiên Mụ',        type: 'outdoor', cat: 'heritage', lat: 16.4540, lon: 107.5460, hours: '7:00–17:00',  desc: 'Ngôi chùa cổ nhất Huế bên bờ sông Hương' },
    { name: 'Biển Lăng Cô',         type: 'outdoor', cat: 'beach',    lat: 16.2167, lon: 108.0833, hours: '24/7',        desc: 'Vịnh biển đẹp, được National Geographic vinh danh' },
    { name: 'Vườn QG Bạch Mã',      type: 'outdoor', cat: 'trekking', lat: 16.1833, lon: 107.8500, hours: '6:00–17:00',  desc: 'Rừng nhiệt đới trên núi cao 1450m, thác nước' },
    { name: 'Chợ Đông Ba',          type: 'indoor',  cat: 'food',     lat: 16.4667, lon: 107.5833, hours: '6:00–20:00',  desc: 'Chợ truyền thống lớn nhất Huế, ẩm thực cung đình' },
    { name: 'Phá Tam Giang',        type: 'outdoor', cat: 'nature',   lat: 16.5333, lon: 107.5833, hours: '24/7',        desc: 'Đầm phá lớn nhất Đông Nam Á, hoàng hôn tuyệt đẹp' },
    { name: 'Nhà Vườn Thanh Toàn',  type: 'outdoor', cat: 'heritage', lat: 16.4333, lon: 107.6667, hours: '8:00–17:00',  desc: 'Nhà vườn truyền thống Huế, cầu ngói cổ thế kỷ 18' },
  ],
};

const PROVINCE_NAMES = { thanh_hoa: 'Thanh Hóa', nghe_an: 'Nghệ An', ha_tinh: 'Hà Tĩnh', hue: 'Huế' };

const CAT_ICONS  = { beach: '🏖️', trekking: '🌄', nature: '🌿', heritage: '🏛️', food: '🍜' };
const CAT_LABELS = { beach: 'Biển', trekking: 'Trekking', nature: 'Thiên nhiên', heritage: 'Di tích', food: 'Ẩm thực' };
const TYPE_ICONS  = { outdoor: '🌿', indoor: '🏛️', mixed: '🔀' };
const TYPE_LABELS = { outdoor: 'Ngoài trời', indoor: 'Trong nhà', mixed: 'Kết hợp' };

function getSuitability(aqiValue, type) {
  const lvl = aqiLevel(aqiValue);
  const matrix = {
    outdoor: ['great','ok','limit','no','no','no'],
    mixed:   ['great','ok','limit','indoor_only','no','no'],
    indoor:  ['ok','ok','ok','ok','limit','limit'],
  };
  return matrix[type]?.[lvl] ?? 'ok';
}

const SUIT_CONFIG = {
  great:       { label: 'Rất phù hợp',  color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '🟢' },
  ok:          { label: 'Phù hợp',      color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: '🔵' },
  limit:       { label: 'Hạn chế',      color: '#b45309', bg: '#fffbeb', border: '#fde68a', dot: '🟡' },
  indoor_only: { label: 'Chỉ trong nhà',color: '#9a3412', bg: '#fff7ed', border: '#fed7aa', dot: '🟠' },
  no:          { label: 'Không nên',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '🔴' },
};

function getRecommendationText(aqiValue, slug) {
  const lvl   = aqiLevel(aqiValue);
  const pname = PROVINCE_NAMES[slug] || '';
  const spots = TOURISM_DATA[slug] || [];
  const bestOutdoor = spots.filter(s => s.type === 'outdoor')[0]?.name || '';
  const bestIndoor  = spots.filter(s => s.type === 'indoor')[0]?.name || '';
  const texts = [
    `Hôm nay không khí ${pname} tuyệt vời! Tất cả điểm tham quan đều phù hợp. Đặc biệt lý tưởng cho ${bestOutdoor ? `${bestOutdoor} và ` : ''}các hoạt động ngoài trời.`,
    `Không khí chấp nhận được tại ${pname}. Các điểm outdoor vẫn phù hợp nhưng nên tránh vận động mạnh kéo dài. Nhóm trẻ em và người cao tuổi ưu tiên điểm có mái che.`,
    `Nên ưu tiên các điểm tham quan trong nhà hôm nay${bestIndoor ? ` như ${bestIndoor}` : ''}. Hạn chế trekking và hoạt động bãi biển kéo dài. Mang khẩu trang nếu ra ngoài.`,
    `Chất lượng không khí xấu tại ${pname}. Chỉ nên tham quan các điểm indoor. Không khuyến nghị: biển, trekking, công viên ngoài trời.`,
    `Không khuyến nghị du lịch ngoài trời tại ${pname} hôm nay. Nếu đã có lịch, ưu tiên ở trong khách sạn hoặc tham quan bảo tàng có điều hòa.`,
    `Tình trạng khẩn cấp môi trường. Hủy mọi kế hoạch du lịch ngoài trời. Ở trong phòng kín.`,
  ];
  return texts[Math.min(lvl, 5)];
}

// ── Google Maps link builder ─────────────────────────────────────────────────
function buildGoogleMapsLink(spot) {
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}&travelmode=driving`;
}
function buildGoogleMapsSearch(spot) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name)}`;
}

// ── Spot Card ─────────────────────────────────────────────────────────────────
function SpotCard({ spot, aqi }) {
  const suit = getSuitability(aqi, spot.type);
  const cfg  = SUIT_CONFIG[suit];
  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      border: `1px solid ${cfg.border}`,
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header */}
      <div style={{ background: cfg.bg, padding: '10px 14px', borderBottom: `1px solid ${cfg.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.3 }}>
            {CAT_ICONS[spot.cat]} {spot.name}
          </div>
          <span style={{
            background: cfg.color, color: '#fff',
            borderRadius: 20, padding: '2px 8px',
            fontSize: '0.62rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {cfg.dot} {cfg.label}
          </span>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '10px 14px', flex: 1 }}>
        <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>{spot.desc}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: '0.68rem', background: '#f1f5f9', borderRadius: 6, padding: '2px 7px', color: '#64748b' }}>
            {TYPE_ICONS[spot.type]} {TYPE_LABELS[spot.type]}
          </span>
          <span style={{ fontSize: '0.68rem', background: '#f1f5f9', borderRadius: 6, padding: '2px 7px', color: '#64748b' }}>
            🕐 {spot.hours}
          </span>
          <span style={{ fontSize: '0.68rem', background: '#f1f5f9', borderRadius: 6, padding: '2px 7px', color: '#64748b' }}>
            {CAT_LABELS[spot.cat]}
          </span>
        </div>
        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <a
            href={buildGoogleMapsLink(spot)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600,
              background: '#1565c0', color: '#fff', textDecoration: 'none',
              flex: 1, justifyContent: 'center',
            }}
          >
            🧭 Chỉ đường
          </a>
          <a
            href={buildGoogleMapsSearch(spot)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600,
              background: '#f1f5f9', color: '#475569', textDecoration: 'none',
              flex: 1, justifyContent: 'center',
            }}
          >
            📍 Xem Maps
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Tourism Map with layers ───────────────────────────────────────────────────
function TourismMap({ spots, aqi, slug }) {
  const [mapStyle, setMapStyle] = useState('open-street-map');
  const [showAQI,  setShowAQI]  = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);

  const lats    = spots.map(s => s.lat);
  const lons    = spots.map(s => s.lon);
  const colors  = spots.map(s => {
    const suit = getSuitability(aqi, s.type);
    return { great:'#15803d', ok:'#1d4ed8', limit:'#b45309', indoor_only:'#ea580c', no:'#dc2626' }[suit];
  });
  const customdata = spots.map(s => {
    const suit = getSuitability(aqi, s.type);
    const cfg  = SUIT_CONFIG[suit];
    return `<b>${s.name}</b><br>${CAT_ICONS[s.cat]} ${CAT_LABELS[s.cat]} · ${TYPE_ICONS[s.type]} ${TYPE_LABELS[s.type]}<br>${cfg.dot} ${cfg.label}<br>🕐 ${s.hours}<br><i>${s.desc}</i>`;
  });

  const centerLat = lats.length ? lats.reduce((a,b) => a+b,0) / lats.length : 18;
  const centerLon = lons.length ? lons.reduce((a,b) => a+b,0) / lons.length : 106;

  const traces = [
    {
      type: 'scattermapbox',
      lat: lats, lon: lons,
      mode: 'markers+text',
      marker: { size: 18, color: colors, opacity: 0.92 },
      text: spots.map(s => CAT_ICONS[s.cat]),
      textposition: 'middle center',
      textfont: { size: 10, color: '#fff', family: 'Inter, sans-serif' },
      customdata,
      hovertemplate: '%{customdata}<extra></extra>',
      name: 'Điểm du lịch',
    },
  ];

  // Province AQI layer overlay
  if (showAQI) {
    const provinces = [
      { slug: 'thanh_hoa', name: 'Thanh Hóa', lat: 19.808, lon: 105.776 },
      { slug: 'nghe_an',   name: 'Nghệ An',   lat: 18.679, lon: 105.682 },
      { slug: 'ha_tinh',   name: 'Hà Tĩnh',   lat: 18.343, lon: 105.906 },
      { slug: 'hue',       name: 'Huế',        lat: 16.462, lon: 107.595 },
    ];
    const mockAQI = { thanh_hoa: 147, nghe_an: 89, ha_tinh: 112, hue: 65 };
    const aqiVals = provinces.map(p => p.slug === slug ? aqi : mockAQI[p.slug]);
    traces.push({
      type: 'scattermapbox',
      lat: provinces.map(p => p.lat),
      lon: provinces.map(p => p.lon),
      mode: 'markers+text',
      marker: {
        size: provinces.map(p => p.slug === slug ? 40 : 30),
        color: aqiVals.map(v => AQI_COLORS[aqiLevel(v)]),
        opacity: 0.75,
      },
      text: aqiVals.map(v => `${Math.round(v)}`),
      textposition: 'middle center',
      textfont: { size: 11, color: '#222', family: 'Inter, sans-serif' },
      customdata: provinces.map((p, i) => `<b>${p.name}</b><br>AQI: ${Math.round(aqiVals[i])} · ${AQI_LABELS[aqiLevel(aqiVals[i])]}`),
      hovertemplate: '%{customdata}<extra></extra>',
      name: 'AQI',
    });
  }

  return (
    <div>
      {/* Map controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lớp:</span>
        <button
          onClick={() => setShowAQI(v => !v)}
          style={{
            padding: '4px 11px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
            border: `2px solid ${showAQI ? '#1565c0' : '#e0e7f0'}`,
            background: showAQI ? '#1565c0' : '#fff',
            color: showAQI ? '#fff' : '#64748b', cursor: 'pointer',
          }}
        >
          🎯 AQI {showAQI ? '✓' : ''}
        </button>
        <button style={{
          padding: '4px 11px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
          border: '2px solid #1565c0', background: '#1565c0', color: '#fff', cursor: 'default',
        }}>🗺️ Du lịch ✓</button>

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', alignSelf: 'center' }}>Nền:</span>
          {[
            { val: 'open-street-map', label: '🗺 OSM' },
            { val: 'carto-positron',  label: '⬜ Sáng' },
            { val: 'carto-darkmatter',label: '⬛ Tối'  },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setMapStyle(val)} style={{
              padding: '3px 9px', borderRadius: 6, fontSize: '0.7rem',
              border: `1px solid ${mapStyle===val ? '#1565c0' : '#e0e7f0'}`,
              background: mapStyle===val ? '#eff6ff' : '#fff',
              color: mapStyle===val ? '#1565c0' : '#64748b', cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(SUIT_CONFIG).map(([k, cfg]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
            <span style={{ color: '#64748b' }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e0e7f0' }}>
        <Plot
          data={traces}
          layout={{
            mapbox: {
              style: mapStyle,
              center: { lat: centerLat, lon: centerLon },
              zoom: slug === 'hue' ? 9 : 8.2,
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 0, r: 0, t: 0, b: 0 },
            height: 420,
            showlegend: false,
          }}
          config={{
            displayModeBar: true, responsive: true, scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d','select2d','lasso2d','toImage'],
          }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Tip */}
      <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>💡</span>
        <span>Hover vào điểm để xem chi tiết. Click <b>Chỉ đường</b> trong thẻ bên dưới để mở Google Maps.</span>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function Tab6Tourism({ data, slug }) {
  const [filterCat,  setFilterCat]  = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSuit, setFilterSuit] = useState('all');
  const [filterAQI,  setFilterAQI]  = useState(false); // chỉ hiện điểm phù hợp với AQI hiện tại

  const aqi   = data?.current?.aqi ?? 100;
  const spots = TOURISM_DATA[slug] || [];
  const pname = PROVINCE_NAMES[slug] || slug;
  const lvl   = aqiLevel(aqi);

  const filtered = useMemo(() => spots.filter(s => {
    const suit = getSuitability(aqi, s.type);
    if (filterAQI  && (suit === 'no' || suit === 'indoor_only')) return false;
    if (filterCat  !== 'all' && s.cat  !== filterCat)  return false;
    if (filterType !== 'all' && s.type !== filterType)  return false;
    if (filterSuit !== 'all' && suit   !== filterSuit)  return false;
    return true;
  }), [spots, filterCat, filterType, filterSuit, filterAQI, aqi]);

  // Stats
  const suitCounts = useMemo(() => {
    const counts = { great: 0, ok: 0, limit: 0, indoor_only: 0, no: 0 };
    spots.forEach(s => { const k = getSuitability(aqi, s.type); counts[k]++; });
    return counts;
  }, [spots, aqi]);

  const aqiBgColors = ['#1a7a2e','#6b6b00','#b85c00','#b82222','#6b1a91','#7a0a1a'];

  const btnStyle = (active) => ({
    padding: '5px 12px', borderRadius: 8, border: `1px solid ${active ? '#1565c0' : '#e0e7f0'}`,
    background: active ? '#1565c0' : '#fff', color: active ? '#fff' : '#64748b',
    fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{
        borderRadius: 14, padding: '18px 22px', color: '#fff',
        background: aqiBgColors[Math.min(lvl,5)] || '#1565c0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 6 }}>
          🗺️ Gợi ý Du lịch - {pname}
        </div>
        <div style={{ fontSize: '0.88rem', opacity: 0.95, lineHeight: 1.6, marginBottom: 10 }}>
          {getRecommendationText(aqi, slug)}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(suitCounts).filter(([,v]) => v > 0).map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
              {SUIT_CONFIG[k].label}: {v} điểm
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.95rem' }}>
          🗺️ Bản đồ điểm du lịch - Màu theo mức phù hợp AQI
        </div>
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: 10 }}>
          Scroll để zoom · Kéo để xoay bản đồ · Hover điểm để xem thông tin
        </div>
        <TourismMap spots={spots} aqi={aqi} slug={slug} />
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 12, fontSize: '0.92rem' }}>Bộ lọc thông minh</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* AQI filter */}
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>LỌC THEO AQI HIỆN TẠI</div>
            <button
              onClick={() => setFilterAQI(v => !v)}
              style={{
                padding: '5px 12px', borderRadius: 8,
                border: `1px solid ${filterAQI ? AQI_COLORS[lvl] : '#e0e7f0'}`,
                background: filterAQI ? `${AQI_COLORS[lvl]}22` : '#fff',
                color: filterAQI ? aqiBgColors[Math.min(lvl,5)] : '#64748b',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
              }}
            >
              {filterAQI ? '✓ ' : ''}Chỉ hiện điểm phù hợp với AQI {Math.round(aqi)}
            </button>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>LOẠI KHÔNG GIAN</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all','Tất cả'],['outdoor','Ngoài trời'],['indoor','Trong nhà'],['mixed','Kết hợp']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterType(v)} style={btnStyle(filterType===v)}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>LOẠI HÌNH</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all','Tất cả'],['beach','🏖️ Biển'],['trekking','🌄 Trekking'],['nature','🌿 Thiên nhiên'],['heritage','🏛️ Di tích'],['food','🍜 Ẩm thực']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterCat(v)} style={btnStyle(filterCat===v)}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>MỨC PHÙ HỢP</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all','Tất cả'],['great','🟢 Rất phù hợp'],['ok','🔵 Phù hợp'],['limit','🟡 Hạn chế'],['no','🔴 Không nên']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterSuit(v)} style={btnStyle(filterSuit===v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#94a3b8' }}>
          Hiển thị <b>{filtered.length}</b>/{spots.length} điểm
        </div>
      </div>

      {/* Spot Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map((spot, i) => (
          <SpotCard key={i} spot={spot} aqi={aqi} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: '0.88rem' }}>
            Không có điểm nào phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>

      {/* AQI x Type Reference Table */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.92rem' }}>
          Danh mục từ và ký hiệu viết tắt - Khuyến nghị theo Mức AQI × Loại địa điểm
        </div>
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: 12 }}>
          AQI = Air Quality Index (Chỉ số Chất lượng Không khí) · WHO = World Health Organization · QCVN = Quy chuẩn kỹ thuật Quốc gia Việt Nam
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Mức AQI</th>
                {['🌿 Ngoài trời','🔀 Kết hợp','🏛️ Trong nhà'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'center', color: '#475569', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['🟢 Tốt (0–50)',           'great','great','ok'],
                ['🔵 Trung bình (51–100)',   'ok','ok','ok'],
                ['🟡 Kém (101–150)',         'limit','limit','ok'],
                ['🟠 Xấu (151–200)',         'no','indoor_only','ok'],
                ['🔴 Rất xấu (201–300)',     'no','no','limit'],
                ['☠️ Nguy hại (>300)',       'no','no','limit'],
              ].map(([label, o, m, ind], idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 ? '#fafbfc' : '#fff' }}>
                  <td style={{ padding: '7px 12px', fontWeight: 600, color: '#334155' }}>{label}</td>
                  {[o, m, ind].map((suit, j) => {
                    const cfg = SUIT_CONFIG[suit];
                    return (
                      <td key={j} style={{ padding: '7px 12px', textAlign: 'center' }}>
                        <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
                          {cfg.dot} {cfg.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
