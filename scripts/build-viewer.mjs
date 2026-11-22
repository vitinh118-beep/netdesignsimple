// Đóng gói bộ xem 3D (three.js + dữ liệu thiết bị) thành 1 chuỗi JS để nhúng vào file HTML xuất ra.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
const r = await build({
  entryPoints: ['src/viewer3d/standalone.ts'], bundle: true, minify: true, write: false,
  format: 'iife', target: 'es2020', legalComments: 'none',
});
mkdirSync('src/generated', { recursive: true });
writeFileSync('src/generated/viewerRuntime.ts', 'export default ' + JSON.stringify(r.outputFiles[0].text) + ';\n');
console.log('viewer runtime:', Math.round(r.outputFiles[0].text.length / 1024), 'KB');
