// Điểm vào cho file HTML 3D xuất ra (dữ liệu nằm trong window.__NET__)
import { mount } from './runtime';
const d = (window as any).__NET__;
if (d) mount(document.getElementById('v')!, d);
