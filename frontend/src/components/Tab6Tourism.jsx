import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AQI_BINS, AQI_LABELS, AQI_COLORS, aqiLevel } from '../constants.js';

const TOURISM_DATA = {
  thanh_hoa: [
    { name: 'Bãi biển Sầm Sơn',    type: 'outdoor', cat: 'beach',    lat: 19.7426, lon: 105.9058, hours: '24/7',        desc: 'Bãi biển dài 9km, tắm biển và thể thao nước' },
    { name: 'Thành Nhà Hồ',         type: 'mixed',   cat: 'heritage', lat: 20.0781, lon: 105.6047, hours: '7:00–17:00',  desc: 'Di sản UNESCO 2011 - thành đá granit thế kỷ 14' },
    { name: 'Suối cá Cẩm Lương',    type: 'outdoor', cat: 'nature',   lat: 20.3103, lon: 105.2686, hours: '6:00–18:00',  desc: 'Suối cá thần với cá anh vũ quý hiếm, Quan Hóa' },
    { name: 'Khu du lịch Pù Luông', type: 'outdoor', cat: 'trekking', lat: 20.5333, lon: 105.0667, hours: '24/7',        desc: 'Ruộng bậc thang, bản làng Thái, trekking rừng nguyên sinh' },
    { name: 'Biển Hải Tiến',        type: 'outdoor', cat: 'beach',    lat: 20.0628, lon: 105.8542, hours: '24/7',        desc: 'Bãi biển nguyên sơ Hoằng Hóa, nước trong' },
    { name: 'Động Từ Thức',         type: 'indoor',  cat: 'nature',   lat: 20.1167, lon: 105.4833, hours: '7:00–17:00',  desc: 'Hang động đẹp trong núi đá vôi Nga Sơn' },
    { name: 'Đền Bà Triệu',         type: 'mixed',   cat: 'heritage', lat: 19.9833, lon: 105.6333, hours: '6:00–18:00',  desc: 'Di tích thờ Bà Triệu, lễ hội tháng 2 âm lịch' },
    { name: 'Chợ đêm Sầm Sơn',     type: 'indoor',  cat: 'food',     lat: 19.7380, lon: 105.9065, hours: '18:00–23:00', desc: 'Hải sản tươi sống và ẩm thực địa phương' },
  ],
  nghe_an: [
    { name: 'Bãi biển Cửa Lò',     type: 'outdoor', cat: 'beach',    lat: 18.8147, lon: 105.7175, hours: '24/7',        desc: 'Bãi biển lớn nhất Nghệ An, cát trắng nước trong' },
    { name: 'Khu di tích Kim Liên', type: 'mixed',   cat: 'heritage', lat: 18.6386, lon: 105.3519, hours: '7:00–17:00',  desc: 'Quê Bác Hồ tại Nam Đàn, nhà lưu niệm và làng Sen' },
    { name: 'Vườn QG Pù Mát',      type: 'outdoor', cat: 'trekking', lat: 19.0333, lon: 104.3333, hours: '6:00–17:00',  desc: 'Rừng nguyên sinh Con Cuông, đa dạng sinh học hàng đầu' },
    { name: 'Thác Khe Kèm',        type: 'outdoor', cat: 'nature',   lat: 18.9667, lon: 104.4167, hours: '6:00–17:00',  desc: 'Thác nước hùng vĩ cao 30m trong Vườn QG Pù Mát' },
    { name: 'Đảo Ngư',             type: 'outdoor', cat: 'beach',    lat: 18.7833, lon: 105.7667, hours: '24/7',        desc: 'Đảo nhỏ ngoài khơi Cửa Lò, nước trong xanh' },
    { name: 'Quảng trường HCM',    type: 'outdoor', cat: 'heritage', lat: 18.6667, lon: 105.6667, hours: '24/7',        desc: 'Quảng trường trung tâm thành phố Vinh' },
    { name: 'Chợ Vinh',            type: 'indoor',  cat: 'food',     lat: 18.6733, lon: 105.6922, hours: '6:00–20:00',  desc: 'Đặc sản cam Vinh, tương Nam Đàn, nhút Thanh Chương' },
    { name: 'Hồ Khe Gỗ',          type: 'outdoor', cat: 'nature',   lat: 18.5500, lon: 105.3000, hours: '6:00–18:00',  desc: 'Hồ nhân tạo yên tĩnh, picnic, câu cá, chèo thuyền' },
  ],
  ha_tinh: [
    { name: 'Biển Thiên Cầm',        type: 'outdoor', cat: 'beach',    lat: 18.2936, lon: 105.9619, hours: '24/7',        desc: 'Bãi biển Cẩm Xuyên hoang sơ, rừng phi lao' },
    { name: 'Ngã Ba Đồng Lộc',       type: 'mixed',   cat: 'heritage', lat: 18.3394, lon: 105.5928, hours: '7:00–17:00',  desc: 'Di tích 10 cô gái TNXP, khu tưởng niệm lịch sử' },
    { name: 'Chùa Hương Tích',       type: 'mixed',   cat: 'heritage', lat: 18.3583, lon: 105.7667, hours: '6:00–18:00',  desc: 'Chùa cổ núi Hồng Lĩnh, cáp treo hoặc leo bộ' },
    { name: 'Biển Xuân Thành',       type: 'outdoor', cat: 'beach',    lat: 18.5500, lon: 105.9833, hours: '24/7',        desc: 'Bãi biển Nghi Xuân yên tĩnh, nghỉ dưỡng và câu cá' },
    { name: 'Khu lưu niệm Nguyễn Du',type: 'mixed',   cat: 'heritage', lat: 18.3667, lon: 105.6000, hours: '7:30–17:00',  desc: 'Cố hương đại thi hào Nguyễn Du tại Tiên Điền' },
    { name: 'Hồ Kẻ Gỗ',             type: 'outdoor', cat: 'nature',   lat: 18.2167, lon: 105.6500, hours: '6:00–18:00',  desc: 'Hồ thủy lợi lớn nhất Hà Tĩnh, cảnh quan đẹp' },
    { name: 'Biển Thạch Hải',        type: 'outdoor', cat: 'beach',    lat: 18.4333, lon: 106.0333, hours: '24/7',        desc: 'Bãi biển hoang sơ dài tại Thạch Hà' },
  ],
  hue: [
    { name: 'Đại Nội Huế',         type: 'mixed',   cat: 'heritage', lat: 16.4698, lon: 107.5796, hours: '8:00–17:30',  desc: 'Kinh thành triều Nguyễn 143 năm, Di sản UNESCO 1993' },
    { name: 'Lăng Tự Đức',        type: 'outdoor', cat: 'heritage', lat: 16.4469, lon: 107.5522, hours: '7:00–17:30',  desc: 'Lăng mộ đẹp nhất Huế, hồ sen và rừng thông' },
    { name: 'Lăng Khải Định',      type: 'mixed',   cat: 'heritage', lat: 16.3978, lon: 107.5961, hours: '7:00–17:30',  desc: 'Kiến trúc Đông–Tây, khảm sành sứ tinh xảo' },
    { name: 'Chùa Thiên Mụ',       type: 'outdoor', cat: 'heritage', lat: 16.4537, lon: 107.5432, hours: '7:00–17:00',  desc: 'Chùa cổ nhất Huế thế kỷ 17 bên bờ sông Hương' },
    { name: 'Biển Lăng Cô',        type: 'outdoor', cat: 'beach',    lat: 16.2167, lon: 107.9833, hours: '24/7',        desc: 'Vịnh biển đẹp National Geographic vinh danh' },
    { name: 'Vườn QG Bạch Mã',     type: 'outdoor', cat: 'trekking', lat: 16.1247, lon: 107.8583, hours: '6:00–17:00',  desc: 'Rừng nhiệt đới núi 1450m, thác Ngũ Hồ, mát mẻ' },
    { name: 'Chợ Đông Ba',         type: 'indoor',  cat: 'food',     lat: 16.4703, lon: 107.5778, hours: '6:00–20:00',  desc: 'Chợ lớn nhất Huế - bún bò, bánh bèo, cơm hến' },
    { name: 'Phá Tam Giang',       type: 'outdoor', cat: 'nature',   lat: 16.5500, lon: 107.5167, hours: '24/7',        desc: 'Đầm phá lớn nhất Đông Nam Á, hoàng hôn đẹp' },
    { name: 'Nhà Vườn Thanh Toàn', type: 'outdoor', cat: 'heritage', lat: 16.4333, lon: 107.6667, hours: '8:00–17:00',  desc: 'Nhà vườn truyền thống Huế, cầu ngói cổ thế kỷ 18' },
  ],
};

