// Kiểm tra mọi file mẫu trước khi build. Sai -> build dừng, Vercel giữ nguyên bản đang chạy.
import { build } from 'esbuild';
import { readdirSync, readFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = resolve('scripts/.check.tmp.mjs');
await build({
  stdin: { contents: "export {validateTemplate} from './src/data/templateValidator'; export {DEVICES} from './src/data/catalog';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
});
const { validateTemplate, DEVICES } = await import(pathToFileURL(out).href);
rmSync(out);

const dir = 'src/data/templates';
const files = readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
const ids = new Map(); let bad = 0;
for (const f of files) {
  const problems = [], warns = [];
  let raw; try { raw = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); } catch (e) { problems.push('Không phải JSON hợp lệ: ' + e.message); }
  if (raw) {
    const r = validateTemplate(raw, Object.keys(DEVICES));
    if (!r.ok) problems.push(...r.errors);
    else {
      if (ids.has(r.value.id)) problems.push(`id "${r.value.id}" trùng với ${ids.get(r.value.id)}`); else ids.set(r.value.id, f);
      if (r.value.id !== f.replace(/\.json$/, '')) warns.push(`nên đặt tên file trùng id ("${r.value.id}.json")`);
      if (r.value.image && !existsSync(`${dir}/${r.value.image}`)) problems.push(`"image" trỏ tới file không tồn tại: ${r.value.image}`);
    }
  }
  for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'svg']) {
    const p = `${dir}/${f.replace(/\.json$/, '')}.${ext}`;
    if (existsSync(p) && statSync(p).size > 300_000) warns.push(`ảnh ${p.split('/').pop()} nặng ${Math.round(statSync(p).size / 1000)} KB (nên < 300 KB)`);
  }
  if (problems.length) { bad++; console.error(`✗ ${f}\n${problems.map(x => '    - ' + x).join('\n')}`); }
  else console.log(`✓ ${f}${warns.length ? '  ⚠ ' + warns.join('; ') : ''}`);
}
console.log(`\n${files.length - bad}/${files.length} mẫu hợp lệ.`);
if (bad) { console.error(`\n${bad} mẫu lỗi, sửa rồi chạy lại.`); process.exit(1); }
