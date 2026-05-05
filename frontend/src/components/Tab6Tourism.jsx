import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, aqiLevel } from '../constants.js';

// ── Dữ liệu điểm du lịch (tọa độ đã kiểm chứng) ─────────────────────────────
const TOURISM_DATA = {
  thanh_hoa: [
    { name: 'Bãi biển Sầm Sơn',     type: 'outdoor', cat: 'beach',    lat: 19.7426, lon: 105.9058, hours: '24/7',        desc: 'Bãi biển dài 9km, tắm biển và thể thao nước' },
    { name: 'Thành Nhà Hồ',          type: 'mixed',   cat: 'heritage', lat: 20.0781, lon: 105.6047, hours: '7:00–17:00',  desc: 'Di sản UNESCO 2011 - thành đá granit thế kỷ 14' },
    { name: 'Suối cá Cẩm Lương',     type: 'outdoor', cat: 'nature',   lat: 20.3103, lon: 105.2686, hours: '6:00–18:00',  desc: 'Suối cá thần với cá anh vũ quý hiếm, Quan Hóa' },
    { name: 'Khu du lịch Pù Luông',  type: 'outdoor', cat: 'trekking', lat: 20.5333, lon: 105.0667, hours: '24/7',        desc: 'Ruộng bậc thang, bản làng Thái, trekking rừng nguyên sinh' },
    { name: 'Biển Hải Tiến',         type: 'outdoor', cat: 'beach',    lat: 20.0628, lon: 105.8542, hours: '24/7',        desc: 'Bãi biển nguyên sơ Hoằng Hóa, nước trong' },
    { name: 'Động Từ Thức',          type: 'indoor',  cat: 'nature',   lat: 20.1167, lon: 105.4833, hours: '7:00–17:00',  desc: 'Hang động đẹp trong núi đá vôi Nga Sơn' },
    { name: 'Đền Bà Triệu',          type: 'mixed',   cat: 'heritage', lat: 19.9833, lon: 105.6333, hours: '6:00–18:00',  desc: 'Di tích thờ Bà Triệu, lễ hội tháng 2 âm lịch' },
    { name: 'Chợ đêm Sầm Sơn',      type: 'indoor',  cat: 'food',     lat: 19.7380, lon: 105.9065, hours: '18:00–23:00', desc: 'Hải sản tươi sống và ẩm thực địa phương' },
  ],
  nghe_an: [
    { name: 'Bãi biển Cửa Lò',      type: 'outdoor', cat: 'beach',    lat: 18.8147, lon: 105.7175, hours: '24/7',        desc: 'Bãi biển lớn nhất Nghệ An, cát trắng nước trong' },
    { name: 'Khu di tích Kim Liên',  type: 'mixed',   cat: 'heritage', lat: 18.6386, lon: 105.3519, hours: '7:00–17:00',  desc: 'Quê Bác Hồ tại Nam Đàn, nhà lưu niệm và làng Sen' },
    { name: 'Vườn QG Pù Mát',       type: 'outdoor', cat: 'trekking', lat: 19.0333, lon: 104.3333, hours: '6:00–17:00',  desc: 'Rừng nguyên sinh Con Cuông, đa dạng sinh học hàng đầu' },
    { name: 'Thác Khe Kèm',         type: 'outdoor', cat: 'nature',   lat: 18.9667, lon: 104.4167, hours: '6:00–17:00',  desc: 'Thác nước hùng vĩ cao 30m trong Vườn QG Pù Mát' },
    { name: 'Đảo Ngư',              type: 'outdoor', cat: 'beach',    lat: 18.7833, lon: 105.7667, hours: '24/7',        desc: 'Đảo nhỏ ngoài khơi Cửa Lò, nước trong xanh' },
    { name: 'Quảng trường HCM',     type: 'outdoor', cat: 'heritage', lat: 18.6667, lon: 105.6667, hours: '24/7',        desc: 'Quảng trường trung tâm thành phố Vinh' },
    { name: 'Chợ Vinh',             type: 'indoor',  cat: 'food',     lat: 18.6733, lon: 105.6922, hours: '6:00–20:00',  desc: 'Đặc sản cam Vinh, tương Nam Đàn, nhút Thanh Chương' },
    { name: 'Hồ Khe Gỗ',           type: 'outdoor', cat: 'nature',   lat: 18.5500, lon: 105.3000, hours: '6:00–18:00',  desc: 'Hồ nhân tạo yên tĩnh, picnic, câu cá, chèo thuyền' },
  ],
  ha_tinh: [
    { name: 'Biển Thiên Cầm',       type: 'outdoor', cat: 'beach',    lat: 18.2936, lon: 105.9619, hours: '24/7',        desc: 'Bãi biển Cẩm Xuyên hoang sơ, rừng phi lao' },
    { name: 'Ngã Ba Đồng Lộc',      type: 'mixed',   cat: 'heritage', lat: 18.3394, lon: 105.5928, hours: '7:00–17:00',  desc: 'Di tích 10 cô gái TNXP, khu tưởng niệm lịch sử' },
    { name: 'Chùa Hương Tích',      type: 'mixed',   cat: 'heritage', lat: 18.3583, lon: 105.7667, hours: '6:00–18:00',  desc: 'Chùa cổ núi Hồng Lĩnh, cáp treo hoặc leo bộ' },
    { name: 'Biển Xuân Thành',      type: 'outdoor', cat: 'beach',    lat: 18.5500, lon: 105.9833, hours: '24/7',        desc: 'Bãi biển Nghi Xuân yên tĩnh, nghỉ dưỡng và câu cá' },
    { name: 'Khu lưu niệm Nguyễn Du', type: 'mixed', cat: 'heritage', lat: 18.3667, lon: 105.6000, hours: '7:30–17:00',  desc: 'Cố hương đại thi hào Nguyễn Du tại Tiên Điền' },
    { name: 'Hồ Kẻ Gỗ',            type: 'outdoor', cat: 'nature',   lat: 18.2167, lon: 105.6500, hours: '6:00–18:00',  desc: 'Hồ thủy lợi lớn nhất Hà Tĩnh, cảnh quan đẹp' },
    { name: 'Biển Thạch Hải',       type: 'outdoor', cat: 'beach',    lat: 18.4333, lon: 106.0333, hours: '24/7',        desc: 'Bãi biển hoang sơ dài tại Thạch Hà' },
  ],
  hue: [
    { name: 'Đại Nội Huế',          type: 'mixed',   cat: 'heritage', lat: 16.4698, lon: 107.5796, hours: '8:00–17:30',  desc: 'Kinh thành triều Nguyễn 143 năm, Di sản UNESCO 1993' },
    { name: 'Lăng Tự Đức',         type: 'outdoor', cat: 'heritage', lat: 16.4469, lon: 107.5522, hours: '7:00–17:30',  desc: 'Lăng mộ đẹp nhất Huế, hồ sen và rừng thông' },
    { name: 'Lăng Khải Định',       type: 'mixed',   cat: 'heritage', lat: 16.3978, lon: 107.5961, hours: '7:00–17:30',  desc: 'Kiến trúc Đông–Tây, khảm sành sứ tinh xảo' },
    { name: 'Chùa Thiên Mụ',        type: 'outdoor', cat: 'heritage', lat: 16.4537, lon: 107.5432, hours: '7:00–17:00',  desc: 'Chùa cổ nhất Huế thế kỷ 17 bên bờ sông Hương' },
    { name: 'Biển Lăng Cô',         type: 'outdoor', cat: 'beach',    lat: 16.2167, lon: 107.9833, hours: '24/7',        desc: 'Vịnh biển đẹp National Geographic vinh danh' },
    { name: 'Vườn QG Bạch Mã',      type: 'outdoor', cat: 'trekking', lat: 16.1247, lon: 107.8583, hours: '6:00–17:00',  desc: 'Rừng nhiệt đới núi 1450m, thác Ngũ Hồ, mát mẻ' },
    { name: 'Chợ Đông Ba',          type: 'indoor',  cat: 'food',     lat: 16.4703, lon: 107.5778, hours: '6:00–20:00',  desc: 'Chợ lớn nhất Huế - bún bò, bánh bèo, cơm hến' },
    { name: 'Phá Tam Giang',        type: 'outdoor', cat: 'nature',   lat: 16.5500, lon: 107.5167, hours: '24/7',        desc: 'Đầm phá lớn nhất Đông Nam Á, hoàng hôn đẹp' },
    { name: 'Nhà Vườn Thanh Toàn',  type: 'outdoor', cat: 'heritage', lat: 16.4333, lon: 107.6667, hours: '8:00–17:00',  desc: 'Nhà vườn truyền thống Huế, cầu ngói cổ thế kỷ 18' },
  ],
};