const PNAME       = { thanh_hoa:'Thanh Hóa', nghe_an:'Nghệ An', ha_tinh:'Hà Tĩnh', hue:'Huế' };
const PROV_CENTER = { thanh_hoa:[19.808,105.776], nghe_an:[18.679,105.682], ha_tinh:[18.343,105.906], hue:[16.462,107.595] };
const CAT_LABEL   = { beach:'Biển', trekking:'Trekking', nature:'Thiên nhiên', heritage:'Di tích', food:'Ẩm thực' };
const TYPE_LABEL  = { outdoor:'Ngoài trời', indoor:'Trong nhà', mixed:'Kết hợp' };
const CAT_COLOR   = { beach:'#0ea5e9', trekking:'#16a34a', nature:'#22c55e', heritage:'#a855f7', food:'#f97316' };

const SUIT_CFG = {
  great:       { label:'Rất phù hợp',   color:'#15803d', bg:'#f0fdf4', border:'#bbf7d0' },
  ok:          { label:'Phù hợp',       color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe' },
  limit:       { label:'Hạn chế',       color:'#b45309', bg:'#fffbeb', border:'#fde68a' },
  indoor_only: { label:'Chỉ trong nhà', color:'#9a3412', bg:'#fff7ed', border:'#fed7aa' },
  no:          { label:'Không nên',     color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
};
const SUIT_MATRIX = {
  outdoor: ['great','ok','limit','no','no','no'],
  mixed:   ['great','ok','limit','indoor_only','no','no'],
  indoor:  ['ok','ok','ok','ok','limit','limit'],
};
function getSuit(aqi, type) { return (SUIT_MATRIX[type]||[])[aqiLevel(aqi)]||'ok'; }

const AQI_TABLE_ROWS = [
  { range:'0–49',   outdoor:'great', mixed:'great',       indoor:'ok'    },
  { range:'50–99',  outdoor:'ok',    mixed:'ok',          indoor:'ok'    },
  { range:'100–149',outdoor:'limit', mixed:'limit',       indoor:'ok'    },
  { range:'150–199',outdoor:'no',    mixed:'indoor_only', indoor:'ok'    },
  { range:'200–299',outdoor:'no',    mixed:'no',          indoor:'limit' },
  { range:'300–499',outdoor:'no',    mixed:'no',          indoor:'limit' },
];

// ── Haversine ─────────────────────────────────────────────────────────────────
function haversineKm(lat1,lon1,lat2,lon2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ── Waypoints QL1A – buộc route đi dọc Bắc–Nam VN thay vì qua Lào ────────────
function buildQL1AWaypoints(fromLat,fromLon,destLat,destLon) {
  if (haversineKm(fromLat,fromLon,destLat,destLon) < 80) return [];
  const QL1A = [
    [21.028,105.852],[20.411,106.338],[19.808,105.776],[18.679,105.682],
    [18.343,105.906],[17.467,106.622],[16.462,107.595],[16.054,108.202],
    [15.120,108.800],[13.783,109.214],[12.667,109.100],[11.340,108.100],[10.823,106.630],
  ];
  const mn=Math.min(fromLat,destLat), mx=Math.max(fromLat,destLat);
  return QL1A
    .filter(([lat])=>lat>mn+0.25&&lat<mx-0.25)
    .sort((a,b)=>fromLat>destLat?b[0]-a[0]:a[0]-b[0]);
}

// ── OSRM fetch helper ─────────────────────────────────────────────────────────
// Chiến lược:
//  • Ô tô  : driving  (có cao tốc/motorway) – dùng OSRM car profile
//  • Xe máy: driving + exclude=motorway     – tránh cao tốc, đi QL1A bình thường
//  • Đi bộ : walking profile
//
// Server ưu tiên:
//  1. router.project-osrm.org – ổn định, xử lý đường dài tốt
//  2. routing.openstreetmap.de – backup
//
// Cả 2 server đều không hỗ trợ exclude= natively trong free tier,
// nên xe máy ta xử lý bằng cách FORCE waypoints QL1A (tránh cao tốc tự nhiên
// vì QL1A là quốc lộ thường, OSRM sẽ route theo đó thay vì cao tốc).
async function fetchOSRM(profile, coordStr, extraParams = '') {
  const SERVERS = [
    `https://router.project-osrm.org/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson&steps=true${extraParams}`,
    `https://routing.openstreetmap.de/routed-${profile === 'walking' ? 'foot' : 'car'}/route/v1/${profile === 'walking' ? 'walking' : 'driving'}/${coordStr}?overview=full&geometries=geojson&steps=true${extraParams}`,
  ];
  for (const url of SERVERS) {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 25000);
      const res  = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) continue;
      const d = await res.json();
      if (d.code === 'Ok' && d.routes?.[0]) return d;
    } catch { /* timeout / network, thử server kế */ }
  }
  return null;
}

