import { useRef, useState } from 'react';
import { DEVICES } from '../data/catalog';
import { OFFICIAL, KEYS, loadErrors, fromProject, slug, type Tpl } from '../data/templateRegistry';
import { loadMine, saveMine, parseTemplateFile } from '../data/myTemplates';
import { validateTemplate, type TemplateFile } from '../data/templateValidator';
import { download, type P } from '../util';

function Preview({ t }: { t: TemplateFile }) {
  const xs = t.devices.map(d => d.x), ys = t.devices.map(d => d.y), pad = 50;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const at = Object.fromEntries(t.devices.map(d => [d.ref, d]));
  return (
    <svg viewBox={`${x0} ${y0} ${Math.max(...xs) - x0 + pad} ${Math.max(...ys) - y0 + pad}`} className="pv">
      {t.connections.map((c, i) => <line key={i} x1={at[c.from].x} y1={at[c.from].y} x2={at[c.to].x} y2={at[c.to].y} stroke="#94a3b8" strokeWidth={5} />)}
      {t.devices.map(d => (
        <g key={d.ref}><circle cx={d.x} cy={d.y} r={30} fill="#fff" stroke={DEVICES[d.type].color} strokeWidth={6} />
          <text x={d.x} y={d.y + 11} fontSize={32} textAnchor="middle">{DEVICES[d.type].icon}</text></g>
      ))}
    </svg>
  );
}

const strip = ({ source, imageUrl, ...t }: Tpl): TemplateFile => t;

export default function TemplateGallery({ project, onLoad, onClose }: { project: P; onLoad: (t: TemplateFile) => void; onClose: () => void }) {
  const [mine, setMine] = useState<Tpl[]>(loadMine);
  const [tab, setTab] = useState<'list' | 'save'>('list');
  const [q, setQ] = useState(''), [cat, setCat] = useState(''), [msg, setMsg] = useState('');
  const [f, setF] = useState({ name: '', description: '', category: 'Của tôi' });
  const file = useRef<HTMLInputElement>(null);
  const all = [...OFFICIAL, ...mine];
  const cats = [...new Set(all.map(t => t.category))];
  const shown = all.filter(t => (!cat || t.category === cat) && (t.name + ' ' + t.description).toLowerCase().includes(q.toLowerCase()));

  const upd = (l: Tpl[]) => { setMine(l); saveMine(l); };
  const uniq = (id: string) => { let n = id, i = 2; while (all.some(t => t.id === n)) n = `${id}-${i++}`; return n; };

  const importFile = async (fl?: File) => {
    if (!fl) return;
    const r = parseTemplateFile(await fl.text());
    if (file.current) file.current.value = '';
    if (!r.ok) return setMsg(`❌ ${fl.name}: ${r.errors.join('; ')}`);
    upd([...mine, { ...r.value, id: uniq(r.value.id), source: 'mine' }]);
    setMsg(`✅ Đã nhập mẫu "${r.value.name}"`);
  };
  const build = () => validateTemplate(fromProject(project, { id: slug(f.name) || 'mau', name: f.name, description: f.description, category: f.category.trim() || 'Của tôi' }), KEYS);
  const saveHere = () => {
    const r = build(); if (!r.ok) return setMsg('❌ ' + r.errors.join('; '));
    upd([...mine, { ...r.value, id: uniq(r.value.id), source: 'mine' }]);
    setMsg(`✅ Đã lưu "${r.value.name}" vào mẫu của tôi`); setTab('list');
  };
  const saveFile = () => {
    const r = build(); if (!r.ok) return setMsg('❌ ' + r.errors.join('; '));
    download(new Blob([JSON.stringify(r.value, null, 2)], { type: 'application/json' }), r.value.id + '.json');
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="dlg wide" onClick={e => e.stopPropagation()}>
        <div className="dh"><b>📚 Thư viện mẫu</b><button onClick={onClose}>✕</button></div>
        <div className="tabs">
          <button className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>Chọn mẫu ({all.length})</button>
          <button className={tab === 'save' ? 'on' : ''} onClick={() => setTab('save')}>Lưu bản vẽ thành mẫu</button>
          <button onClick={() => file.current?.click()}>⬆ Nhập mẫu từ file</button>
          <input ref={file} type="file" accept=".json" hidden onChange={e => importFile(e.target.files?.[0])} />
        </div>
        {msg && <div className="msg">{msg}</div>}

        {tab === 'list' ? <>
          <div className="tools">
            <input placeholder="Tìm mẫu…" value={q} onChange={e => setQ(e.target.value)} />
            <select value={cat} onChange={e => setCat(e.target.value)}><option value="">Tất cả nhóm</option>{cats.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="cards">
            {shown.map(t => (
              <div key={t.source + t.id} className="card" onClick={() => onLoad(t)}>
                {t.imageUrl ? <img src={t.imageUrl} alt={t.name} className="pv" /> : <Preview t={t} />}
                <b>{t.name}</b>
                <span className="desc">{t.description}</span>
                <small>{t.category} · {t.devices.length} thiết bị {t.source === 'mine' && <i className="badge">Của tôi</i>}</small>
                {t.source === 'mine' && <div className="row">
                  <button onClick={e => { e.stopPropagation(); download(new Blob([JSON.stringify(strip(t), null, 2)], { type: 'application/json' }), t.id + '.json'); }}>Xuất file</button>
                  <button onClick={e => { e.stopPropagation(); if (confirm(`Xóa mẫu "${t.name}"?`)) upd(mine.filter(m => m !== t)); }}>Xóa</button>
                </div>}
              </div>
            ))}
            {!shown.length && <p className="empty">Không có mẫu phù hợp.</p>}
          </div>
          {loadErrors.length > 0 && <details className="warn"><summary>⚠ {loadErrors.length} mẫu chính thức bị lỗi nên không hiển thị (dành cho admin)</summary>{loadErrors.map(e => <div key={e}>{e}</div>)}</details>}
        </> : (
          <div className="form">
            <p>Lưu sơ đồ đang vẽ ({project.nodes.length} thiết bị) thành mẫu. Lưu vào trình duyệt này, hoặc tải file <code>.json</code> để gửi admin đưa vào thư viện chính thức.</p>
            <label>Tên mẫu *<input value={f.name} maxLength={60} onChange={e => setF({ ...f, name: e.target.value })} /></label>
            <label>Mô tả *<input value={f.description} maxLength={200} placeholder="Mẫu này dùng cho trường hợp nào" onChange={e => setF({ ...f, description: e.target.value })} /></label>
            <label>Nhóm<input value={f.category} maxLength={40} list="cats" onChange={e => setF({ ...f, category: e.target.value })} /></label>
            <datalist id="cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
            <div className="row"><button className="pri" disabled={!project.nodes.length} onClick={saveHere}>Lưu vào mẫu của tôi</button>
              <button disabled={!project.nodes.length} onClick={saveFile}>Tải file .json</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
