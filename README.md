# NetDesign Lite

Ứng dụng web vẽ **sơ đồ mạng nhỏ** (văn phòng, quán cafe, hệ thống camera, mạng doanh nghiệp nhỏ…).
Chạy hoàn toàn trên trình duyệt, **không backend, không API key, không cơ sở dữ liệu**.
Mục tiêu: đơn giản, mượt, và thêm thiết bị/mẫu mới chỉ bằng cách sửa **một file dữ liệu**.

- Công nghệ: React 19 + TypeScript + Vite 6 (không thư viện đồ họa nào khác, canvas 2D là SVG thuần; 3D dùng three.js, tải khi cần)
- Dung lượng: bản 2D khoảng 75 KB (gzip), khởi động tức thì; bộ xem 3D (~130 KB gzip) chỉ tải khi bấm Xem 3D
- Triển khai: GitHub → Vercel (tự nhận Vite, không cần `vercel.json`)

---

## 1. Danh sách tính năng

### 1.1. Thư viện thiết bị (cột bên trái)
- Có **ô tìm kiếm**; thiết bị chia nhóm: **WAN**, **Mạng**, **Máy chủ**, **Thiết bị đầu cuối**, **Chú thích** (ô chữ), **An ninh**.
- **Kéo thả có bóng bay theo chuột**, thả đâu thiết bị nằm đó (tự canh lưới). **Bấm** (hoặc chạm trên điện thoại) để thêm vào giữa khung vẽ.
- Tên tự đánh số theo loại: `Switch 1`, `Switch 2`, `PC 1`…
- Danh sách và nhóm sinh tự động từ `src/data/catalog.ts`.

### 1.2. Thư viện mẫu (📚 Mẫu)
- Cửa sổ thư viện có **ô tìm kiếm**, **lọc theo nhóm**, thẻ mẫu có **ảnh xem trước** (ảnh admin cung cấp, hoặc tự vẽ từ sơ đồ), **tên**, **mô tả**, số thiết bị.
- Mẫu có sẵn: Văn phòng nhỏ, Camera giám sát, 2 ISP + Firewall, Quán cafe/WiFi, Mạng gia đình, Mạng kho hàng.
- Bấm vào mẫu để nạp (hỏi xác nhận nếu đang có sơ đồ; vẫn Undo được), khung nhìn tự căn vừa.
- **Mẫu chính thức = mỗi mẫu một file `.json`** trong `src/data/templates/`, tự được nhận khi build. Thêm mẫu **không cần sửa code**: xem `src/data/templates/HUONG-DAN-THEM-MAU.md`.
- **Mẫu của tôi** (lưu trong trình duyệt): tab "Lưu bản vẽ thành mẫu" (nhập tên, mô tả, nhóm) và nút "Nhập mẫu từ file"; mẫu cá nhân có nút Xuất file và Xóa. Có thể tải file `.json` gửi admin để đưa vào thư viện chính thức.
- Mỗi file mẫu được kiểm tra tự động (tên, mô tả, loại thiết bị, dây nối, trùng `id`…). **Mẫu lỗi không làm hỏng các mẫu khác**; khi build, mẫu lỗi làm build dừng và Vercel giữ nguyên bản đang chạy.

### 1.3. Thanh menu (phía trên) — chữ rõ ràng, chia nhóm
`📄 Mới` · `📂 Mở file` · `💾 Lưu file` │ `📚 Mẫu` │ `↶ Hoàn tác` · `↷ Làm lại` │ `🧊 Xem 3D` · `⬇ Xuất`.
Không có menu xổ nhiều tầng; mỗi nút một việc, rê chuột vào để xem giải thích. Màn hình nhỏ chỉ hiện biểu tượng.

### 1.4. Khung vẽ và thanh công cụ (bên trái khung vẽ)
| Công cụ | Cách dùng |
|---|---|
| 👆 **Chọn** | Bấm để chọn; kéo thiết bị để di chuyển; kéo nền để dịch khung nhìn. Giữ **Shift** + kéo nền = khoanh vùng chọn. |
| ⬚ **Chọn vùng** | Kéo một khung trên nền để chọn nhiều thiết bị cùng lúc, rồi kéo cả nhóm. |
| 🔗 **Nối dây** | Kéo từ thiết bị này sang thiết bị khác, **hoặc bấm lần lượt hai thiết bị** (hợp với cảm ứng). Thiết bị đích sáng xanh khi sẵn sàng nối. |
| **Aa Thêm chữ** | Bấm vào chỗ trống để thêm ô chữ và gõ ngay. Ô chữ dùng để ghi tên khu vực, chú thích (chỉ có ở 2D). |

