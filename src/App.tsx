import { useEffect, useRef, useState } from 'react';
import { DEVICES } from './data/catalog';
import { toProject } from './data/templateRegistry';
import type { TemplateFile } from './data/templateValidator';
import { uid, download, type P, type N } from './util';
import TemplateGallery from './components/TemplateGallery';
import ExportDialog, { type ExportKind, type ExportOpts } from './components/ExportDialog';
import Library from './components/Library';
import EditBox from './components/EditBox';

type Tool = 'select' | 'area' | 'link' | 'text';
const W = 96, H = 64, GRID = 20, KEY = 'netdesign-lite:v1', BLUE = '#2563eb';
const snap = (v: number) => Math.round(v / GRID) * GRID;
const empty: P = { nodes: [], links: [] };
const valid = (d: any): d is P => d && Array.isArray(d.nodes) && Array.isArray(d.links);
const load = (): P => { try { const d = JSON.parse(localStorage.getItem(KEY) || ''); return valid(d) ? d : empty; } catch { return empty; } };
const isText = (n: { type: string }) => n.type === 'text';
const tw = (n: N) => Math.max(60, n.label.length * (n.fs ?? 16) * 0.62 + 16);
const TOOLS: [Tool, string, string, string][] = [
  ['select', '👆', 'Chọn', 'Chọn và kéo thiết bị; kéo nền để dịch khung nhìn'],
  ['area', '⬚', 'Chọn vùng', 'Kéo khung để chọn nhiều thiết bị (hoặc giữ Shift + kéo)'],
  ['link', '🔗', 'Nối dây', 'Kéo từ thiết bị này sang thiết bị khác, hoặc bấm lần lượt hai thiết bị'],
  ['text', 'Aa', 'Thêm chữ', 'Bấm vào chỗ trống để thêm ô chữ'],
];
const TIPS: Record<Tool, string> = {
  select: 'Kéo để di chuyển · Bấm đúp để đổi tên · Kéo từ chấm tròn để nối dây · Shift + kéo để chọn nhiều',
  area: 'Kéo trên nền để khoanh vùng chọn nhiều thiết bị',
  link: 'Kéo từ thiết bị này sang thiết bị khác để nối (hoặc bấm lần lượt hai thiết bị)',
  text: 'Bấm vào chỗ trống trên khung vẽ để thêm chữ',
};

