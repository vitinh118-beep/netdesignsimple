// Tự phát hiện mọi file src/data/templates/*.json (trừ file bắt đầu bằng "_"). Thêm file = thêm mẫu.
import { DEVICES } from './catalog';
import { validateTemplate, type TemplateFile } from './templateValidator';
import { uid, type P } from '../util';

export interface Tpl extends TemplateFile { source: 'official' | 'mine'; imageUrl?: string }
export const KEYS = Object.keys(DEVICES);

const files = import.meta.glob(['./templates/*.json', '!./templates/_*.json'], { eager: true, import: 'default' }) as Record<string, unknown>;
const imgs = import.meta.glob('./templates/*.{png,jpg,jpeg,webp,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const loadErrors: string[] = [];
const list: Tpl[] = [], seen = new Set<string>();
for (const [path, raw] of Object.entries(files)) {
  const file = path.split('/').pop()!, r = validateTemplate(raw, KEYS);
  const fail = (m: string) => { loadErrors.push(`${file}: ${m}`); console.warn(`[Mẫu bị bỏ qua] ${file}: ${m}`); };
  if (!r.ok) { fail(r.errors.join('; ')); continue; }
  if (seen.has(r.value.id)) { fail(`id "${r.value.id}" bị trùng với mẫu khác`); continue; }
  seen.add(r.value.id);
  const base = file.replace(/\.json$/, '');
  const img = Object.keys(imgs).find(p => { const f = p.split('/').pop()!; return r.value.image ? f === r.value.image : f.replace(/\.[^.]+$/, '') === base; });
  list.push({ ...r.value, source: 'official', imageUrl: img ? imgs[img] : undefined });
}
export const OFFICIAL = list.sort((a, b) => a.category.localeCompare(b.category, 'vi') || a.name.localeCompare(b.name, 'vi'));

export const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export function toProject(t: TemplateFile): P {
  const ids = new Map(t.devices.map(d => [d.ref, uid()]));
  return {
    nodes: t.devices.map(d => ({ id: ids.get(d.ref)!, type: d.type, label: d.label, x: d.x, y: d.y, ...(d.ip ? { ip: d.ip } : {}), ...(d.note ? { note: d.note } : {}) })),
    links: t.connections.map(c => ({ id: uid(), a: ids.get(c.from)!, b: ids.get(c.to)! })),
  };
}
export function fromProject(p: P, m: { id: string; name: string; description: string; category: string }): TemplateFile {
  const ref = new Map(p.nodes.map((n, i) => [n.id, `d${i + 1}`]));
  return {
    ...m, version: 1,
    devices: p.nodes.map(n => ({ ref: ref.get(n.id)!, type: n.type, label: n.label.slice(0, 40) || n.type, x: n.x, y: n.y, ...(n.ip ? { ip: n.ip.slice(0, 60) } : {}), ...(n.note ? { note: n.note.slice(0, 200) } : {}) })),
    connections: p.links.filter(l => ref.has(l.a) && ref.has(l.b)).map(l => ({ from: ref.get(l.a)!, to: ref.get(l.b)! })),
  };
}