- Dòng gợi ý nhỏ trên cùng khung vẽ **đổi theo công cụ đang dùng**; khi khung vẽ trống có hướng dẫn 3 bước.
- **Nối dây nhanh nhất ở chế độ Chọn:** rê chuột vào thiết bị sẽ hiện 4 chấm tròn xanh quanh nó; kéo từ chấm sang thiết bị khác. Vùng thả rộng hơn thiết bị nên dễ trúng.
- **Zoom:** lăn chuột, hoặc nút **− / + / Vừa khung** ở góc dưới phải (hiện % thu phóng, chừa chỗ cho thanh công cụ).
- Lưới chấm; thiết bị tự canh lưới 20 px. Dùng được cả chuột và cảm ứng.

### 1.5. Gõ chữ và chỉnh sửa
- **Bấm đúp** vào thiết bị hoặc ô chữ (hoặc chọn rồi nhấn `Enter`/`F2`) để **sửa tên ngay tại chỗ** (Enter = xong, Esc = hủy).
- **Thanh thuộc tính** hiện phía dưới khi chọn, có nhãn rõ ràng: **Tên**, **Địa chỉ IP**, **Ghi chú** (ô chữ: **Cỡ chữ A− / A+**). IP hiện dưới tên thiết bị; ghi chú hiện trong 3D.
- **Chọn nhiều** (kéo khung, Shift+bấm, hoặc `Ctrl+A`): di chuyển cả nhóm, **⇔ Căn hàng ngang**, **⇕ Căn cột dọc**, **↔ Chia đều**.
- **⧉ Nhân bản** (`Ctrl+D`, giữ nguyên dây nối giữa các thiết bị được chọn), **🗑 Xóa** (`Delete`; xóa thiết bị sẽ xóa luôn dây gắn với nó). Bấm vào dây để chọn dây.
- **Undo/Redo** tối đa 100 bước, gồm mọi thao tác kể cả di chuyển nhóm, nối dây, đổi tên.

### 1.6. Lưu trữ và xuất file
| Chức năng | Mô tả |
|---|---|
| **Tự lưu** | Mỗi thay đổi được lưu vào `localStorage` của trình duyệt, mở lại là có tiếp (khóa `netdesign-lite:v1`). |
| **Lưu JSON** | Tải file `network.json` để lưu trữ/chia sẻ/đưa vào Git. |
| **Mở JSON** | Nạp file JSON; có kiểm tra định dạng, file sai sẽ báo lỗi và không làm hỏng sơ đồ hiện tại. |
| **⬇ Xuất…** | Hộp thoại chọn **PNG** (nền trắng, x2), **SVG** (vector) hoặc **HTML 3D**, kèm tuỳ chọn thông tin đi kèm (xem 1.7). |
| **Mới** | Xóa toàn bộ sơ đồ (có xác nhận, vẫn Undo được). |

Khi xuất, các hiệu ứng chọn (viền xanh, chấm nối) được ẩn đi để ảnh sạch, ảnh tự cắt vừa sơ đồ.

### 1.7. Xem 3D và xuất HTML 3D (chỉ xem, không chỉnh sửa)
- Nút **🧊 Xem 3D** chuyển sơ đồ hiện tại sang không gian 3D: kéo để **xoay**, chuột phải/2 ngón để **dịch**, lăn/chụm để **zoom**. Nút **✏️ Về 2D** quay lại chỉnh sửa (không mất gì).
- Thanh công cụ 3D: **Góc chéo**, **Từ trên**, **Phía trước**, **Bên cạnh**, **Tự xoay**, **Ẩn/Hiện cáp**, **Ẩn/Hiện nhãn**, **Chụp PNG** (ảnh từ góc đang xem).
- Mỗi loại thiết bị có một dạng khối đơn giản (switch/router dẹt, server cao, AP hình đĩa, Internet hình mây, PC có màn hình, camera có cột…), kèm nhãn nổi biểu tượng + tên. Dây nối là ống nhỏ nối các thiết bị.
- Xuất **HTML 3D** (trong hộp thoại ⬇ Xuất…) tạo file `network-3d.html`: **một file duy nhất, mở offline**, đã nhúng sẵn three.js và dữ liệu sơ đồ; gửi cho khách xem bằng trình duyệt là xoay được, không cần cài gì.
- **Hai chế độ xuất, chọn bằng hộp tick:**
  - **Bản giới thiệu** (mặc định, không tick gì): chỉ có tên thiết bị và kết nối, an toàn khi gửi khách.
  - **Bản kỹ thuật** (tick "Địa chỉ IP" và/hoặc "Ghi chú"): kèm thông tin hạ tầng, chỉ gửi nội bộ/đối tác tin cậy. Lưu ý **tên thiết bị luôn nằm trong file**, đừng ghi IP vào tên.
