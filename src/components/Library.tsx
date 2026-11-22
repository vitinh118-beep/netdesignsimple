import { useRef, useState } from 'react';
import { DEVICES } from '../data/catalog';

// Thư viện thiết bị: kéo (chuột/bút) có bóng bay theo con trỏ; bấm / chạm để thêm vào giữa khung vẽ.
export default function Library({ onAdd, disabled }: { onAdd: (type: string, at?: { x: number; y: number }) => void; disabled?: boolean }) {
  const [q, setQ] = useState('');
  const [ghost, setGhost] = useState<{ t: string; x: number; y: number } | null>(null);
  const st = useRef<{ t: string; sx: number; sy: number; moved: boolean } | null>(null);
  const groups = [...new Set(Object.values(DEVICES).map(d => d.group))];
  const items = Object.entries(DEVICES).filter(([, d]) => (d.name + ' ' + d.group).toLowerCase().includes(q.toLowerCase()));
  return (
    <aside className={disabled ? 'off' : ''}>
      <input className="search" placeholder="🔍 Tìm thiết bị…" value={q} onChange={e => setQ(e.target.value)} />
      <p className="tip">Kéo thiết bị vào khung vẽ, hoặc bấm để thêm.</p>
      {groups.map(g => {
        const its = items.filter(([, d]) => d.group === g);
        return its.length ? (
          <div key={g}><h4>{g}</h4>
            <div className="grid">
              {its.map(([key, d]) => (
                <button key={key} className="item" title={`Thêm ${d.name}`}
                  onPointerDown={e => { st.current = { t: key, sx: e.clientX, sy: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); }}
                  onPointerMove={e => {
                    const s = st.current; if (!s) return;
                    if (!s.moved && Math.hypot(e.clientX - s.sx, e.clientY - s.sy) < 6) return;
                    s.moved = true; setGhost({ t: s.t, x: e.clientX, y: e.clientY });
                  }}
                  onPointerUp={e => { const s = st.current; st.current = null; setGhost(null); if (s) onAdd(s.t, s.moved ? { x: e.clientX, y: e.clientY } : undefined); }}
                  onPointerCancel={() => { st.current = null; setGhost(null); }}
                  onClick={e => { if (e.detail === 0) onAdd(key); /* bàn phím */ }}>
                  <span>{d.icon}</span><span>{d.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null;
      })}
      {!items.length && <p className="tip">Không thấy thiết bị phù hợp.</p>}
      {ghost && <div className="ghost" style={{ left: ghost.x, top: ghost.y }}>{DEVICES[ghost.t].icon}</div>}
    </aside>
  );
}
