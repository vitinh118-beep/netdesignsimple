import { useState } from 'react';
export interface ExportOpts { ip: boolean; note: boolean }
export type ExportKind = 'png' | 'svg' | 'html3d';

export default function ExportDialog({ onClose, onExport }: { onClose: () => void; onExport: (k: ExportKind, o: ExportOpts) => void }) {
  const [o, setO] = useState<ExportOpts>({ ip: false, note: false });
  return (
    <div className="modal" onClick={onClose}>
      <div className="dlg" onClick={e => e.stopPropagation()}>
        <div className="dh"><b>Xuất sơ đồ</b><button onClick={onClose}>✕</button></div>
        <p className="sub">Thông tin đi kèm</p>
        <label className="chk"><input type="checkbox" checked={o.ip} onChange={e => setO({ ...o, ip: e.target.checked })} /> Địa chỉ IP (ảnh PNG, SVG và 3D)</label>
        <label className="chk"><input type="checkbox" checked={o.note} onChange={e => setO({ ...o, note: e.target.checked })} /> Ghi chú (chỉ hiện trong 3D)</label>
        <p className="hint2">{o.ip || o.note ? '🔧 Bản kỹ thuật: có thông tin hạ tầng, chỉ gửi nội bộ hoặc đối tác tin cậy.' : '🛡️ Bản giới thiệu: chỉ có tên thiết bị và kết nối, an toàn khi gửi khách. (Tên thiết bị luôn có trong file.)'}</p>
        <div className="row">
          <button onClick={() => onExport('png', o)}>Ảnh PNG</button>
          <button onClick={() => onExport('svg', o)}>Vector SVG</button>
          <button className="pri" onClick={() => onExport('html3d', o)}>HTML 3D</button>
        </div>
      </div>
    </div>
  );
}
