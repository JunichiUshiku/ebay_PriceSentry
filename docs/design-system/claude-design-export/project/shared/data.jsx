// Sample listing data shared across variations
const SAMPLE_LISTINGS = [
  { id: '406875760195', title: 'Pioneer FH-P7000MD Car Audio Used Tested', price: 120, ship: 30, total: 150, compTotal: 139.99, suggested: 109.99, drop: -26.67, status: 'Pending approval', last: '09:15', sale: false, ai: 0.92 },
  { id: '406875760203', title: 'Sony XAV-AX1000 Car Stereo 6.2" Screen', price: 210, ship: 20, total: 230, compTotal: 229.95, suggested: 199.95, drop: -13.07, status: 'Updated', last: '09:10', sale: false, ai: 0.96 },
  { id: '406875760287', title: 'Alpine CDE-172BT CD Receiver', price: 95, ship: 15, total: 110, compTotal: 109, suggested: 89.99, drop: -5.27, status: 'Updated', last: '09:08', sale: false, ai: 0.88 },
  { id: '406875760342', title: 'Kenwood KMM-BT325U Digital Media Receiver', price: 60, ship: 10, total: 70, compTotal: 78.50, suggested: 70.49, drop: 0.70, status: 'Updated', last: '09:05', sale: false, ai: 0.91 },
  { id: '406875760418', title: 'Pioneer DEH-S31BT Car Stereo', price: 80, ship: 10, total: 90, compTotal: 89.99, suggested: 79.99, drop: 0.01, status: 'Skipped', last: '09:02', reason: 'Below min price', sale: false, ai: 0.94 },
  { id: '406875760524', title: 'JVC KD-T720BT Double DIN Stereo', price: 65, ship: 9.99, total: 74.99, compTotal: 64.99, suggested: 54.99, drop: -15.42, status: 'Pending approval', last: '09:00', sale: false, ai: 0.74 },
  { id: '406875760601', title: 'Boss BV9968B Car Stereo', price: 55, ship: 9.99, total: 64.99, compTotal: 54.99, suggested: 44.99, drop: -18.20, status: 'Updated', last: '08:58', sale: false, ai: 0.87 },
  { id: '406875760687', title: 'Clarion CZ215 CD Receiver', price: 45, ship: 11, total: 56, compTotal: 54.99, suggested: 43.99, drop: -2.24, status: 'Pending approval', last: '08:55', sale: true, ai: 0.81 },
  { id: '406875760752', title: 'Sony XDM-17BT Media Receiver', price: 40, ship: 10, total: 50, compTotal: 49.59, suggested: 39.59, drop: -1.03, status: 'Skipped', last: '08:50', reason: 'On sale', sale: true, ai: 0.93 },
  { id: '406875760839', title: 'JBL GX608C 6.5" Component Speakers', price: 75, ship: 15, total: 90, compTotal: null, suggested: null, drop: null, status: 'Error', last: '08:45', reason: 'API error', sale: false, ai: null },
];

const STATUS_MAP = {
  '更新済': 'success',
  '承認待ち': 'warning',
  'スキップ': 'neutral',
  'エラー': 'error',
  'ライバル無し': 'neutral',
};
// Map original English statuses to Japanese for sample data
const STATUS_JA = {
  'Updated': '更新済',
  'Pending approval': '承認待ち',
  'Skipped': 'スキップ',
  'Error': 'エラー',
  'No competitor': 'ライバル無し',
};

const fmtMoney = (n) => n == null ? '—' : `$${n.toFixed(2)}`;
const fmtPct = (n) => n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;

// Apply Japanese status
SAMPLE_LISTINGS.forEach(l => { l.status = STATUS_JA[l.status] || l.status; });
window.SAMPLE_LISTINGS = SAMPLE_LISTINGS;
window.STATUS_MAP = STATUS_MAP;
window.STATUS_JA = STATUS_JA;
window.fmtMoney = fmtMoney;
window.fmtPct = fmtPct;
