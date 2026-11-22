// Bộ xem 3D chỉ-đọc: dùng chung cho tab "Xem 3D" trong app và file HTML xuất ra.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DEVICES } from '../data/catalog';

export interface NetData {
  nodes: { id: string; type: string; label: string; x: number; y: number; ip?: string; note?: string }[];
  links: { id: string; a: string; b: string }[];
}
const S = 1 / 40; // 1 đơn vị 3D = 40px trên sơ đồ 2D

const CSS = `.nd3{position:relative;width:100%;height:100%;overflow:hidden;background:#eef2f7;font:13px system-ui,sans-serif}
.nd3 canvas{display:block}.nd3bar{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;max-width:94%;gap:6px;background:#fff;padding:6px;border-radius:10px;box-shadow:0 2px 12px #0003}
.nd3bar button{border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;padding:5px 10px;cursor:pointer}.nd3bar button.on{background:#2563eb;color:#fff;border-color:#2563eb}
.nd3tip{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);color:#64748b;font-size:12px;white-space:nowrap}
.nd3msg{display:grid;place-items:center;height:100%;color:#64748b}`;

const mat = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.1 });

/** Dựng thiết bị bằng vài khối đơn giản. Trả về nhóm + chiều cao (để đặt nhãn). */
function shape(kind: string, color: string) {
  const g = new THREE.Group(), m = mat(color), dk = mat('#334155');
  const add = (geo: THREE.BufferGeometry, mm: THREE.Material, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(geo, mm); o.position.set(x, y, z); g.add(o); return o;
  };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mm = m) => add(new THREE.BoxGeometry(w, h, d), mm, x, y + h / 2, z);
  let h = 1;
  switch (kind) {
    case 'flat': box(2, 0.4, 1.2, 0, 0, 0); box(1.4, 0.06, 0.2, 0, 0.4, 0.35, dk); h = 0.7; break;
    case 'tall': box(1.2, 1.8, 1.2, 0, 0, 0); box(0.9, 0.08, 0.1, 0, 1.2, 0.6, dk); box(0.9, 0.08, 0.1, 0, 0.9, 0.6, dk); h = 1.8; break;
    case 'disc': add(new THREE.CylinderGeometry(0.65, 0.65, 0.18, 24), m, 0, 0.09, 0); add(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12), dk, 0, 0.33, 0); h = 0.6; break;
    case 'cloud': for (const [x, y, r] of [[0, 0.6, 0.6], [0.65, 0.45, 0.45], [-0.65, 0.45, 0.45]]) add(new THREE.SphereGeometry(r, 20, 14), m, x, y, 0); h = 1.3; break;
    case 'desk': box(1.2, 0.08, 0.8, 0, 0, 0, dk); box(0.15, 0.4, 0.15, 0, 0.08, 0, dk); box(1.2, 0.75, 0.1, 0, 0.48, 0); h = 1.3; break;
    case 'cam': add(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), dk, 0, 0.45, 0); box(0.45, 0.4, 0.9, 0, 0.9, 0.2); add(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12).rotateX(Math.PI / 2), dk, 0, 1.1, 0.68); h = 1.4; break;
    default: box(1.2, 0.9, 1.2, 0, 0, 0); h = 0.9;
  }
  return { g, h };
}