export default function App() {
  const [p, setP] = useState<P>(load);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [selN, setSelN] = useState<string[]>([]);
  const [selL, setSelL] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [gallery, setGallery] = useState(false);
  const [dlg, setDlg] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [pend, setPend] = useState<string | null>(null);
  const [tmp, setTmp] = useState<{ x: number; y: number; from: string } | null>(null);
  const [marq, setMarq] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const pRef = useRef(p); pRef.current = p;
  const vRef = useRef(view); vRef.current = view;
  const svg = useRef<SVGSVGElement>(null);
  const content = useRef<SVGGElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const v3 = useRef<HTMLDivElement>(null);
  const drag = useRef<any>(null);
  const lastTap = useRef({ id: '', t: 0 });
  const past = useRef<P[]>([]);
  const future = useRef<P[]>([]);

  // ---- lịch sử (undo/redo) ----
  const snapshot = () => { past.current.push(pRef.current); if (past.current.length > 100) past.current.shift(); future.current = []; };
  const edit = (fn: (q: P) => P) => { snapshot(); setP(fn); };
  const clearSel = () => { setSelN([]); setSelL(null); };
  const undo = () => { const s = past.current.pop(); if (s) { future.current.push(pRef.current); setP(s); clearSel(); } };
  const redo = () => { const s = future.current.pop(); if (s) { past.current.push(pRef.current); setP(s); clearSel(); } };
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ } }, [p]);

  // ---- xem 3D ----
  useEffect(() => {
    if (mode !== '3d') return;
    let stop = () => {}, dead = false;
    import('./viewer3d/runtime').then(m => { if (!dead && v3.current) stop = m.mount(v3.current, pRef.current); });
    return () => { dead = true; stop(); };
  }, [mode]);
  const toggle3d = () => { clearSel(); setEditId(null); setMode(m => (m === '2d' ? '3d' : '2d')); };

  // ---- toạ độ & khung nhìn ----
  const toWorld = (cx: number, cy: number) => {
    const r = svg.current!.getBoundingClientRect(), v = vRef.current;
    return { x: (cx - r.left - v.x) / v.k, y: (cy - r.top - v.y) / v.k };
  };
  const fit = () => {
    const r = svg.current!.getBoundingClientRect(), ns = pRef.current.nodes;
    if (!ns.length) return setView({ x: r.width / 2, y: r.height / 2, k: 1 });
    const x0 = Math.min(...ns.map(n => n.x)) - W * 1.6, x1 = Math.max(...ns.map(n => n.x)) + W * 1.2;  // chừa chỗ cho thanh công cụ bên trái
    const y0 = Math.min(...ns.map(n => n.y)) - H * 1.2, y1 = Math.max(...ns.map(n => n.y)) + H * 2.2;  // chừa chỗ cho thanh thuộc tính bên dưới
    const k = Math.min(r.width / (x1 - x0), r.height / (y1 - y0), 1.2);
    setView({ k, x: (r.width - (x1 - x0) * k) / 2 - x0 * k, y: (r.height - (y1 - y0) * k) / 2 - y0 * k });
  };
  const zoomAt = (f: number, mx: number, my: number) =>
    setView(v => { const k = Math.min(3, Math.max(0.2, v.k * f)); return { k, x: mx - (mx - v.x) * k / v.k, y: my - (my - v.y) * k / v.k }; });
  const zoomBtn = (f: number) => { const r = svg.current!.getBoundingClientRect(); zoomAt(f, r.width / 2, r.height / 2); };
  useEffect(() => { fit(); }, []);
  useEffect(() => {
    const el = svg.current!;
    const f = (e: WheelEvent) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); };
    el.addEventListener('wheel', f, { passive: false });
    return () => el.removeEventListener('wheel', f);
  }, []);

  // ---- thao tác ----
  const placeNode = (type: string, c: { x: number; y: number }) => {
    const q = pRef.current, def = DEVICES[type];
    const n: N = { id: uid(), type, x: snap(c.x), y: snap(c.y), ...(type === 'text' ? { label: 'Văn bản', fs: 16 } : { label: `${def.name} ${q.nodes.filter(m => m.type === type).length + 1}` }) };
    edit(s => ({ ...s, nodes: [...s.nodes, n] })); setSelN([n.id]); setSelL(null);
    if (type === 'text') setEditId(n.id);
  };
  const add = (type: string, at?: { x: number; y: number }) => {
    const r = svg.current!.getBoundingClientRect();
    if (at) { if (at.x < r.left || at.x > r.right || at.y < r.top || at.y > r.bottom) return; placeNode(type, toWorld(at.x, at.y)); }
    else { const o = pRef.current.nodes.length % 6 * GRID; placeNode(type, toWorld(r.left + r.width / 2 + o, r.top + r.height / 2 + o)); }
  };
  const connect = (a: string, b: string) => {
    const q = pRef.current, na = q.nodes.find(n => n.id === a), nb = q.nodes.find(n => n.id === b);
    if (!na || !nb || a === b || isText(na) || isText(nb) || q.links.some(l => (l.a === a && l.b === b) || (l.a === b && l.b === a))) return;
    edit(s => ({ ...s, links: [...s.links, { id: uid(), a, b }] }));
  };
  const del = () => {
    if (selL) edit(q => ({ ...q, links: q.links.filter(l => l.id !== selL) }));
    else if (selN.length) edit(q => ({ nodes: q.nodes.filter(n => !selN.includes(n.id)), links: q.links.filter(l => !selN.includes(l.a) && !selN.includes(l.b)) }));
    clearSel();
  };
  const dup = () => {
    if (!selN.length) return;
    const q = pRef.current, map = new Map(selN.map(id => [id, uid()]));
    const nn = q.nodes.filter(n => map.has(n.id)).map(n => ({ ...n, id: map.get(n.id)!, x: n.x + 40, y: n.y + 40 }));
    const nl = q.links.filter(l => map.has(l.a) && map.has(l.b)).map(l => ({ id: uid(), a: map.get(l.a)!, b: map.get(l.b)! }));
    edit(s => ({ nodes: [...s.nodes, ...nn], links: [...s.links, ...nl] })); setSelN(nn.map(n => n.id)); setSelL(null);
  };
  const align = (kind: 'h' | 'v' | 'd') => {
    const ns = pRef.current.nodes.filter(n => selN.includes(n.id)); if (ns.length < 2) return;
    const avg = (f: (n: N) => number) => snap(ns.reduce((s, n) => s + f(n), 0) / ns.length);
    let upd: (n: N) => N;
    if (kind === 'h') { const y = avg(n => n.y); upd = n => ({ ...n, y }); }
    else if (kind === 'v') { const x = avg(n => n.x); upd = n => ({ ...n, x }); }
    else {
      const sp = (f: (n: N) => number) => Math.max(...ns.map(f)) - Math.min(...ns.map(f));
      const byX = sp(n => n.x) >= sp(n => n.y), g = (n: N) => (byX ? n.x : n.y);
      const s = [...ns].sort((a, b) => g(a) - g(b)), lo = g(s[0]), hi = g(s[s.length - 1]);
      const pos = new Map(s.map((n, i) => [n.id, snap(lo + (hi - lo) * i / (s.length - 1))]));
      upd = n => (byX ? { ...n, x: pos.get(n.id)! } : { ...n, y: pos.get(n.id)! });
    }
    edit(q => ({ ...q, nodes: q.nodes.map(n => (selN.includes(n.id) ? upd(n) : n)) }));
  };
  const loadTpl = (t: TemplateFile) => {
    if (p.nodes.length && !confirm('Thay thế sơ đồ hiện tại bằng mẫu này?')) return;
    edit(() => toProject(t)); clearSel(); setMode('2d'); setGallery(false); setTimeout(fit, 50);
  };
  const clear = () => { if (!p.nodes.length || confirm('Xóa toàn bộ sơ đồ và bắt đầu lại?')) { edit(() => empty); clearSel(); } };
  const patch = (k: 'label' | 'ip' | 'note', v: string) => selN.length === 1 && setP(q => ({ ...q, nodes: q.nodes.map(n => (n.id === selN[0] ? { ...n, [k]: v } : n)) }));
  const fsize = (d: number) => edit(q => ({ ...q, nodes: q.nodes.map(n => (selN.includes(n.id) && isText(n) ? { ...n, fs: Math.min(48, Math.max(10, (n.fs ?? 16) + d)) } : n)) }));
  const finishEdit = (id: string, v: string | null) => {
    setEditId(null);
    if (v && v.trim() && v.trim() !== pRef.current.nodes.find(n => n.id === id)?.label) edit(q => ({ ...q, nodes: q.nodes.map(n => (n.id === id ? { ...n, label: v.trim() } : n)) }));
  };

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,select') || mode === '3d' || gallery || dlg) return;
      const m = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (m && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (m && k === 'y') { e.preventDefault(); redo(); }
      else if (m && k === 'a') { e.preventDefault(); setSelN(pRef.current.nodes.map(n => n.id)); setSelL(null); }
      else if (m && k === 'd') { e.preventDefault(); dup(); }
      else if (k === 'delete' || k === 'backspace') del();
      else if ((k === 'enter' || k === 'f2') && selN.length === 1) { e.preventDefault(); setEditId(selN[0]); }
      else if (k === 'escape') { clearSel(); setTool('select'); setPend(null); }
      else if (k.startsWith('arrow') && selN.length) {
        e.preventDefault();
        const dx = k === 'arrowleft' ? -GRID : k === 'arrowright' ? GRID : 0, dy = k === 'arrowup' ? -GRID : k === 'arrowdown' ? GRID : 0;
        edit(q => ({ ...q, nodes: q.nodes.map(n => (selN.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)) }));
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  // ---- chuột / cảm ứng ----
  const nodeAt = (w: { x: number; y: number }, except?: string) =>
    pRef.current.nodes.find(n => n.id !== except && !isText(n) && Math.abs(n.x - w.x) <= W / 2 + 14 && Math.abs(n.y - w.y) <= H / 2 + 14);
  const down = (e: React.PointerEvent, kind: 'bg' | 'node' | 'port', id?: string) => {
    e.stopPropagation(); svg.current!.setPointerCapture(e.pointerId);
    const w = toWorld(e.clientX, e.clientY), multi = e.shiftKey || e.ctrlKey || e.metaKey;
    const base = { kind, id, cx: e.clientX, cy: e.clientY, moved: false, w, vx: view.x, vy: view.y, multi };
    if (kind === 'port') { drag.current = { ...base, kind: 'link' }; return; }
    if (kind === 'node') {
      const node = pRef.current.nodes.find(n => n.id === id)!;
      if (tool === 'link' && !isText(node)) {
        if (pend && pend !== id) { connect(pend, id!); setPend(null); drag.current = null; return; }
        drag.current = { ...base, kind: 'link' }; return;
      }
      let ids = selN;
      if (multi) ids = selN.includes(id!) ? selN.filter(x => x !== id) : [...selN, id!];
      else if (!selN.includes(id!)) ids = [id!];
      setSelN(ids); setSelL(null);
      drag.current = { ...base, kind: 'move', orig: Object.fromEntries(pRef.current.nodes.filter(n => ids.includes(n.id)).map(n => [n.id, { x: n.x, y: n.y }])) };
      return;
    }
    if (tool === 'text') { placeNode('text', w); setTool('select'); drag.current = null; return; }
    setPend(null);
    if (!multi) clearSel();
    drag.current = { ...base, kind: tool === 'area' || e.shiftKey ? 'marquee' : 'pan' };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.cx, dy = e.clientY - d.cy;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    const k = vRef.current.k, w = toWorld(e.clientX, e.clientY);
    if (d.kind === 'pan') setView(v => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
    else if (d.kind === 'move') {
      if (!d.moved) snapshot();
      const sx = snap(dx / k), sy = snap(dy / k);
      setP(q => ({ ...q, nodes: q.nodes.map(n => (d.orig[n.id] ? { ...n, x: d.orig[n.id].x + sx, y: d.orig[n.id].y + sy } : n)) }));
    } else if (d.kind === 'marquee') setMarq({ x0: d.w.x, y0: d.w.y, x1: w.x, y1: w.y });
    else { setTmp({ ...w, from: d.id }); setHot(nodeAt(w, d.id)?.id ?? null); }
    d.moved = true;
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d) return;
    const w = toWorld(e.clientX, e.clientY);
    if (d.kind === 'link') {
      setTmp(null); setHot(null);
      if (d.moved) { const t = nodeAt(w, d.id); if (t) connect(d.id, t.id); }
      else if (tool === 'link') setPend(d.id);
    } else if (d.kind === 'marquee') {
      setMarq(null);
      if (d.moved) {
        const [x0, x1] = [Math.min(d.w.x, w.x), Math.max(d.w.x, w.x)], [y0, y1] = [Math.min(d.w.y, w.y), Math.max(d.w.y, w.y)];
        const ids = pRef.current.nodes.filter(n => n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1).map(n => n.id);
        setSelN(d.multi ? [...new Set([...selN, ...ids])] : ids);
      }
    } else if (d.kind === 'move' && !d.moved) {
      if (!d.multi) setSelN([d.id]);
      const now = Date.now();
      if (lastTap.current.id === d.id && now - lastTap.current.t < 350) { setEditId(d.id); lastTap.current = { id: '', t: 0 }; }
      else lastTap.current = { id: d.id, t: now };
    }
  };

  // ---- lưu / mở / xuất ----
  const exportStr = async (ip: boolean) => {
    const ns = pRef.current.nodes; if (!ns.length) return null;
    clearSel(); await new Promise(r => setTimeout(r, 50));
    const g = content.current!.cloneNode(true) as SVGGElement;
    g.querySelectorAll('.ui').forEach(x => x.remove());
    if (!ip) g.querySelectorAll('.ip').forEach(x => x.remove());
    const pad = 40, x0 = Math.min(...ns.map(n => n.x)) - W / 2 - pad, y0 = Math.min(...ns.map(n => n.y)) - H / 2 - pad;
    const w = Math.max(...ns.map(n => n.x)) + W / 2 + pad - x0, h = Math.max(...ns.map(n => n.y)) + H / 2 + (ip ? 46 : 30) + pad - y0;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="${w}" height="${h}" font-family="system-ui,sans-serif"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#fff"/>${g.innerHTML}</svg>`;
  };
  const exportHtml3d = async (o: ExportOpts) => {
    const rt = (await import('./generated/viewerRuntime')).default.replace(/<\/script/gi, '<\\/script');
    const nodes = p.nodes.filter(n => !isText(n)).map(({ id, type, label, x, y, ip, note }) => ({ id, type, label, x, y, ...(o.ip && ip ? { ip } : {}), ...(o.note && note ? { note } : {}) }));
    const data = JSON.stringify({ nodes, links: p.links }).replace(/</g, '\\u003c');
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sơ đồ mạng 3D</title><style>html,body{margin:0;height:100%}#v{position:fixed;inset:0}</style></head><body><div id="v"></div><script>window.__NET__=${data};</script><script>${rt}</script></body></html>`;
    download(new Blob([html], { type: 'text/html' }), 'network-3d.html');
  };
  const doExport = async (kind: ExportKind, o: ExportOpts) => {
    setDlg(false);
    if (!p.nodes.length) return;
    if (kind === 'html3d') return exportHtml3d(o);
    const s = await exportStr(o.ip); if (!s) return;
    if (kind === 'svg') return download(new Blob([s], { type: 'image/svg+xml' }), 'network.svg');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'), k = 2;
      c.width = img.width * k; c.height = img.height * k;
      const x = c.getContext('2d')!; x.scale(k, k); x.drawImage(img, 0, 0);
      c.toBlob(b => b && download(b, 'network.png'));
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  };
  const saveJson = () => download(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }), 'network.json');
  const openJson = async (f?: File) => {
    if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!valid(d)) throw 0; edit(() => d); clearSel(); setTimeout(fit, 50); }
    catch { alert('File không hợp lệ'); }
    if (file.current) file.current.value = '';
  };

  // ---- giao diện ----
  const by = Object.fromEntries(p.nodes.map(n => [n.id, n]));
  const cur = selN.length === 1 ? by[selN[0]] : null;
  const ed = editId ? by[editId] : null;
  const hasSel = selN.length > 0 || selL;
  const showPorts = (n: N) => tool === 'select' && !isText(n) && !drag.current?.moved && (hover === n.id || (selN.length === 1 && selN[0] === n.id));
  return (
    <div className="app">
      <header>
        <b>🌐 NetDesign</b>
        <button onClick={clear} title="Xóa hết và vẽ sơ đồ mới">📄<span className="lbl"> Mới</span></button>
        <button onClick={() => file.current?.click()} title="Mở file .json đã lưu">📂<span className="lbl"> Mở file</span></button>
        <button onClick={saveJson} title="Tải sơ đồ về máy dạng .json (app cũng tự lưu trong trình duyệt)">💾<span className="lbl"> Lưu file</span></button>
        <i className="sep" />
        <button onClick={() => setGallery(true)} title="Chọn sơ đồ mẫu có sẵn">📚<span className="lbl"> Mẫu</span></button>
        <i className="sep" />
        <button onClick={undo} title="Ctrl+Z">↶<span className="lbl"> Hoàn tác</span></button>
        <button onClick={redo} title="Ctrl+Y">↷<span className="lbl"> Làm lại</span></button>
        <i className="sep" />
        <button className={mode === '3d' ? 'act' : ''} onClick={toggle3d} title="Xem sơ đồ dạng 3D, xoay nhiều hướng">{mode === '3d' ? '✏️' : '🧊'}<span className="lbl">{mode === '3d' ? ' Quay về vẽ 2D' : ' Xem 3D'}</span></button>
        <button onClick={() => p.nodes.length && setDlg(true)} title="Xuất ảnh PNG, SVG hoặc file HTML 3D">⬇<span className="lbl"> Xuất</span></button>
        <input ref={file} type="file" accept=".json" hidden onChange={e => openJson(e.target.files?.[0])} />
      </header>

      <Library onAdd={add} disabled={mode === '3d'} />

      <main>
        <svg ref={svg} className="cv" style={{ cursor: tool === 'text' ? 'text' : tool === 'select' ? 'default' : 'crosshair' }}
          onPointerDown={e => down(e, 'bg')} onPointerMove={move} onPointerUp={up}>
          <defs>
            <pattern id="dots" width={GRID * view.k} height={GRID * view.k} x={view.x} y={view.y} patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#cbd5e1" /></pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            <g ref={content}>
              {p.links.map(l => {
                const a = by[l.a], b = by[l.b]; if (!a || !b) return null;
                const s = selL === l.id;
                return (
                  <g key={l.id}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s ? BLUE : '#475569'} strokeWidth={s ? 3 : 2} />
                    <line className="ui" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={16} style={{ cursor: 'pointer' }}
                      onPointerDown={e => { e.stopPropagation(); setSelL(l.id); setSelN([]); }} />
                  </g>
                );
              })}
              {p.nodes.map(n => {
                const s = selN.includes(n.id), ev = { onPointerDown: (e: React.PointerEvent) => down(e, 'node', n.id), onPointerEnter: () => setHover(n.id), onPointerLeave: () => setHover(null) };
                if (isText(n)) {
                  const fs = n.fs ?? 16, w = tw(n);
                  return (
                    <g key={n.id} {...ev} style={{ cursor: 'move' }}>
                      <rect className="ui" x={n.x - w / 2} y={n.y - fs} width={w} height={fs * 2} rx={6} fill="transparent" stroke={s ? BLUE : 'none'} strokeDasharray="4 3" />
                      <text x={n.x} y={n.y} fontSize={fs} fontWeight={600} textAnchor="middle" dominantBaseline="central" fill="#0f172a">{n.label}</text>
                    </g>
                  );
                }
                const d = DEVICES[n.type] ?? DEVICES.pc;
                const stroke = hot === n.id ? '#16a34a' : pend === n.id ? '#f59e0b' : s ? BLUE : d.color;
                return (
                  <g key={n.id} {...ev} style={{ cursor: tool === 'link' ? 'crosshair' : 'grab' }}>
                    <rect x={n.x - W / 2} y={n.y - H / 2} width={W} height={H} rx={12} fill={d.color + '1a'} stroke={stroke} strokeWidth={s || hot === n.id || pend === n.id ? 3 : 2} />
                    <rect x={n.x - W / 2 + 1} y={n.y - H / 2 + 1} width={W - 2} height={H - 2} rx={11} fill="#fff" fillOpacity={0.85} />
                    <text x={n.x} y={n.y + 10} fontSize={30} textAnchor="middle">{d.icon}</text>
                    <text x={n.x} y={n.y + H / 2 + 16} fontSize={13} textAnchor="middle" fill="#0f172a">{n.label}</text>
                    {n.ip && <text className="ip" x={n.x} y={n.y + H / 2 + 31} fontSize={11} textAnchor="middle" fill="#64748b">{n.ip}</text>}
                    {showPorts(n) && [[W / 2, 0], [-W / 2, 0], [0, -H / 2], [0, H / 2]].map(([px, py]) => (
                      <circle key={px + ',' + py} className="ui" cx={n.x + px} cy={n.y + py} r={8} fill={BLUE} stroke="#fff" strokeWidth={2}
                        style={{ cursor: 'crosshair' }} onPointerDown={e => down(e, 'port', n.id)} />
                    ))}
                  </g>
                );
              })}
            </g>
            {tmp && by[tmp.from] && <line x1={by[tmp.from].x} y1={by[tmp.from].y} x2={tmp.x} y2={tmp.y} stroke={BLUE} strokeWidth={2} strokeDasharray="6 4" pointerEvents="none" />}
            {marq && <rect x={Math.min(marq.x0, marq.x1)} y={Math.min(marq.y0, marq.y1)} width={Math.abs(marq.x1 - marq.x0)} height={Math.abs(marq.y1 - marq.y0)} fill="#2563eb22" stroke={BLUE} strokeDasharray="4 3" pointerEvents="none" />}
          </g>
        </svg>

        {mode === '2d' && <>
          <div className="rail">
            {TOOLS.map(([t, ic, name, tip]) => (
              <button key={t} className={tool === t ? 'on' : ''} title={tip} onClick={() => { setTool(t); setPend(null); }}><span>{ic}</span><span>{name}</span></button>
            ))}
          </div>
          <div className="tipbar">{tool === 'link' && pend ? 'Bấm thiết bị thứ hai để nối dây (Esc để hủy)' : TIPS[tool]}</div>
          <div className="zoom">
            <button onClick={() => zoomBtn(1 / 1.25)} title="Thu nhỏ">−</button>
            <span>{Math.round(view.k * 100)}%</span>
            <button onClick={() => zoomBtn(1.25)} title="Phóng to">+</button>
            <button onClick={fit} title="Thu phóng vừa toàn bộ sơ đồ">Vừa khung</button>
          </div>
          {!p.nodes.length && <div className="hint"><div><b>Bắt đầu vẽ sơ đồ mạng</b><br />① Kéo thiết bị từ cột bên trái vào đây<br />② Kéo từ chấm tròn quanh thiết bị để nối dây<br />③ Bấm đúp vào thiết bị để đổi tên<br /><button className="pri" onClick={() => setGallery(true)}>📚 Hoặc chọn một sơ đồ mẫu</button></div></div>}
          {ed && <EditBox key={ed.id} value={ed.label} left={view.x + ed.x * view.k} top={view.y + (isText(ed) ? ed.y : ed.y + H / 2 + 10) * view.k}
            width={Math.max(110, isText(ed) ? tw(ed) : W + 40) * view.k} size={Math.max(11, (isText(ed) ? ed.fs ?? 16 : 13) * view.k)} onDone={v => finishEdit(ed.id, v)} />}
          {hasSel && !ed && (
            <div className="bar">
              {selL && <><span>Đường nối</span><button className="danger" onClick={del}>🗑 Xóa dây</button></>}
              {cur && <>
                <label>Tên<input value={cur.label} maxLength={40} onFocus={snapshot} onChange={e => patch('label', e.target.value)} /></label>
                {isText(cur)
                  ? <label>Cỡ chữ<span className="row2"><button onClick={() => fsize(-2)}>A−</button><button onClick={() => fsize(2)}>A+</button></span></label>
                  : <><label>Địa chỉ IP<input value={cur.ip ?? ''} placeholder="192.168.1.1" maxLength={60} onFocus={snapshot} onChange={e => patch('ip', e.target.value)} /></label>
                    <label>Ghi chú<input value={cur.note ?? ''} maxLength={200} onFocus={snapshot} onChange={e => patch('note', e.target.value)} /></label></>}
              </>}
              {selN.length > 1 && <>
                <span>Đã chọn {selN.length} mục</span>
                <button onClick={() => align('h')} title="Đưa về cùng một hàng ngang">⇔ Căn hàng ngang</button>
                <button onClick={() => align('v')} title="Đưa về cùng một cột dọc">⇕ Căn cột dọc</button>
                <button onClick={() => align('d')} title="Chia đều khoảng cách">↔ Chia đều</button>
              </>}
              {selN.length > 0 && <><button onClick={dup} title="Ctrl+D">⧉ Nhân bản</button><button className="danger" onClick={del} title="Delete">🗑 Xóa</button></>}
            </div>
          )}
        </>}
        {mode === '3d' && <div ref={v3} className="v3" />}
      </main>
      {gallery && <TemplateGallery project={p} onLoad={loadTpl} onClose={() => setGallery(false)} />}
      {dlg && <ExportDialog onClose={() => setDlg(false)} onExport={doExport} />}
    </div>
  );
}