// ── AQI Slider Panel ──────────────────────────────────────────────────────────
function AQISliderPanel({ sliderAqi, setSliderAqi }) {
  const lvl=aqiLevel(sliderAqi), C=AQI_COLORS[lvl], L=AQI_LABELS[lvl], row=AQI_TABLE_ROWS[lvl];
  return (
    <div style={{background:'#fff',borderRadius:12,border:'1px solid #e0e7f0',overflow:'hidden'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:C}}/>
          <span style={{fontWeight:700,fontSize:'0.88rem',color:'#1e293b'}}>Khuyến nghị theo mức AQI</span>
        </div>
        <span style={{fontSize:'0.75rem',color:'#64748b'}}>Kéo để xem mức khác</span>
      </div>
      <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
          <input type="range" min="0" max="300" step="1" value={sliderAqi}
            onChange={e=>setSliderAqi(Number(e.target.value))} style={{flex:1,accentColor:C}}/>
          <div style={{minWidth:100,padding:'4px 12px',borderRadius:8,textAlign:'center',background:C,fontWeight:800,fontSize:'0.95rem',color:lvl<=1?'#333':'#fff'}}>
            {sliderAqi} - {L}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'0 2px'}}>
          {AQI_LABELS.slice(0,5).map((lbl,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:AQI_COLORS[i],border:lvl===i?'2px solid #333':'1px solid rgba(0,0,0,.1)'}}/>
              <span style={{fontSize:'0.6rem',color:lvl===i?'#1e293b':'#94a3b8',fontWeight:lvl===i?700:400}}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:'12px 16px',background:`${C}0d`}}>
        <div style={{fontSize:'0.72rem',color:'#64748b',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'}}>
          Ở mức AQI {sliderAqi} ({L}), khuyến nghị:
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[{k:'outdoor',l:'Ngoài trời',s:row.outdoor},{k:'mixed',l:'Kết hợp',s:row.mixed},{k:'indoor',l:'Trong nhà',s:row.indoor}].map(({k,l,s})=>{
            const c=SUIT_CFG[s];
            return (
              <div key={k} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                <div style={{fontSize:'0.7rem',color:'#64748b',marginBottom:3}}>{l}</div>
                <div style={{fontSize:'0.8rem',fontWeight:700,color:c.color}}>{c.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{borderTop:'1px solid #f1f5f9'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.76rem'}}>
          <thead>
            <tr style={{background:'#f8fafd'}}>
              {['Mức AQI','Ngoài trời','Kết hợp','Trong nhà'].map((h,i)=>(
                <th key={i} style={{padding:'7px 12px',textAlign:i===0?'left':'center',color:'#64748b',fontWeight:700,fontSize:'0.7rem'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AQI_TABLE_ROWS.map((r,i)=>{
              const active=i===lvl;
              return (
                <tr key={i} onClick={()=>setSliderAqi(AQI_BINS[i]+1)}
                  style={{background:active?`${AQI_COLORS[i]}18`:i%2?'#fafbfc':'#fff',borderLeft:active?`3px solid ${AQI_COLORS[i]}`:'3px solid transparent',cursor:'pointer'}}>
                  <td style={{padding:'6px 12px',whiteSpace:'nowrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:AQI_COLORS[i]}}/>
                      <span style={{fontWeight:active?700:500,color:active?'#1e293b':'#475569',fontSize:'0.72rem'}}>{AQI_LABELS[i]} ({r.range})</span>
                    </div>
                  </td>
                  {[r.outdoor,r.mixed,r.indoor].map((s,j)=>{
                    const c=SUIT_CFG[s];
                    return <td key={j} style={{padding:'6px 12px',textAlign:'center'}}><span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,borderRadius:5,padding:'1px 7px',fontSize:'0.68rem',fontWeight:600,whiteSpace:'nowrap'}}>{c.label}</span></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:'6px 12px',fontSize:'0.64rem',color:'#94a3b8',borderTop:'1px solid #f1f5f9'}}>
          AQI = Air Quality Index · WHO = World Health Organization · QCVN = Quy chuẩn kỹ thuật Quốc gia Việt Nam
        </div>
      </div>
    </div>
  );
}

// ── Leaflet map ───────────────────────────────────────────────────────────────
function TourMap({ spots, filterAqi, slug }) {
  const divRef  = useRef(null);
  const wrapRef = useRef(null);
  const stRef   = useRef({ map:null, markers:[], route:null, baseTile:null, labelTile:null, originMk:null });

  const [selected,        setSelected]        = useState(null);
  const [routing,         setRouting]         = useState(false);
  const [routeInfo,       setRouteInfo]       = useState(null);
  const [routeWarn,       setRouteWarn]       = useState('');
  const [origin,          setOrigin]          = useState(null);
  const [basemap,         setBasemap]         = useState('osm');
  const [ready,           setReady]           = useState(false);
  const [mode,            setMode]            = useState('car');
  const [showSteps,       setShowSteps]       = useState(true);
  const [pickingOrigin,   setPickingOrigin]   = useState(false);
  const [addrInput,       setAddrInput]       = useState('');
  const [geocoding,       setGeocoding]       = useState(false);
  const [isFS,            setIsFS]            = useState(false);
  const [addrSuggestions, setAddrSuggestions] = useState([]);

  const BASES = {
    osm:  { label:'Bản đồ',   base:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', baseAttr:'© OpenStreetMap © CARTO', label2Url:null },
    topo: { label:'Địa hình', base:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', baseAttr:'© OpenStreetMap © OpenTopoMap', label2Url:null },
    sat:  { label:'Vệ tinh',  base:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', baseAttr:'© Esri',
            label2Url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', label2Attr:'© CARTO', label2Opacity:0.85 },
  };

  // ── Cấu hình phương tiện ──────────────────────────────────────────────────────
  //  car    : OSRM "driving"  → đường cao tốc + QL (nhanh nhất)
  //  bike   : OSRM "driving"  → nhưng waypoints QL1A buộc đi quốc lộ,
  //           KHÔNG qua cao tốc (OSRM sẽ tránh motorway khi waypoints nằm trên QL)
  //           + timeFactor 1.3 (xe máy chậm hơn, dừng đèn đỏ nhiều hơn)
  //  foot   : OSRM "walking"  → đường bộ hành, mọi khoảng cách
  //  flight : tính tay qua sân bay (đã ổn)
  const MODES = {
    car:    { label:'Ô tô',   color:'#1565c0', osrmProfile:'driving', useQL1A:false, lineColor:'#1565c0', dash:null,  timeFactor:1.00, note:'Ưu tiên cao tốc' },
    bike:   { label:'Xe máy', color:'#15803d', osrmProfile:'driving', useQL1A:true,  lineColor:'#15803d', dash:null,  timeFactor:1.30, note:'Tránh cao tốc, đi quốc lộ' },
    foot:   { label:'Đi bộ',  color:'#b45309', osrmProfile:'walking', useQL1A:false, lineColor:'#b45309', dash:'6 4', timeFactor:1.00, note:'Đường bộ hành' },
    flight: { label:'Bay',    color:'#6b21a8', osrmProfile:null,       useQL1A:false, lineColor:'#6b21a8', dash:'8 6', timeFactor:1.00, note:'Qua sân bay gần nhất' },
  };

  const TURN_ICON = {
    'turn-left':'↰','turn-right':'↱','turn-slight left':'↖','turn-slight right':'↗',
    'turn-sharp left':'⟲','turn-sharp right':'⟳','continue':'↑','straight':'↑',
    'depart':'▶','arrive':'★','roundabout':'⟳','rotary':'⟳',
    'fork-left':'↖','fork-right':'↗','merge':'⇒','ramp':'↗','notification':'ℹ',
  };
  const getTurnIcon = step => {
    const m=step.maneuver, k=m.modifier?`${m.type}-${m.modifier}`:m.type;
    return TURN_ICON[k]||TURN_ICON[m.type]||'↑';
  };
  const fmtDist = m => m>=1000?`${(m/1000).toFixed(1)} km`:`${Math.round(m)} m`;
  const fmtDur  = s => s<60?`${Math.round(s)}s`:s<3600?`${Math.round(s/60)} phút`:`${Math.floor(s/3600)}h${Math.round((s%3600)/60)?` ${Math.round((s%3600)/60)}p`:''}`;

  // ── Init Leaflet ─────────────────────────────────────────────────────────────
  useEffect(()=>{
    if (!divRef.current) return;
    if (!document.getElementById('lf-css')) {
      const l=document.createElement('link'); l.id='lf-css'; l.rel='stylesheet';
      l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l);
    }
    if (window.L) { initMap(); return; }
    const s=document.createElement('script');
    s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload=initMap; document.head.appendChild(s);
    return ()=>{ stRef.current.map?.remove(); stRef.current.map=null; };
  },[]);

  function initMap(){
    if (stRef.current.map||!divRef.current) return;
    const L=window.L, center=PROV_CENTER[slug]||[17.5,106.5];
    const map=L.map(divRef.current,{center,zoom:slug==='hue'?10:9,zoomControl:false});
    L.control.zoom({position:'topright'}).addTo(map);
    stRef.current.map=map;
    stRef.current.baseTile=L.tileLayer(BASES.osm.base,{attribution:BASES.osm.baseAttr}).addTo(map);
    map.on('click',e=>{
      if (!stRef.current.pickMode) return;
      setOriginAt(e.latlng.lat,e.latlng.lng,`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
      stRef.current.pickMode=false; setPickingOrigin(false);
      map.getContainer().style.cursor='';
    });
    setReady(true);
  }

  useEffect(()=>{
    if (!ready||!stRef.current.map) return;
    const L=window.L, st=stRef.current;
    st.markers.forEach(m=>m.remove()); st.markers=[];
    spots.forEach(spot=>{
      const c=SUIT_CFG[getSuit(filterAqi,spot.type)];
      const icon=L.divIcon({
        className:'',
        html:`<div style="width:30px;height:30px;border-radius:50%;background:${CAT_COLOR[spot.cat]||'#64748b'};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;font-size:13px;outline:3px solid ${c.color};">${{beach:'⬡',trekking:'▲',nature:'◉',heritage:'■',food:'●'}[spot.cat]||'●'}</div>`,
        iconSize:[30,30],iconAnchor:[15,15],
      });
      st.markers.push(L.marker([spot.lat,spot.lon],{icon}).addTo(st.map).on('click',()=>setSelected(spot)));
    });
  },[spots,filterAqi,ready]);

  useEffect(()=>{
    if (!ready||!stRef.current.map) return;
    const L=window.L, st=stRef.current;
    st.baseTile?.remove(); st.baseTile=null;
    st.labelTile?.remove(); st.labelTile=null;
    const b=BASES[basemap];
    st.baseTile=L.tileLayer(b.base,{attribution:b.baseAttr}).addTo(st.map);
    if (b.label2Url) st.labelTile=L.tileLayer(b.label2Url,{attribution:b.label2Attr,opacity:b.label2Opacity,pane:'overlayPane'}).addTo(st.map);
  },[basemap,ready]);

  function setOriginAt(lat,lon,label){
    const L=window.L, st=stRef.current;
    st.originMk?.remove(); st.originMk=null;
    st.originMk=L.marker([lat,lon],{icon:L.divIcon({
      className:'',
      html:`<div style="width:14px;height:14px;border-radius:50%;background:#f97316;border:2.5px solid #fff;box-shadow:0 0 0 4px rgba(249,115,22,.3)"></div>`,
      iconSize:[14,14],iconAnchor:[7,7],
    })}).addTo(st.map).bindPopup(`Điểm xuất phát: ${label}`).openPopup();
    setOrigin({lat,lon,label}); setAddrInput(label); setAddrSuggestions([]);
  }

  function locateMe(){
    navigator.geolocation.getCurrentPosition(p=>{
      setOriginAt(p.coords.latitude,p.coords.longitude,'Vị trí của bạn');
      stRef.current.map?.setView([p.coords.latitude,p.coords.longitude],11);
    },()=>alert('Không lấy được vị trí GPS.'));
  }

  function startPickOnMap(){
    const st=stRef.current; if (!st.map) return;
    st.pickMode=true; setPickingOrigin(true);
    st.map.getContainer().style.cursor='crosshair';
  }

  async function geocodeAddr(q){
    if (!q||q.length<3){setAddrSuggestions([]);return;}
    setGeocoding(true);
    try {
      const d=await(await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=vn&accept-language=vi`,{headers:{'User-Agent':'AQI-Tourism-App/1.0'}})).json();
      setAddrSuggestions(d.map(x=>({label:x.display_name.split(',').slice(0,3).join(', '),lat:parseFloat(x.lat),lon:parseFloat(x.lon)})));
    } catch{}
    setGeocoding(false);
  }

  // ── Routing chính ─────────────────────────────────────────────────────────────
  async function doRoute(dest){
    if (!origin){alert('Vui lòng nhập điểm xuất phát trước.');return;}
    const st=stRef.current; if (!st.map) return;
    try{st.route?.remove?st.route.remove():st.route?.clearLayers?.();}catch{}
    st.route=null; setRouteInfo(null); setRouteWarn(''); setRouting(true);

    const from=[origin.lat,origin.lon];
    const mc=MODES[mode];
    const distKm=haversineKm(from[0],from[1],dest.lat,dest.lon);

    // ── Bay (không đổi) ─────────────────────────────────────────────────────
    if (mode==='flight'){
      const L=window.L;
      const AP=[
        {code:'SGN',name:'Tân Sơn Nhất',lat:10.8188,lon:106.6520},
        {code:'HAN',name:'Nội Bài',      lat:21.2212,lon:105.8070},
        {code:'DAD',name:'Đà Nẵng',      lat:16.0439,lon:108.1992},
        {code:'HUI',name:'Phú Bài',      lat:16.4015,lon:107.7030},
        {code:'VII',name:'Vinh',         lat:18.7376,lon:105.6706},
        {code:'THD',name:'Thọ Xuân',     lat:19.9014,lon:105.4676},
        {code:'CXR',name:'Cam Ranh',     lat:11.9982,lon:109.2192},
        {code:'PQC',name:'Phú Quốc',     lat:10.1698,lon:103.9931},
      ];
      const near=(lat,lon)=>AP.reduce((b,a)=>haversineKm(a.lat,a.lon,lat,lon)<haversineKm(b.lat,b.lon,lat,lon)?a:b);
      const apF=near(from[0],from[1]), apD=near(dest.lat,dest.lon);
      const flightMin=Math.round(distKm/800*60+60);
      const grp=L.layerGroup().addTo(st.map);
      L.polyline([[from[0],from[1]],[apF.lat,apF.lon]],{color:'#f97316',weight:3,dashArray:'5 5',opacity:0.8}).addTo(grp);
      L.polyline([[apF.lat,apF.lon],[apD.lat,apD.lon]],{color:'#6b21a8',weight:4,dashArray:'8 6',opacity:0.85}).addTo(grp);
      L.polyline([[apD.lat,apD.lon],[dest.lat,dest.lon]],{color:'#f97316',weight:3,dashArray:'5 5',opacity:0.8}).addTo(grp);
      [apF,apD].forEach(ap=>L.marker([ap.lat,ap.lon],{icon:L.divIcon({className:'',html:`<div style="background:#6b21a8;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3)">${ap.code}</div>`,iconAnchor:[16,10]})}).addTo(grp));
      st.route=grp;
      st.map.fitBounds(L.latLngBounds([from,[dest.lat,dest.lon]]).pad(0.2));
      setRouteInfo({km:distKm.toFixed(0),time:`~${flightMin} phút`,name:dest.name,mode,steps:[
        {icon:'▶',text:`Từ ${origin.label}`,dist:'',dur:''},
        {icon:'🚗',text:`Đến sân bay ${apF.name} (${apF.code})`,dist:fmtDist(haversineKm(from[0],from[1],apF.lat,apF.lon)*1000),dur:''},
        {icon:'✈',text:`Bay ${apF.code} → ${apD.code}`,dist:`${distKm.toFixed(0)} km`,dur:`~${flightMin} phút`},
        {icon:'🚗',text:`Từ sân bay ${apD.name} đến ${dest.name}`,dist:fmtDist(haversineKm(apD.lat,apD.lon,dest.lat,dest.lon)*1000),dur:''},
        {icon:'★',text:`Đến ${dest.name}`,dist:'',dur:''},
      ]});
      setRouting(false); return;
    }

    // ── Xây dựng tọa độ route ────────────────────────────────────────────────
    // Ô tô: không cần waypoint QL1A → OSRM tự chọn đường nhanh nhất (có thể qua cao tốc)
    // Xe máy: force waypoints QL1A → OSRM route theo quốc lộ, tự nhiên tránh cao tốc
    // Đi bộ: không waypoint (đi bộ gần, không cần QL1A)
    const waypoints = mc.useQL1A ? buildQL1AWaypoints(from[0],from[1],dest.lat,dest.lon) : [];

    const coordStr=[
      `${from[1]},${from[0]}`,
      ...waypoints.map(w=>`${w[1]},${w[0]}`),
      `${dest.lon},${dest.lat}`,
    ].join(';');

    const data=await fetchOSRM(mc.osrmProfile, coordStr);

    if (data){
      const r=data.routes[0]; const L=window.L;
      const pts=r.geometry.coordinates.map(c=>[c[1],c[0]]);
      st.route=L.polyline(pts,{color:mc.lineColor,weight:5,opacity:0.85,dashArray:mc.dash}).addTo(st.map);
      st.map.fitBounds(L.latLngBounds([[from[0],from[1]],[dest.lat,dest.lon]]).pad(0.15));

      const steps=[];
      r.legs.forEach(leg=>leg.steps.forEach(step=>{
        const road=step.name||(step.ref?`Đường ${step.ref}`:'');
        const icon=getTurnIcon(step);
        let text='';
        if (step.maneuver.type==='depart') text=`Bắt đầu${road?` trên ${road}`:''}`;
        else if (step.maneuver.type==='arrive') text=`Đến ${dest.name}`;
        else {
          const dm={left:'Rẽ trái',right:'Rẽ phải','slight left':'Veer trái','slight right':'Veer phải','sharp left':'Quặt trái','sharp right':'Quặt phải',straight:'Đi thẳng',uturn:'Quay đầu'};
          text=`${dm[step.maneuver.modifier]||'Tiếp tục'}${road?` vào ${road}`:''}`;
        }
        if (step.distance>5||step.maneuver.type==='depart'||step.maneuver.type==='arrive')
          steps.push({icon,text,dist:step.distance>0?fmtDist(step.distance):'',dur:step.duration>10?fmtDur(step.duration):''});
      }));

      // Thời gian: xe máy nhân timeFactor 1.3 (đường chậm hơn ô tô)
      const adjSec=r.duration*mc.timeFactor;
      const totalMin=Math.round(adjSec/60);
      const timeStr=totalMin<60?`${totalMin} phút`:`${Math.floor(totalMin/60)}h${totalMin%60?` ${totalMin%60}p`:''}`;

      setRouteInfo({km:(r.distance/1000).toFixed(1),time:timeStr,name:dest.name,mode,steps});

      // Thông báo gợi ý không làm chặn
      if (mode==='bike'&&distKm>300)
        setRouteWarn(`ℹ️ Tuyến xe máy ${distKm.toFixed(0)} km (~${timeStr}). Đường quốc lộ, nên nghỉ mỗi 2–3h.`);
      if (mode==='foot'&&distKm>30)
        setRouteWarn(`ℹ️ Tuyến đi bộ ${distKm.toFixed(0)} km (~${timeStr}). Rất dài, hãy chuẩn bị kỹ.`);
    } else {
      // Thất bại → hiện ước tính
      const spd=mode==='foot'?5:mode==='bike'?45:90;
      const hrs=(distKm/spd).toFixed(1);
      const unit=mode==='foot'?'đi bộ':mode==='bike'?'xe máy':'ô tô';
      setRouteWarn(
        `⚠️ Không lấy được tuyến đường từ server (${distKm.toFixed(0)} km).\n` +
        `Ước tính: ~${hrs} giờ ${unit} theo đường thẳng.\n` +
        `Thử lại sau ít phút hoặc chọn phương tiện "Bay" cho đường rất xa.`
      );
    }
    setRouting(false);
  }

  function clearRoute(){
    const st=stRef.current;
    try{st.route?.remove?st.route.remove():st.route?.clearLayers?.();}catch{}
    st.route=null; setRouteInfo(null); setRouteWarn('');
  }

  function toggleFS(){
    const el=wrapRef.current; if (!el) return;
    if (!isFS)(el.requestFullscreen||el.webkitRequestFullscreen||(()=>{})).call(el);
    else (document.exitFullscreen||document.webkitExitFullscreen||(()=>{})).call(document);
    setIsFS(f=>!f); setTimeout(()=>stRef.current.map?.invalidateSize(),350);
  }

  const selSuit=selected?SUIT_CFG[getSuit(filterAqi,selected.type)]:null;

  return (
    <div ref={wrapRef} style={{background:isFS?'#fff':'transparent',padding:isFS?12:0}}>

      {/* Điểm xuất phát */}
      <div style={{background:'#f8fafd',borderRadius:10,border:'1px solid #e0e7f0',padding:'10px 14px',marginBottom:10}}>
        <div style={{fontSize:'0.7rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',marginBottom:7}}>Điểm xuất phát</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',position:'relative'}}>
          <div style={{flex:1,minWidth:200,position:'relative'}}>
            <input value={addrInput} onChange={e=>{setAddrInput(e.target.value);geocodeAddr(e.target.value);}}
              placeholder="Nhập địa chỉ hoặc tên nơi xuất phát..."
              style={{width:'100%',padding:'6px 10px',borderRadius:7,border:'1px solid #e0e7f0',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'}}/>
            {addrSuggestions.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #e0e7f0',borderRadius:7,boxShadow:'0 4px 12px rgba(0,0,0,.1)',zIndex:1000,marginTop:2}}>
                {geocoding&&<div style={{padding:'6px 10px',fontSize:'0.74rem',color:'#94a3b8'}}>Đang tìm...</div>}
                {addrSuggestions.map((s,i)=>(
                  <div key={i} onClick={()=>{setOriginAt(s.lat,s.lon,s.label);stRef.current.map?.setView([s.lat,s.lon],12);}}
                    style={{padding:'7px 10px',fontSize:'0.78rem',color:'#334155',cursor:'pointer',borderBottom:i<addrSuggestions.length-1?'1px solid #f1f5f9':'none'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8fafd'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>{s.label}</div>
                ))}
              </div>
            )}
          </div>
          <button onClick={locateMe} style={{padding:'6px 11px',borderRadius:7,fontSize:'0.74rem',cursor:'pointer',border:'1.5px solid #e0e7f0',background:'#fff',color:'#64748b',whiteSpace:'nowrap'}}>📍 GPS</button>
          <button onClick={startPickOnMap} style={{padding:'6px 11px',borderRadius:7,fontSize:'0.74rem',cursor:'pointer',border:`1.5px solid ${pickingOrigin?'#f97316':'#e0e7f0'}`,background:pickingOrigin?'#fff7ed':'#fff',color:pickingOrigin?'#f97316':'#64748b',whiteSpace:'nowrap'}}>
            {pickingOrigin?'Click vào map...':'🗺 Chấm map'}
          </button>
          {origin&&(
            <button onClick={()=>{setOrigin(null);setAddrInput('');setAddrSuggestions([]);const st=stRef.current;st.originMk?.remove();st.originMk=null;}}
              style={{padding:'6px 8px',borderRadius:7,fontSize:'0.74rem',cursor:'pointer',border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626'}}>✕</button>
          )}
        </div>
        {origin&&<div style={{marginTop:6,fontSize:'0.7rem',color:'#15803d',display:'flex',gap:4,alignItems:'center'}}><div style={{width:8,height:8,borderRadius:'50%',background:'#f97316'}}/>{origin.label}</div>}
        {pickingOrigin&&<div style={{marginTop:6,fontSize:'0.72rem',color:'#f97316',fontWeight:600}}>Click vào bất kỳ vị trí nào trên bản đồ để đặt điểm xuất phát</div>}
      </div>

      {/* Thanh điều khiển */}
      <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:'0.68rem',color:'#94a3b8',fontWeight:600}}>NỀN:</span>
        {Object.entries(BASES).map(([k,b])=>(
          <button key={k} onClick={()=>setBasemap(k)} style={{padding:'3px 10px',borderRadius:20,fontSize:'0.72rem',cursor:'pointer',border:`1.5px solid ${basemap===k?'#1565c0':'#e0e7f0'}`,background:basemap===k?'#eff6ff':'#fff',color:basemap===k?'#1565c0':'#64748b',fontWeight:basemap===k?700:400}}>{b.label}</button>
        ))}
        {(routeInfo||routeWarn)&&<button onClick={clearRoute} style={{padding:'3px 9px',borderRadius:20,fontSize:'0.72rem',cursor:'pointer',border:'1.5px solid #fecaca',background:'#fef2f2',color:'#dc2626'}}>Xóa đường</button>}
        <button onClick={toggleFS} style={{marginLeft:'auto',padding:'3px 10px',borderRadius:20,fontSize:'0.72rem',cursor:'pointer',border:'1.5px solid #e0e7f0',background:'#fff',color:'#64748b'}}>{isFS?'Thu nhỏ':'Toàn màn hình'}</button>
      </div>

      {/* Cảnh báo/gợi ý */}
      {routeWarn&&(
        <div style={{marginBottom:8,padding:'10px 14px',borderRadius:8,background:'#fffbeb',border:'1px solid #fde68a',fontSize:'0.78rem',color:'#92400e',whiteSpace:'pre-line',lineHeight:1.5}}>
          {routeWarn}
        </div>
      )}

      {/* Route summary */}
      {routeInfo&&(
        <div style={{marginBottom:8,padding:'8px 14px',borderRadius:8,background:MODES[routeInfo.mode].color+'12',border:`1px solid ${MODES[routeInfo.mode].color}33`,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontWeight:800,color:MODES[routeInfo.mode].color,fontSize:'1rem'}}>{routeInfo.km} km</span>
          <span style={{color:'#475569',fontSize:'0.82rem'}}>{routeInfo.time} · {MODES[routeInfo.mode].label}</span>
          <span style={{color:'#94a3b8',fontSize:'0.72rem',fontStyle:'italic'}}>{MODES[routeInfo.mode].note}</span>
          <span style={{color:'#64748b',fontSize:'0.8rem'}}>→ {routeInfo.name}</span>
          <button onClick={()=>setShowSteps(s=>!s)} style={{marginLeft:'auto',padding:'3px 10px',borderRadius:6,fontSize:'0.72rem',cursor:'pointer',border:'1px solid #e0e7f0',background:'#fff',color:'#475569'}}>
            {showSteps?'Ẩn chỉ dẫn':'Xem chỉ dẫn'}
          </button>
        </div>
      )}

      {/* Step-by-step */}
      {routeInfo&&showSteps&&routeInfo.steps?.length>0&&(
        <div style={{marginBottom:10,background:'#fff',borderRadius:10,border:'1px solid #e0e7f0',overflow:'hidden',maxHeight:220,overflowY:'auto'}}>
          <div style={{padding:'8px 12px',background:'#f8fafd',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'0.76rem',fontWeight:700,color:'#334155'}}>Hướng dẫn từng bước ({routeInfo.steps.length} bước)</span>
            <span style={{fontSize:'0.68rem',color:'#94a3b8'}}>{routeInfo.km} km · {routeInfo.time}</span>
          </div>
          {routeInfo.steps.map((step,i)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'7px 12px',borderBottom:i<routeInfo.steps.length-1?'1px solid #f8fafd':'none',alignItems:'flex-start',background:i===0||i===routeInfo.steps.length-1?'#f0fdf4':'#fff'}}>
              <div style={{width:24,height:24,borderRadius:'50%',background:i===0?'#15803d':i===routeInfo.steps.length-1?'#dc2626':'#f1f5f9',color:(i===0||i===routeInfo.steps.length-1)?'#fff':'#475569',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,flexShrink:0}}>
                {step.icon}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.78rem',color:'#1e293b',fontWeight:i===0||i===routeInfo.steps.length-1?700:400,lineHeight:1.3}}>{step.text}</div>
                {(step.dist||step.dur)&&<div style={{fontSize:'0.67rem',color:'#94a3b8',marginTop:2}}>{step.dist}{step.dist&&step.dur?' · ':''}{step.dur}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div ref={divRef} className="map-h-tour" style={{width:'100%',height:isFS?'calc(100vh - 260px)':400,borderRadius:10,border:'1px solid #e0e7f0'}}/>

      {/* Popup điểm */}
      {selected&&selSuit&&(
        <div style={{marginTop:8,background:'#fff',borderRadius:10,border:`1.5px solid ${selSuit.border}`,padding:'10px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:4}}>
            <b style={{fontSize:'0.88rem',color:'#1e293b'}}>{selected.name}</b>
            <span style={{background:selSuit.color,color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:'0.62rem',fontWeight:700,whiteSpace:'nowrap'}}>{selSuit.label}</span>
          </div>
          <p style={{fontSize:'0.75rem',color:'#64748b',margin:'0 0 10px',lineHeight:1.4}}>{selected.desc}</p>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:'0.63rem',color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Phương tiện</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {Object.entries(MODES).map(([k,m])=>(
                <button key={k} onClick={()=>setMode(k)}
                  style={{padding:'5px 11px',borderRadius:7,fontSize:'0.74rem',cursor:'pointer',fontWeight:mode===k?700:400,border:`1.5px solid ${mode===k?m.color:'#e0e7f0'}`,background:mode===k?m.color+'18':'#fff',color:mode===k?m.color:'#64748b'}}>
                  {m.label}
                  {mode===k&&<span style={{display:'block',fontSize:'0.55rem',fontWeight:400,opacity:0.75,marginTop:1}}>{m.note}</span>}
                </button>
              ))}
            </div>
            {/* Gợi ý thông minh */}
            {origin&&(()=>{
              const d=haversineKm(origin.lat,origin.lon,selected.lat,selected.lon);
              if (d>500) return <div style={{marginTop:6,fontSize:'0.7rem',color:'#6b21a8'}}>✈️ {d.toFixed(0)} km - cân nhắc chọn "Bay" để tiết kiệm thời gian</div>;
              if (d>100) return <div style={{marginTop:6,fontSize:'0.7rem',color:'#64748b'}}>📍 {d.toFixed(0)} km đường chim bay</div>;
              return null;
            })()}
            {!origin&&<div style={{marginTop:5,fontSize:'0.7rem',color:'#f97316'}}>Nhập điểm xuất phát ở trên trước khi chỉ đường</div>}
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:'0.65rem',background:'#f1f5f9',borderRadius:5,padding:'1px 6px',color:'#64748b'}}>{selected.hours}</span>
            <span style={{fontSize:'0.65rem',background:'#f1f5f9',borderRadius:5,padding:'1px 6px',color:'#64748b'}}>{TYPE_LABEL[selected.type]}</span>
            <button onClick={()=>doRoute(selected)} disabled={routing||!origin}
              style={{marginLeft:'auto',padding:'6px 16px',borderRadius:7,fontSize:'0.78rem',fontWeight:700,cursor:(routing||!origin)?'not-allowed':'pointer',border:'none',background:(routing||!origin)?'#cbd5e1':MODES[mode].color,color:'#fff'}}>
              {routing?'Đang tính...':'Chỉ đường'}
            </button>
            <button onClick={()=>setSelected(null)} style={{padding:'6px 10px',borderRadius:7,fontSize:'0.76rem',cursor:'pointer',border:'1px solid #e0e7f0',background:'#f8fafd',color:'#64748b'}}>✕</button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8,fontSize:'0.65rem',color:'#94a3b8'}}>
        {Object.entries(CAT_COLOR).map(([k,c])=>(
          <span key={k} style={{display:'flex',alignItems:'center',gap:3}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>{CAT_LABEL[k]}
          </span>
        ))}
        <span style={{marginLeft:4}}>· viền màu = mức phù hợp AQI</span>
      </div>
      <p style={{fontSize:'0.65rem',color:'#b0b8c8',marginTop:3}}>
        Ô tô: có cao tốc · Xe máy: quốc lộ (không cao tốc) · Đi bộ: đường bộ hành
      </p>
    </div>
  );
}

// ── Spot Card ─────────────────────────────────────────────────────────────────
function SpotCard({ spot, filterAqi }) {
  const s=getSuit(filterAqi,spot.type), c=SUIT_CFG[s];
  return (
    <div style={{background:'#fff',borderRadius:10,border:`1px solid ${c.border}`,overflow:'hidden'}}>
      <div style={{background:c.bg,padding:'7px 12px',borderBottom:`1px solid ${c.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
        <span style={{fontWeight:700,fontSize:'0.82rem',color:'#1e293b'}}>{spot.name}</span>
        <span style={{background:c.color,color:'#fff',borderRadius:20,padding:'1px 7px',fontSize:'0.6rem',fontWeight:700,whiteSpace:'nowrap'}}>{c.label}</span>
      </div>
      <div style={{padding:'8px 12px'}}>
        <p style={{fontSize:'0.74rem',color:'#475569',lineHeight:1.4,margin:'0 0 6px'}}>{spot.desc}</p>
        <div style={{display:'flex',gap:4}}>
          <span style={{fontSize:'0.62rem',background:'#f1f5f9',borderRadius:5,padding:'1px 6px',color:'#64748b'}}>{spot.hours}</span>
          <span style={{fontSize:'0.62rem',background:'#f1f5f9',borderRadius:5,padding:'1px 6px',color:'#64748b'}}>{TYPE_LABEL[spot.type]}</span>
          <span style={{fontSize:'0.62rem',background:'#f1f5f9',borderRadius:5,padding:'1px 6px',color:'#64748b'}}>{CAT_LABEL[spot.cat]}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Tab6Tourism({ data, slug }) {
  const realAqi=data?.current?.aqi??100;
  const [sliderAqi,setSliderAqi]=useState(Math.round(realAqi));
  const [fCat,setFCat]=useState('all');
  const [fType,setFType]=useState('all');

  useEffect(()=>{setSliderAqi(Math.round(realAqi));},[slug,realAqi]);

  const spots=TOURISM_DATA[slug]||[];
  const pname=PNAME[slug]||slug;
  const lvl=aqiLevel(sliderAqi);

  const filtered=useMemo(()=>spots.filter(s=>{
    const suit=getSuit(sliderAqi,s.type);
    if (suit==='no'||suit==='indoor_only') return false;
    if (fCat!=='all'&&s.cat!==fCat) return false;
    if (fType!=='all'&&s.type!==fType) return false;
    return true;
  }),[spots,sliderAqi,fCat,fType]);

  const allFiltered=useMemo(()=>spots.filter(s=>{
    if (fCat!=='all'&&s.cat!==fCat) return false;
    if (fType!=='all'&&s.type!==fType) return false;
    return true;
  }),[spots,fCat,fType]);

  const headerBg=['#1a7a2e','#6b6b00','#b85c00','#b82222','#6b1a91','#7a0a1a'][Math.min(lvl,5)];
  const btn=on=>({padding:'4px 10px',borderRadius:7,fontSize:'0.74rem',cursor:'pointer',border:`1px solid ${on?'#1565c0':'#e0e7f0'}`,background:on?'#1565c0':'#fff',color:on?'#fff':'#64748b',fontWeight:on?600:400});

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{borderRadius:12,padding:'12px 16px',color:'#fff',background:headerBg}}>
        <div style={{fontWeight:800,fontSize:'0.95rem',marginBottom:4}}>Gợi ý Du lịch - {pname}</div>
        <div style={{fontSize:'0.8rem',opacity:0.88}}>
          AQI hiện tại: <b>{Math.round(realAqi)}</b> ({AQI_LABELS[aqiLevel(realAqi)]})
          {Math.round(realAqi)!==sliderAqi&&<span style={{marginLeft:10,opacity:0.75}}>· Đang xem: AQI {sliderAqi}</span>}
        </div>
      </div>

      <AQISliderPanel sliderAqi={sliderAqi} setSliderAqi={setSliderAqi}/>

      <div style={{background:'#fff',borderRadius:12,padding:14,boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
        <div style={{fontWeight:700,color:'#1e293b',marginBottom:8,fontSize:'0.9rem'}}>
          Bản đồ điểm du lịch
          <span style={{marginLeft:8,fontSize:'0.72rem',color:'#94a3b8',fontWeight:400}}>- màu viền theo mức phù hợp với AQI {sliderAqi}</span>
        </div>
        <TourMap spots={allFiltered} filterAqi={sliderAqi} slug={slug}/>
      </div>

      <div style={{background:'#fff',borderRadius:12,padding:14,boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
        <div style={{fontWeight:700,color:'#1e293b',marginBottom:10,fontSize:'0.86rem'}}>Lọc danh sách</div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:'0.63rem',color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase'}}>Không gian</div>
            <div style={{display:'flex',gap:4}}>
              {[['all','Tất cả'],['outdoor','Ngoài trời'],['indoor','Trong nhà'],['mixed','Kết hợp']].map(([v,l])=>(
                <button key={v} onClick={()=>setFType(v)} style={btn(fType===v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:'0.63rem',color:'#94a3b8',marginBottom:4,fontWeight:700,textTransform:'uppercase'}}>Loại hình</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {[['all','Tất cả'],['beach','Biển'],['trekking','Trekking'],['nature','Thiên nhiên'],['heritage','Di tích'],['food','Ẩm thực']].map(([v,l])=>(
                <button key={v} onClick={()=>setFCat(v)} style={btn(fCat===v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{marginBottom:8,fontSize:'0.78rem',color:'#64748b'}}>
          Ở mức AQI <b style={{color:'#1e293b'}}>{sliderAqi}</b>, có <b style={{color:'#1e293b'}}>{filtered.length}</b>/{spots.length} điểm phù hợp
          {filtered.length<allFiltered.length&&<span style={{color:'#94a3b8'}}> (ẩn {allFiltered.length-filtered.length} điểm không nên đến)</span>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:10}}>
          {filtered.map((s,i)=><SpotCard key={i} spot={s} filterAqi={sliderAqi}/>)}
          {!filtered.length&&(
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:28,color:'#94a3b8',fontSize:'0.84rem'}}>
              Không có điểm nào phù hợp để tham quan với mức AQI này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