function label(lines: string[], icon: string) {
  const c = document.createElement('canvas'), x = c.getContext('2d')!;
  const fonts = ['bold 26px system-ui,sans-serif', '20px system-ui,sans-serif', 'italic 18px system-ui,sans-serif'];
  const H = 56 + (lines.length - 1) * 26;
  const tw = Math.max(...lines.map((t, i) => { x.font = fonts[i]; return x.measureText(t).width; }));
  const W = Math.ceil(tw) + 76;
  c.width = W; c.height = H;
  x.fillStyle = 'rgba(255,255,255,.93)'; x.beginPath(); x.roundRect(0, 4, W, H - 8, 14); x.fill();
  x.font = '30px system-ui,sans-serif'; x.textBaseline = 'middle'; x.fillText(icon, 12, 30);
  lines.forEach((t, i) => { x.font = fonts[i]; x.fillStyle = i ? '#64748b' : '#0f172a'; x.fillText(t, 56, i ? 36 + i * 24 : 30); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
  s.scale.set(0.6 * W / 56, 0.6 * H / 56, 1); s.renderOrder = 10;
  return { s, extra: (H - 56) / 56 * 0.3 };
}

/** Gắn bộ xem 3D vào phần tử el. Trả về hàm dọn dẹp. */
export function mount(el: HTMLElement, data: NetData) {
  if (!document.getElementById('nd3css')) { const st = document.createElement('style'); st.id = 'nd3css'; st.textContent = CSS; document.head.appendChild(st); }
  data = { ...data, nodes: data.nodes.filter(n => n.type !== 'text') }; // chữ chú thích chỉ có ở 2D
  el.innerHTML = ''; el.classList.add('nd3');
  if (!data.nodes.length) { el.innerHTML = '<div class="nd3msg">Chưa có thiết bị nào để hiển thị</div>'; return () => {}; }

  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch { el.innerHTML = '<div class="nd3msg">Trình duyệt không hỗ trợ WebGL</div>'; return () => {}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene(); scene.background = new THREE.Color('#eef2f7');
  scene.add(new THREE.HemisphereLight('#ffffff', '#94a3b8', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(8, 14, 6); scene.add(sun);

  // vị trí: tâm sơ đồ về gốc toạ độ
  const xs = data.nodes.map(n => n.x), ys = data.nodes.map(n => n.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const pos = (n: { x: number; y: number }, y = 0) => new THREE.Vector3((n.x - cx) * S, y, (n.y - cy) * S);
  const radius = Math.max(4, ...data.nodes.map(n => Math.hypot((n.x - cx) * S, (n.y - cy) * S))) + 2;

  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.25, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f8fafc' }));
  floor.position.y = -0.01; scene.add(floor);
  const grid = new THREE.GridHelper(radius * 2.5, Math.round(radius * 2.5), '#cbd5e1', '#e2e8f0'); scene.add(grid);

  const linkGrp = new THREE.Group(), lblGrp = new THREE.Group(); scene.add(linkGrp, lblGrp);
  const by = new Map(data.nodes.map(n => [n.id, n]));
  const linkMat = mat('#475569');
  for (const l of data.links) {
    const a = by.get(l.a), b = by.get(l.b); if (!a || !b) continue;
    const A = pos(a, 0.3), B = pos(b, 0.3), len = A.distanceTo(B);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 6), linkMat);
    c.position.copy(A).add(B).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    linkGrp.add(c);
  }
  for (const n of data.nodes) {
    const d = DEVICES[n.type] ?? DEVICES.pc, { g, h } = shape(d.shape ?? 'cube', d.color);
    g.position.copy(pos(n)); scene.add(g);
    const { s: t, extra } = label([n.label, ...(n.ip ? [n.ip] : []), ...(n.note ? [n.note] : [])], d.icon); t.position.copy(pos(n, h + 0.55 + extra)); lblGrp.add(t);
  }

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2.02; controls.target.set(0, 0.4, 0);
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);

  const view = (az: number, el_: number) => {
    const d = radius * 1.85 + 4;
    camera.position.set(Math.sin(az) * Math.cos(el_) * d, Math.sin(el_) * d, Math.cos(az) * Math.cos(el_) * d);
    controls.target.set(0, 0.4, 0); controls.update(); render();
  };
  const resize = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); render();
  };
  const ro = new ResizeObserver(resize); ro.observe(el);
  resize(); view(0.7, 0.6);

  // thanh công cụ
  let raf = 0;
  const bar = document.createElement('div'); bar.className = 'nd3bar';
  const btn = (t: string, f: (b: HTMLButtonElement) => void) => { const b = document.createElement('button'); b.textContent = t; b.onclick = () => f(b); bar.appendChild(b); };
  btn('Góc chéo', () => view(0.7, 0.6)); btn('Từ trên', () => view(0, 1.5)); btn('Phía trước', () => view(0, 0.2)); btn('Bên cạnh', () => view(Math.PI / 2, 0.2));
  btn('Tự xoay', b => {
    controls.autoRotate = !controls.autoRotate; b.classList.toggle('on', controls.autoRotate);
    const tick = () => { if (!controls.autoRotate) return; controls.update(); render(); raf = requestAnimationFrame(tick); };
    cancelAnimationFrame(raf); if (controls.autoRotate) tick();
  });
  const tog = (name: string, g: THREE.Group) => btn('Ẩn ' + name, b => { g.visible = !g.visible; b.textContent = (g.visible ? 'Ẩn ' : 'Hiện ') + name; render(); });
  tog('cáp', linkGrp); tog('nhãn', lblGrp);
  btn('Chụp PNG', () => { render(); const a = document.createElement('a'); a.href = renderer.domElement.toDataURL('image/png'); a.download = 'network-3d.png'; a.click(); });
  el.appendChild(bar);
  const tip = document.createElement('div'); tip.className = 'nd3tip'; tip.textContent = 'Kéo: xoay · Chuột phải / 2 ngón: dịch · Lăn / chụm: zoom'; el.appendChild(tip);

  return () => { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); el.innerHTML = ''; };
}
