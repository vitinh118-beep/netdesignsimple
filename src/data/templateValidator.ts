// Kiểm tra 1 file mẫu. Không import gì từ app để chạy được cả khi build (scripts/check-templates.mjs).
export interface TemplateDevice { ref: string; type: string; label: string; x: number; y: number; ip?: string; note?: string }
export interface TemplateFile {
  id: string; name: string; description: string; category: string; version: number; image?: string;
  devices: TemplateDevice[]; connections: { from: string; to: string; cableType?: string }[];
}
export const LIMITS = { devices: 200, bytes: 300_000 };
export type Result = { ok: true; value: TemplateFile } | { ok: false; errors: string[] };

const str = (v: unknown, max: number, min = 1): v is string => typeof v === 'string' && v.trim().length >= min && v.length <= max;
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 100000;

export function validateTemplate(raw: unknown, deviceKeys: string[]): Result {
  const r = raw as any, e: string[] = [];
  if (!r || typeof r !== 'object' || Array.isArray(r)) return { ok: false, errors: ['Nội dung file phải là một object JSON { ... }'] };
  if (typeof r.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,59}$/.test(r.id)) e.push('"id" bắt buộc: chữ thường không dấu, số, dấu gạch ngang, 2–60 ký tự (vd "office-20-users")');
  if (!str(r.name, 60)) e.push('"name" (tên mẫu) bắt buộc, tối đa 60 ký tự');
  if (!str(r.description, 200)) e.push('"description" (mô tả) bắt buộc, tối đa 200 ký tự');
  if (r.category !== undefined && !str(r.category, 40)) e.push('"category" nếu có phải là chuỗi tối đa 40 ký tự');
  if (r.image !== undefined && !str(r.image, 100)) e.push('"image" nếu có phải là tên file ảnh nằm cùng thư mục');
  const refs = new Set<string>();
  if (!Array.isArray(r.devices) || !r.devices.length) e.push('"devices" phải là danh sách có ít nhất 1 thiết bị');
  else if (r.devices.length > LIMITS.devices) e.push(`"devices" tối đa ${LIMITS.devices} thiết bị`);
  else r.devices.forEach((d: any, i: number) => {
    const w = `devices[${i + 1}]`;
    if (!d || typeof d !== 'object') return e.push(`${w}: phải là object`);
    if (typeof d.ref !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(d.ref)) e.push(`${w}: "ref" bắt buộc (chữ/số/_/-, tối đa 40 ký tự)`);
    else if (refs.has(d.ref)) e.push(`${w}: "ref" "${d.ref}" bị trùng`);
    else refs.add(d.ref);
    if (!deviceKeys.includes(d.type)) e.push(`${w}: "type" "${d.type}" không có trong catalog (hợp lệ: ${deviceKeys.join(', ')})`);
    if (!str(d.label, 40)) e.push(`${w}: "label" bắt buộc, tối đa 40 ký tự`);
    if (!num(d.x) || !num(d.y)) e.push(`${w}: "x", "y" phải là số`);
    if (d.ip !== undefined && !str(d.ip, 60, 0)) e.push(`${w}: "ip" tối đa 60 ký tự`);
    if (d.note !== undefined && !str(d.note, 200, 0)) e.push(`${w}: "note" tối đa 200 ký tự`);
  });
  if (r.connections !== undefined && !Array.isArray(r.connections)) e.push('"connections" phải là danh sách');
  else {
    const seen = new Set<string>();
    (r.connections ?? []).forEach((c: any, i: number) => {
      const w = `connections[${i + 1}]`;
      if (!c || !refs.has(c.from) || !refs.has(c.to)) return e.push(`${w}: "from"/"to" phải là "ref" của một thiết bị có trong "devices"`);
      if (c.from === c.to) return e.push(`${w}: không nối thiết bị với chính nó`);
      const k = [c.from, c.to].sort().join('|');
      if (seen.has(k)) e.push(`${w}: cặp ${c.from} – ${c.to} bị khai báo trùng`); else seen.add(k);
    });
  }
  if (e.length) return { ok: false, errors: e };
  return { ok: true, value: {
    id: r.id, name: r.name.trim(), description: r.description.trim(), category: r.category?.trim() || 'Khác',
    version: typeof r.version === 'number' ? r.version : 1, ...(r.image ? { image: r.image } : {}),
    devices: r.devices.map((d: any) => ({ ref: d.ref, type: d.type, label: d.label, x: d.x, y: d.y, ...(d.ip ? { ip: d.ip } : {}), ...(d.note ? { note: d.note } : {}) })),
    connections: (r.connections ?? []).map((c: any) => ({ from: c.from, to: c.to, ...(c.cableType ? { cableType: String(c.cableType) } : {}) })),
  } };
}
