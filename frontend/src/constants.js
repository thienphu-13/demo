/** constants.js — Hằng số dùng chung frontend */

export const AQI_BINS   = [0, 50, 100, 150, 200, 300, 500];
export const AQI_LABELS = ['Tốt', 'Trung bình', 'Kém', 'Xấu', 'Rất xấu', 'Nguy hại'];
export const AQI_COLORS = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023'];
export const AQI_TEXT_COLORS = ['#000', '#000', '#000', '#fff', '#fff', '#fff'];
export const AQI_RGBA   = [
  'rgba(0,228,0,0.13)',
  'rgba(255,255,0,0.13)',
  'rgba(255,126,0,0.13)',
  'rgba(255,0,0,0.13)',
  'rgba(143,63,151,0.13)',
];

export function aqiLevel(val) {
  val = Math.max(0, Number(val));
  for (let i = 0; i < AQI_BINS.length - 1; i++) {
    if (val >= AQI_BINS[i] && val < AQI_BINS[i + 1]) return i;
  }
  return AQI_LABELS.length - 1;
}

export function aqiColor(val) { return AQI_COLORS[aqiLevel(val)]; }
export function aqiLabel(val) { return AQI_LABELS[aqiLevel(val)]; }
export function aqiTextColor(val) { return AQI_TEXT_COLORS[aqiLevel(val)]; }