- Không chỉnh sửa trong 3D (không kéo/thêm/xóa/nối) nên nhẹ: three.js chỉ tải khi bấm nút 3D, bản 2D vẫn ~75 KB.
- Thêm dạng khối 3D mới cho thiết bị: ghi `shape` trong `catalog.ts` (`flat | tall | cube | disc | cloud | desk | cam`); thêm dạng hoàn toàn mới: sửa hàm `shape()` trong `src/viewer3d/runtime.ts`.

### 1.8. Phím tắt
| Phím | Tác dụng |
|---|---|
| `Ctrl/Cmd + Z` | Hoàn tác |
| `Ctrl/Cmd + Y` hoặc `Ctrl/Cmd + Shift + Z` | Làm lại |
| `Ctrl/Cmd + A` | Chọn tất cả |
| `Ctrl/Cmd + D` | Nhân bản mục đang chọn |
| `Delete` / `Backspace` | Xóa mục đang chọn |
| `Enter` / `F2` | Sửa tên thiết bị đang chọn |
| `Mũi tên` | Dịch mục đang chọn 1 ô lưới |
| `Esc` | Bỏ chọn, quay về công cụ Chọn |

(Tắt trong chế độ Xem 3D và khi đang gõ trong ô nhập.)

---

## 2. Cách thêm thiết bị và mẫu mới

- **Thiết bị:** sửa `src/data/catalog.ts` (bên dưới).
- **Mẫu:** chỉ cần thêm một file `.json` vào `src/data/templates/`, hướng dẫn chi tiết cho admin ở **`src/data/templates/HUONG-DAN-THEM-MAU.md`**.

### Thêm thiết bị
Thêm một dòng vào `DEVICES`:
```ts
voip: { name: 'VoIP Gateway', icon: '📞', color: '#0ea5e9', group: 'Mạng' },
```
| Trường | Ý nghĩa |
|---|---|
| khóa (`voip`) | Mã duy nhất, lưu trong file JSON, **đặt xong đừng đổi** để file cũ vẫn mở được |
| `name` | Tên hiển thị và tiền tố đánh số |
| `icon` | Emoji dùng làm biểu tượng |
| `color` | Màu viền/nền nhạt của khối thiết bị |
| `group` | Nhóm trong thư viện; ghi tên nhóm mới thì nhóm tự xuất hiện |

Thiết bị có mã không còn trong catalog (file cũ) sẽ hiển thị bằng biểu tượng PC thay vì gây lỗi.

### Thêm mẫu
Sao chép `src/data/templates/_mau-trong.json`, đổi tên, điền tên + mô tả + thiết bị + dây nối, chạy `npm run check:templates`, rồi commit/push. Chi tiết: `HUONG-DAN-THEM-MAU.md`.

---

## 3. Định dạng file JSON
```json
{
  "nodes": [ { "id": "a1b2c3", "type": "router", "label": "Router 1", "x": 400, "y": 180 } ],
  "links": [ { "id": "d4e5f6", "a": "a1b2c3", "b": "g7h8i9" } ]
}
```
`type` là khóa trong `DEVICES`; `a`, `b` là `id` của hai thiết bị được nối. `x`, `y` là tâm thiết bị.

---

## 4. Cấu trúc mã nguồn
```
netdesign-lite/
├─ index.html
├─ package.json / vite.config.ts / tsconfig.json
└─ src/
   ├─ main.tsx            # điểm khởi chạy
   ├─ App.tsx             # logic 2D: canvas, kéo thả, nối dây, undo, lưu, xuất
   ├─ util.ts             # kiểu dữ liệu dùng chung, tải file
   ├─ styles.css          # giao diện
   ├─ components/         # TemplateGallery (thư viện mẫu), ExportDialog (hộp thoại xuất)
   ├─ data/catalog.ts     # DANH SÁCH THIẾT BỊ (thêm thiết bị: sửa file này)
   ├─ data/templates/     # MẪU SƠ ĐỒ: mỗi mẫu 1 file .json + HUONG-DAN-THEM-MAU.md
   ├─ data/templateValidator.ts / templateRegistry.ts / myTemplates.ts
   ├─ viewer3d/runtime.ts # bộ xem 3D chỉ-đọc (dùng cho tab 3D và file HTML xuất ra)
   ├─ viewer3d/standalone.ts
   └─ generated/          # tự sinh khi chạy dev/build (bộ xem 3D đóng gói để nhúng vào HTML), đã .gitignore
scripts/build-viewer.mjs     # đóng gói bộ xem 3D bằng esbuild (tự chạy trước dev/build)
scripts/check-templates.mjs  # kiểm tra các file mẫu (tự chạy trước build; chạy tay: npm run check:templates)
```

