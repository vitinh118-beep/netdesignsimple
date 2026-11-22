// ===== THÊM THIẾT BỊ MỚI: thêm 1 dòng vào DEVICES =====
// key: mã duy nhất | name: tên hiển thị | icon: emoji | color: màu viền | group: nhóm trong thư viện
// shape (dạng 3D): flat | tall | cube | disc | cloud | desk | cam  (bỏ trống = cube)
export type Shape = 'flat' | 'tall' | 'cube' | 'disc' | 'cloud' | 'desk' | 'cam';
export interface DeviceDef { name: string; icon: string; color: string; group: string; shape?: Shape }

export const DEVICES: Record<string, DeviceDef> = {
  internet: { name: 'Internet',   icon: '☁️', color: '#64748b', group: 'WAN', shape: 'cloud' },
  modem:    { name: 'Modem',      icon: '📟', color: '#64748b', group: 'WAN', shape: 'flat' },
  router:   { name: 'Router',     icon: '🔀', color: '#0ea5e9', group: 'Mạng', shape: 'flat' },
  firewall: { name: 'Firewall',   icon: '🧱', color: '#ef4444', group: 'Mạng', shape: 'tall' },
  switch:   { name: 'Switch',     icon: '🔌', color: '#0284c7', group: 'Mạng', shape: 'flat' },
  ap:       { name: 'WiFi AP',    icon: '📶', color: '#8b5cf6', group: 'Mạng', shape: 'disc' },
  server:   { name: 'Server',     icon: '🖥️', color: '#16a34a', group: 'Máy chủ', shape: 'tall' },
  nas:      { name: 'NAS',        icon: '🗄️', color: '#16a34a', group: 'Máy chủ', shape: 'cube' },
  pc:       { name: 'PC',         icon: '💻', color: '#475569', group: 'Thiết bị đầu cuối', shape: 'desk' },
  laptop:   { name: 'Laptop',     icon: '🧑‍💻', color: '#475569', group: 'Thiết bị đầu cuối', shape: 'desk' },
  phone:    { name: 'IP Phone',   icon: '☎️', color: '#475569', group: 'Thiết bị đầu cuối', shape: 'cube' },
  printer:  { name: 'Máy in',     icon: '🖨️', color: '#475569', group: 'Thiết bị đầu cuối', shape: 'cube' },
  text:     { name: 'Chữ',        icon: 'Aa', color: '#0f172a', group: 'Chú thích' },
  camera:   { name: 'Camera IP',  icon: '📷', color: '#f59e0b', group: 'An ninh', shape: 'cam' },
  nvr:      { name: 'NVR',        icon: '📼', color: '#f59e0b', group: 'An ninh', shape: 'flat' },
};

// Mẫu sơ đồ KHÔNG khai báo ở đây: mỗi mẫu là 1 file .json trong src/data/templates/
// (xem HUONG-DAN-THEM-MAU.md trong thư mục đó)