const PNAME  = { thanh_hoa: 'Thanh Hóa', nghe_an: 'Nghệ An', ha_tinh: 'Hà Tĩnh', hue: 'Huế' };
const PROV_CENTER = { thanh_hoa: [19.808,105.776], nghe_an: [18.679,105.682], ha_tinh: [18.343,105.906], hue: [16.462,107.595] };

const CAT_LABEL = { beach: 'Biển', trekking: 'Trekking', nature: 'Thiên nhiên', heritage: 'Di tích', food: 'Ẩm thực' };
const TYPE_LABEL = { outdoor: 'Ngoài trời', indoor: 'Trong nhà', mixed: 'Kết hợp' };
const CAT_COLOR  = { beach: '#0ea5e9', trekking: '#16a34a', nature: '#22c55e', heritage: '#a855f7', food: '#f97316' };

const SUIT_CFG = {
  great:       { label: 'Rất phù hợp',   color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  ok:          { label: 'Phù hợp',       color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  limit:       { label: 'Hạn chế',       color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  indoor_only: { label: 'Chỉ trong nhà', color: '#9a3412', bg: '#fff7ed', border: '#fed7aa' },
  no:          { label: 'Không nên',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const SUIT_MATRIX = {
  outdoor: ['great','ok','limit','no','no','no'],
  mixed:   ['great','ok','limit','indoor_only','no','no'],
  indoor:  ['ok','ok','ok','ok','limit','limit'],
};

function getSuit(aqi, type) {
  return (SUIT_MATRIX[type] || [])[aqiLevel(aqi)] || 'ok';
}

// ── AQI Slider + dynamic recommendation panel ─────────────────────────────────
const AQI_TABLE_ROWS = [
  { range: '0 – 49',   outdoor: 'great',       mixed: 'great',       indoor: 'ok'    },
  { range: '50 – 99',  outdoor: 'ok',           mixed: 'ok',          indoor: 'ok'    },
  { range: '100 – 149',outdoor: 'limit',        mixed: 'limit',       indoor: 'ok'    },
  { range: '150 – 199',outdoor: 'no',           mixed: 'indoor_only', indoor: 'ok'    },
  { range: '200 – 299',outdoor: 'no',           mixed: 'no',          indoor: 'limit' },
  { range: '300 – 499',outdoor: 'no',           mixed: 'no',          indoor: 'limit' },
];

function AQISliderPanel({ sliderAqi, setSliderAqi }) {
  const lvl = aqiLevel(sliderAqi);
  const aqiColor = AQI_COLORS[lvl];
  const aqiLabel = AQI_LABELS[lvl];
  const row = AQI_TABLE_ROWS[lvl];

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0e7f0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: aqiColor, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
            Khuyến nghị theo mức AQI
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Kéo để xem mức khác</span>
      </div>

      {/* Slider */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <input
            type="range" min="0" max="300" step="1"
            value={sliderAqi}
            onChange={e => setSliderAqi(Number(e.target.value))}
            style={{ flex: 1, accentColor: aqiColor }}
          />
          <div style={{
            minWidth: 100, padding: '4px 12px', borderRadius: 8, textAlign: 'center',
            background: aqiColor, fontWeight: 800, fontSize: '0.95rem',
            color: lvl <= 1 ? '#333' : '#fff',
          }}>
            {sliderAqi} - {aqiLabel}
          </div>
        </div>

        {/* AQI scale ticks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
          {AQI_LABELS.slice(0, 5).map((lbl, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: AQI_COLORS[i], border: lvl === i ? '2px solid #333' : '1px solid rgba(0,0,0,.1)' }} />
              <span style={{ fontSize: '0.6rem', color: lvl === i ? '#1e293b' : '#94a3b8', fontWeight: lvl === i ? 700 : 400 }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic recommendation row for selected AQI */}
      <div style={{ padding: '12px 16px', background: `${aqiColor}0d` }}>
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Ở mức AQI {sliderAqi} ({aqiLabel}), khuyến nghị:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { key: 'outdoor', label: 'Ngoài trời',  suit: row.outdoor },
            { key: 'mixed',   label: 'Kết hợp',     suit: row.mixed   },
            { key: 'indoor',  label: 'Trong nhà',   suit: row.indoor  },
          ].map(({ key, label, suit }) => {
            const c = SUIT_CFG[suit];
            return (
              <div key={key} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: c.color }}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full table - collapsed to rows, current level highlighted */}
      <div style={{ borderTop: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
          <thead>
            <tr style={{ background: '#f8fafd' }}>
              <th style={{ padding: '7px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.7rem' }}>Mức AQI</th>
              <th style={{ padding: '7px 12px', textAlign: 'center', color: '#64748b', fontWeight: 700, fontSize: '0.7rem' }}>Ngoài trời</th>
              <th style={{ padding: '7px 12px', textAlign: 'center', color: '#64748b', fontWeight: 700, fontSize: '0.7rem' }}>Kết hợp</th>
              <th style={{ padding: '7px 12px', textAlign: 'center', color: '#64748b', fontWeight: 700, fontSize: '0.7rem' }}>Trong nhà</th>
            </tr>
          </thead>
          <tbody>
            {AQI_TABLE_ROWS.map((r, i) => {
              const isActive = i === lvl;
              return (
                <tr
                  key={i}
                  onClick={() => setSliderAqi(AQI_BINS[i] + 1)}
                  style={{
                    background: isActive ? `${AQI_COLORS[i]}18` : i % 2 ? '#fafbfc' : '#fff',
                    borderLeft: isActive ? `3px solid ${AQI_COLORS[i]}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                >
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: AQI_COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#1e293b' : '#475569', fontSize: '0.72rem' }}>
                        {AQI_LABELS[i]} ({r.range})
                      </span>
                    </div>
                  </td>
                  {[r.outdoor, r.mixed, r.indoor].map((s, j) => {
                    const c = SUIT_CFG[s];
                    return (
                      <td key={j} style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 5, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {c.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '6px 12px', fontSize: '0.64rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
          AQI = Air Quality Index · WHO = World Health Organization · QCVN = Quy chuẩn kỹ thuật Quốc gia Việt Nam
        </div>
      </div>
    </div>
  );
}

// ── Leaflet map ───────────────────────────────────────────────────────────────
function TourMap({ spots, filterAqi, slug }) {
  const divRef   = useRef(null);
  const stRef    = useRef({ map: null, markers: [], route: null, tile: null, userMk: null });
  const [selected, setSelected] = useState(null);
  const [routing,  setRouting]  = useState(false);
  const [routeInfo,setRouteInfo]= useState(null);
  const [userPos,  setUserPos]  = useState(null);
  const [basemap,  setBasemap]  = useState('osm');
  const [ready,    setReady]    = useState(false);

  const BASES = {
    osm:  { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap',  label: 'Bản đồ' },
    topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',   attr: '© OpenTopoMap',    label: 'Địa hình' },
    sat:  { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri', label: 'Vệ tinh' },
  };

  useEffect(() => {
    if (!divRef.current) return;
    if (!document.getElementById('lf-css')) {
      const l = document.createElement('link');
      l.id = 'lf-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    if (window.L) { initMap(); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = initMap;
    document.head.appendChild(s);
    return () => { if (stRef.current.map) { stRef.current.map.remove(); stRef.current.map = null; } };
  }, []);

  function initMap() {
    if (stRef.current.map || !divRef.current) return;
    const L = window.L;
    const center = PROV_CENTER[slug] || [17.5, 106.5];
    const map = L.map(divRef.current, { center, zoom: slug === 'hue' ? 10 : 9, zoomControl: false });
    L.control.zoom({ position: 'topright' }).addTo(map);
    stRef.current.map = map;
    stRef.current.tile = L.tileLayer(BASES.osm.url, { attribution: BASES.osm.attr }).addTo(map);
    setReady(true);
  }

  // Redraw markers when spots or filterAqi changes
  useEffect(() => {
    if (!ready || !stRef.current.map) return;
    const L = window.L; const st = stRef.current;
    st.markers.forEach(m => m.remove()); st.markers = [];
    spots.forEach(spot => {
      const suit = getSuit(filterAqi, spot.type);
      const c    = SUIT_CFG[suit];
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:30px;height:30px;border-radius:50%;background:${CAT_COLOR[spot.cat]||'#64748b'};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;font-size:13px;outline:3px solid ${c.color};">${{ beach:'⬡', trekking:'▲', nature:'◉', heritage:'■', food:'●' }[spot.cat]||'●'}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15],
      });
      st.markers.push(L.marker([spot.lat, spot.lon], { icon }).addTo(st.map).on('click', () => setSelected(spot)));
    });
  }, [spots, filterAqi, ready]);

  useEffect(() => {
    if (!ready || !stRef.current.map) return;
    const L = window.L; const st = stRef.current;
    if (st.tile) st.tile.remove();
    st.tile = L.tileLayer(BASES[basemap].url, { attribution: BASES[basemap].attr }).addTo(st.map);
  }, [basemap, ready]);

  async function doRoute(dest) {
    const st = stRef.current; if (!st.map) return;
    if (st.route) { st.route.remove(); st.route = null; }
    setRouteInfo(null); setRouting(true);
    const from = userPos || PROV_CENTER[slug] || [17.5, 106.5];
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${dest.lon},${dest.lat}?overview=full&geometries=geojson`;
      const d = await (await fetch(url)).json();
      if (d.code === 'Ok' && d.routes[0]) {
        const r = d.routes[0]; const L = window.L;
        const pts = r.geometry.coordinates.map(c => [c[1], c[0]]);
        st.route = L.polyline(pts, { color: '#1565c0', weight: 5, opacity: 0.82 }).addTo(st.map);
        st.map.fitBounds(L.latLngBounds([[from[0], from[1]], [dest.lat, dest.lon]]).pad(0.15));
        setRouteInfo({ km: (r.distance / 1000).toFixed(1), min: Math.round(r.duration / 60), name: dest.name, fromGPS: !!userPos });
      }
    } catch (e) { console.error(e); }
    setRouting(false);
  }

  function locateMe() {
    navigator.geolocation.getCurrentPosition(pos => {
      const [lat, lon] = [pos.coords.latitude, pos.coords.longitude];
      setUserPos([lat, lon]);
      const L = window.L; const st = stRef.current;
      if (st.userMk) st.userMk.remove();
      const icon = L.divIcon({ className: '', html: `<div style="width:12px;height:12px;border-radius:50%;background:#1565c0;border:2px solid #fff;box-shadow:0 0 0 5px rgba(21,101,192,.22)"></div>`, iconSize: [12,12], iconAnchor: [6,6] });
      st.userMk = L.marker([lat, lon], { icon }).addTo(st.map).bindPopup('Vị trí của bạn').openPopup();
      st.map.setView([lat, lon], 11);
    }, () => alert('Không lấy được vị trí.'));
  }

  const selSuit = selected ? SUIT_CFG[getSuit(filterAqi, selected.type)] : null;

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>NỀN:</span>
        {Object.entries(BASES).map(([k, b]) => (
          <button key={k} onClick={() => setBasemap(k)} style={{
            padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
            border: `1.5px solid ${basemap === k ? '#1565c0' : '#e0e7f0'}`,
            background: basemap === k ? '#eff6ff' : '#fff',
            color: basemap === k ? '#1565c0' : '#64748b', fontWeight: basemap === k ? 700 : 400,
          }}>{b.label}</button>
        ))}
        <button onClick={locateMe} style={{
          marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
          border: `1.5px solid ${userPos ? '#15803d' : '#e0e7f0'}`,
          background: userPos ? '#f0fdf4' : '#fff',
          color: userPos ? '#15803d' : '#64748b', fontWeight: 600,
        }}>{userPos ? 'Đã định vị' : 'Vị trí của tôi'}</button>
        {routeInfo && (
          <button onClick={() => { const st = stRef.current; if (st.route) { st.route.remove(); st.route = null; } setRouteInfo(null); }} style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer', border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
            Xóa đường
          </button>
        )}
      </div>

      {/* Route info */}
      {routeInfo && (
        <div style={{ marginBottom: 8, padding: '7px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.8rem', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#1565c0', fontWeight: 700 }}>{routeInfo.km} km</span>
          <span style={{ color: '#64748b' }}>· {routeInfo.min} phút lái xe đến {routeInfo.name}</span>
          {!routeInfo.fromGPS && <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>(từ trung tâm tỉnh)</span>}
        </div>
      )}

      {/* Map */}
      <div ref={divRef} style={{ width: '100%', height: 400, borderRadius: 10, border: '1px solid #e0e7f0' }} />

      {/* Popup */}
      {selected && selSuit && (
        <div style={{ marginTop: 8, background: '#fff', borderRadius: 10, border: `1.5px solid ${selSuit.border}`, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <b style={{ fontSize: '0.88rem', color: '#1e293b' }}>{selected.name}</b>
            <span style={{ background: selSuit.color, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.62rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{selSuit.label}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px', lineHeight: 1.4 }}>{selected.desc}</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', background: '#f1f5f9', borderRadius: 5, padding: '1px 6px', color: '#64748b' }}>{selected.hours}</span>
            <span style={{ fontSize: '0.65rem', background: '#f1f5f9', borderRadius: 5, padding: '1px 6px', color: '#64748b' }}>{TYPE_LABEL[selected.type]}</span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{selected.lat.toFixed(4)}, {selected.lon.toFixed(4)}</span>
            <button onClick={() => doRoute(selected)} disabled={routing} style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 7, fontSize: '0.76rem', fontWeight: 700, cursor: routing ? 'wait' : 'pointer', border: 'none', background: routing ? '#94a3b8' : '#1565c0', color: '#fff' }}>
              {routing ? 'Đang tính...' : 'Chỉ đường'}
            </button>
            <button onClick={() => setSelected(null)} style={{ padding: '5px 8px', borderRadius: 7, fontSize: '0.76rem', cursor: 'pointer', border: '1px solid #e0e7f0', background: '#f8fafd', color: '#64748b' }}>✕</button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, fontSize: '0.65rem', color: '#94a3b8' }}>
        {Object.entries(CAT_COLOR).map(([k, c]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
            {CAT_LABEL[k]}
          </span>
        ))}
        <span style={{ marginLeft: 4 }}>· viền màu = mức phù hợp AQI</span>
      </div>
      <p style={{ fontSize: '0.65rem', color: '#b0b8c8', marginTop: 3 }}>Click điểm trên bản đồ để xem chi tiết và chỉ đường (không mở tab mới)</p>
    </div>
  );
}

// ── Spot Card ─────────────────────────────────────────────────────────────────
function SpotCard({ spot, filterAqi }) {
  const s = getSuit(filterAqi, spot.type); const c = SUIT_CFG[s];
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
      <div style={{ background: c.bg, padding: '7px 12px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{spot.name}</span>
        <span style={{ background: c.color, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '0.6rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.label}</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.4, margin: '0 0 6px' }}>{spot.desc}</p>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: '0.62rem', background: '#f1f5f9', borderRadius: 5, padding: '1px 6px', color: '#64748b' }}>{spot.hours}</span>
          <span style={{ fontSize: '0.62rem', background: '#f1f5f9', borderRadius: 5, padding: '1px 6px', color: '#64748b' }}>{TYPE_LABEL[spot.type]}</span>
          <span style={{ fontSize: '0.62rem', background: '#f1f5f9', borderRadius: 5, padding: '1px 6px', color: '#64748b' }}>{CAT_LABEL[spot.cat]}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Tab6Tourism({ data, slug }) {
  const realAqi   = data?.current?.aqi ?? 100;
  const [sliderAqi, setSliderAqi] = useState(Math.round(realAqi));
  const [fCat,  setFCat]  = useState('all');
  const [fType, setFType] = useState('all');

  // Sync slider to real AQI when province changes
  useEffect(() => { setSliderAqi(Math.round(realAqi)); }, [slug, realAqi]);

  const spots = TOURISM_DATA[slug] || [];
  const pname = PNAME[slug] || slug;
  const lvl   = aqiLevel(sliderAqi);

  const filtered = useMemo(() => spots.filter(s => {
    const suit = getSuit(sliderAqi, s.type);
    if (suit === 'no' || suit === 'indoor_only') return false; // chỉ hiện phù hợp với AQI slider
    if (fCat  !== 'all' && s.cat  !== fCat)  return false;
    if (fType !== 'all' && s.type !== fType) return false;
    return true;
  }), [spots, sliderAqi, fCat, fType]);

  const allFiltered = useMemo(() => spots.filter(s => {
    if (fCat  !== 'all' && s.cat  !== fCat)  return false;
    if (fType !== 'all' && s.type !== fType) return false;
    return true;
  }), [spots, fCat, fType]);

  const headerBg = ['#1a7a2e','#6b6b00','#b85c00','#b82222','#6b1a91','#7a0a1a'][Math.min(lvl, 5)];
  const btn = (on) => ({
    padding: '4px 10px', borderRadius: 7, fontSize: '0.74rem', cursor: 'pointer',
    border: `1px solid ${on ? '#1565c0' : '#e0e7f0'}`,
    background: on ? '#1565c0' : '#fff',
    color: on ? '#fff' : '#64748b', fontWeight: on ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ borderRadius: 12, padding: '12px 16px', color: '#fff', background: headerBg }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 4 }}>
          Gợi ý Du lịch - {pname}
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.88 }}>
          AQI hiện tại: <b>{Math.round(realAqi)}</b> ({AQI_LABELS[aqiLevel(realAqi)]})
          {Math.round(realAqi) !== sliderAqi && (
            <span style={{ marginLeft: 10, opacity: 0.75 }}>· Đang xem: AQI {sliderAqi}</span>
          )}
        </div>
      </div>

      {/* AQI Slider + Recommendation table */}
      <AQISliderPanel sliderAqi={sliderAqi} setSliderAqi={setSliderAqi} />

      {/* Map */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: '0.9rem' }}>
          Bản đồ điểm du lịch
          <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
            - màu viền theo mức phù hợp với AQI {sliderAqi}
          </span>
        </div>
        <TourMap spots={allFiltered} filterAqi={sliderAqi} slug={slug} />
      </div>

      {/* Bộ lọc loại hình (tách riêng khỏi AQI slider) */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.86rem' }}>Lọc danh sách</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.63rem', color: '#94a3b8', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>Không gian</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['all','Tất cả'],['outdoor','Ngoài trời'],['indoor','Trong nhà'],['mixed','Kết hợp']].map(([v,l]) => (
                <button key={v} onClick={() => setFType(v)} style={btn(fType===v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.63rem', color: '#94a3b8', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>Loại hình</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[['all','Tất cả'],['beach','Biển'],['trekking','Trekking'],['nature','Thiên nhiên'],['heritage','Di tích'],['food','Ẩm thực']].map(([v,l]) => (
                <button key={v} onClick={() => setFCat(v)} style={btn(fCat===v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cards - chỉ hiện điểm phù hợp với AQI slider */}
      <div>
        <div style={{ marginBottom: 8, fontSize: '0.78rem', color: '#64748b' }}>
          Ở mức AQI <b style={{ color: '#1e293b' }}>{sliderAqi}</b>, có <b style={{ color: '#1e293b' }}>{filtered.length}</b>/{spots.length} điểm phù hợp
          {filtered.length < allFiltered.length && (
            <span style={{ color: '#94a3b8' }}> (ẩn {allFiltered.length - filtered.length} điểm không nên đến)</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 10 }}>
          {filtered.map((s, i) => <SpotCard key={i} spot={s} filterAqi={sliderAqi} />)}
          {!filtered.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 28, color: '#94a3b8', fontSize: '0.84rem' }}>
              Không có điểm nào phù hợp để tham quan với mức AQI này.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