## 5. Chạy và triển khai
```bash
npm install
npm run dev       # chạy thử tại http://localhost:5173
npm run build     # kiểm tra kiểu + build ra dist/
```
Triển khai: đẩy lên GitHub → Vercel → **Add New → Project** → chọn repo → **Deploy** (Framework tự nhận là Vite, Build `npm run build`, Output `dist`). Không cần biến môi trường.

---

## 6. Tính năng đã bỏ so với bản gốc (HACHIHI Network & Electrical Designer)

Bản gốc là bộ công cụ thiết kế hạ tầng đầy đủ (~15 MB, hàng chục nghìn dòng). Các phần sau **đã được lược bỏ có chủ ý** để bản Lite gọn và mượt:

**Chế độ thiết kế chuyên sâu**
- Mặt bằng (Floorplan), nhiều tầng, trình tạo tòa nhà, phòng/legend
- Tủ Server Rack 19" theo U-slot
- Chế độ CCTV với vùng nhìn (FOV) camera
- Chế độ Wi-Fi với vùng phủ sóng/heatmap
- Chế độ cáp quang, ODF, patch panel
- Chế độ điện, UPS, phân phối nguồn
- Chế độ đa chi nhánh (Multi-site WAN)

**Tính toán và kiểm tra kỹ thuật**
- Auto-Route tuyến cáp tránh vật cản, tính chiều dài/vật tư cáp
- Tính ngân sách PoE, tải điện, tải trọng rack
- Tự gán IP/VLAN, kiểm tra trùng IP, kiểm tra kỹ thuật (Engineering Audit)
- Cổng (port) chi tiết cho từng thiết bị, thông số kỹ thuật (hãng, model, serial, MAC, asset tag…)
- Gán nhãn cáp chuẩn ANSI/TIA-606

**Xuất file và nhập liệu**
- Xuất PDF, DXF (CAD), Excel BOM, CSV (HTML 3D vẫn còn nhưng là bản đơn giản)
- Thống kê vật tư và bảng dự toán/giá (BOM)
- Nhập từ Excel (cây thiết bị), nhập từ file quét, gói dự án (project package/handover bundle)

**Hiển thị và giao diện nâng cao**
- Chỉnh sửa trực tiếp trong 3D và mô hình thiết bị 3D chi tiết (dựng thủ tục): bản Lite chỉ **xem** 3D với khối đơn giản
- Hệ thống lớp (Layers), bộ lọc hiển thị, outline đối tượng
- Đường gióng thông minh (snap guide), thước và công cụ khung nhìn nâng cao
- Command Palette, tùy chỉnh phím tắt, bảng phím tắt, tour giới thiệu, hướng dẫn trợ giúp, hộp thoại About
- Project Hub (nhiều dự án), thư viện/Directory hạ tầng, bảng thuộc tính nhiều tab (Inspector)
- Nền canvas tùy chỉnh, bố cục workspace lưu được

**Tích hợp và hạ tầng**
- Trợ lý AI Gemini (`/api/gemini/chat`) và chế độ phân tích offline
- Ghi log truy cập về Google Sheet (Apps Script, `/api/track`)
- Server Express, serverless function, kiểm tra Origin, rate-limit
- PWA (cài đặt như ứng dụng, chạy offline)
- Bộ kiểm thử (unit, e2e Playwright, benchmark hiệu năng), cấu hình CSP/headers trong `vercel.json`

**Dữ liệu mẫu (đã thay thế)**
- 9 mẫu kiến trúc + 5 mẫu mạng chuẩn của bản gốc (tòa 5 tầng, enterprise, server rack, CCTV, WiFi, fiber, multi-site, LAN star, LAN VLAN/DMZ, WAN dual-ISP, core-distribution, collapsed core…) được thay bằng 6 mẫu nhỏ gọn dạng file JSON.
- Danh mục thiết bị chi tiết theo hãng (Cisco, Aruba, Fortinet…) được thay bằng danh mục loại thiết bị đơn giản.

> Lưu ý: file JSON của bản gốc **không tương thích** với bản Lite (cấu trúc dữ liệu khác).

---

## 7. Hướng mở rộng gợi ý (chưa làm)
Nếu sau này cần, nên thêm từng cái một để giữ app gọn: nhãn trên dây nối (tên cổng, tốc độ), ghi chú/IP trên thiết bị, chọn nhiều thiết bị, màu/kiểu dây, pinch-zoom trên điện thoại, chế độ tối.
