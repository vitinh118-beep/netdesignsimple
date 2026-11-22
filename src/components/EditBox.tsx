import { useEffect, useRef, useState } from 'react';
// Ô gõ chữ nổi ngay tại vị trí nhãn. Enter = xong, Esc = huỷ, bấm ra ngoài = xong.
export default function EditBox({ value, left, top, width, size, onDone }: { value: string; left: number; top: number; width: number; size: number; onDone: (v: string | null) => void }) {
  const r = useRef<HTMLInputElement>(null), done = useRef(false);
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => { r.current?.focus(); r.current?.select(); }, 40); return () => clearTimeout(t); }, []); // chờ trình duyệt xử lý xong cú bấm chuột
  const fin = (x: string | null) => { if (!done.current) { done.current = true; onDone(x); } };
  return <input ref={r} className="edit" value={v} maxLength={40} style={{ left, top, width, fontSize: size }}
    onChange={e => setV(e.target.value)} onPointerDown={e => e.stopPropagation()}
    onKeyDown={e => { if (e.key === 'Enter') fin(v); else if (e.key === 'Escape') fin(null); }} onBlur={() => fin(v)} />;
}
