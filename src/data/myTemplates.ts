// Mẫu cá nhân: lưu trong localStorage của trình duyệt (không cần máy chủ).
import { KEYS, type Tpl } from './templateRegistry';
import { LIMITS, validateTemplate, type Result } from './templateValidator';

const KEY = 'netdesign-lite:mytpl:v1';
export const loadMine = (): Tpl[] => {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(a) ? a.flatMap(x => { const r = validateTemplate(x, KEYS); return r.ok ? [{ ...r.value, source: 'mine' as const }] : []; }) : [];
  } catch { return []; }
};
export const saveMine = (l: Tpl[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(l.map(({ source, imageUrl, ...t }) => t))); } catch { /* đầy bộ nhớ */ }
};
export function parseTemplateFile(text: string): Result {
  if (text.length > LIMITS.bytes) return { ok: false, errors: [`File quá lớn (tối đa ${LIMITS.bytes / 1000} KB)`] };
  try { return validateTemplate(JSON.parse(text), KEYS); } catch { return { ok: false, errors: ['Không phải file JSON hợp lệ'] }; }
}
