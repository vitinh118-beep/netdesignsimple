# Hướng dẫn thêm / cập nhật mẫu sơ đồ (dành cho admin)

Thư mục này (`src/data/templates/`) chứa **các mẫu sơ đồ mạng**. Mỗi mẫu là **một file `.json`**.
Bạn **không cần sửa code**: thêm file, đẩy lên GitHub, Vercel tự build và mẫu xuất hiện trong **📚 Thư viện mẫu** cho mọi người dùng.

> Nguyên tắc: **mẫu là dữ liệu, không phải chương trình.**

---

## 1. Thêm một mẫu mới — 5 bước

1. **Sao chép** file `_mau-trong.json` (file bắt đầu bằng dấu `_` sẽ bị bỏ qua, chỉ để làm khuôn) và đổi tên thành `<id-mau>.json`, ví dụ `office-20-users.json`.
2. **Điền nội dung** (xem mục 2 và 3). Bắt buộc có **tên** và **mô tả**.
3. *(Tuỳ chọn)* **Thêm ảnh minh hoạ** cùng thư mục (xem mục 4). Không có ảnh thì app tự vẽ ảnh xem trước từ chính sơ đồ.
4. **Kiểm tra** trên máy: `npm run check:templates` (mục 6).
5. **Commit và push** lên GitHub. Vercel tự build và deploy, mẫu mới xuất hiện sau khi deploy xong.

> Cách nhanh nhất để tạo mẫu: **vẽ sơ đồ trong app → 📚 Mẫu → "Lưu bản vẽ thành mẫu" → Tải file .json**, rồi sao chép file đó vào thư mục này (mục 5). Không phải gõ toạ độ bằng tay.

---

## 2. Cấu trúc một file mẫu

```json
{
  "id": "office-20-users",
  "name": "Văn phòng 20 nhân viên",
  "category": "Văn phòng",
  "description": "Mạng LAN cho văn phòng nhỏ: 1 router, 1 switch, WiFi và server nội bộ",
  "version": 1,
  "devices": [
    {"ref": "internet1", "type": "internet", "label": "Internet ISP", "x": 100, "y": 200},
    {"ref": "router1", "type": "router", "label": "Router Gateway", "x": 340, "y": 200},
    {"ref": "switch1", "type": "switch", "label": "Switch 24 Port", "x": 580, "y": 200, "ip": "192.168.1.2"},
    {"ref": "server1", "type": "server", "label": "Server nội bộ", "x": 820, "y": 200, "note": "File server"}
  ],
  "connections": [
    {"from": "internet1", "to": "router1"},
    {"from": "router1", "to": "switch1"},
    {"from": "switch1", "to": "server1"}
  ]
}
```

### Các trường ở mức mẫu

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| `id` | **Có** | Duy nhất. Chỉ chữ thường không dấu, số, dấu gạch ngang; 2–60 ký tự. **Nên đặt trùng tên file** (`office-20-users.json` ↔ `"id": "office-20-users"`). Đừng đổi `id` sau khi đã phát hành. |
| `name` | **Có** | **Tên mẫu** hiển thị trong thư viện. Tối đa 60 ký tự. Có dấu tiếng Việt thoải mái. |
| `description` | **Có** | **Mô tả** 1 câu: mẫu dùng cho trường hợp nào, gồm những gì. Tối đa 200 ký tự. |
| `category` | Không | Nhóm để lọc (vd "Văn phòng", "An ninh", "Gia đình"). Bỏ trống → nhóm "Khác". Ghi tên nhóm mới là nhóm tự xuất hiện. |
| `version` | Không | Số nguyên, tăng lên khi bạn sửa mẫu (để theo dõi). Mặc định 1. |
| `image` | Không | Tên file ảnh nằm cùng thư mục, dùng khi ảnh **không** trùng tên file `.json` (mục 4). |
| `devices` | **Có** | Danh sách thiết bị, 1–200 thiết bị. |
| `connections` | Không | Danh sách dây nối (có thể rỗng). |

### Các trường của mỗi thiết bị (`devices`)

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| `ref` | **Có** | Mã định danh của thiết bị **trong file này**, dùng để nối dây. Duy nhất trong file; chữ/số/`_`/`-`, tối đa 40 ký tự. Gợi ý: `loại + số` (`switch1`, `camera3`). |
| `type` | **Có** | Loại thiết bị, phải có trong bảng ở mục 7. |
| `label` | **Có** | Tên hiển thị dưới thiết bị, tối đa 40 ký tự. |
| `x`, `y` | **Có** | Toạ độ **tâm** thiết bị (số). `x` tăng sang phải, `y` tăng xuống dưới. |
| `ip` | Không | Địa chỉ IP (hiện dưới tên thiết bị). Chỉ ghi IP mẫu/giả định, **không ghi IP thật của khách**. |
| `note` | Không | Ghi chú ngắn, tối đa 200 ký tự (hiện trong 3D khi xuất "kèm ghi chú"). |

### Các trường của mỗi dây nối (`connections`)

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| `from`, `to` | **Có** | `ref` của hai thiết bị. Phải tồn tại trong `devices`, không được nối thiết bị với chính nó, không khai báo trùng một cặp. |
| `cableType` | Không | Dự phòng cho tương lai (vd `"cat6"`, `"fiber"`); hiện app **bỏ qua**, ghi vào cũng không sao. |

---

## 3. Mẹo bố trí toạ độ cho đẹp

- Dùng **bội số của 20** (app tự canh lưới 20 px).
- Khoảng cách giữa hai thiết bị liền kề khoảng **120 px** theo chiều dọc, **120–160 px** theo chiều ngang.
- Đi theo luồng **từ trên xuống**: Internet → Router/Firewall → Switch → thiết bị đầu cuối.
- Gần `x = 300–400` cho thiết bị ở giữa; không cần căn tâm tuyệt đối, app tự "Vừa khung" khi nạp mẫu.
- Mẫu càng gọn càng tốt: **5–15 thiết bị** là hợp lý; tối đa 200.

---

## 4. Ảnh minh hoạ (tuỳ chọn)

Mặc định thư viện **tự vẽ ảnh xem trước** từ sơ đồ nên **không bắt buộc có ảnh**. Chỉ thêm ảnh khi muốn ảnh đẹp hơn (ví dụ ảnh mặt bằng thực tế).

- **Cách 1 (khuyên dùng):** đặt ảnh **cùng tên** với file `.json`, ví dụ `office-20-users.json` + `office-20-users.png`. Tự nhận.
- **Cách 2:** ghi tên ảnh vào trường `"image": "anh-khac-ten.png"` (ảnh phải nằm trong thư mục này).
- Định dạng: `png`, `jpg`, `jpeg`, `webp`, `svg`.
- Kích thước khuyến nghị: **600 × 400 px**, tỉ lệ 3:2; dung lượng **dưới 200 KB** (cảnh báo từ 300 KB).
- Ảnh được gộp vào bản build, nên nhiều ảnh nặng sẽ làm trang tải chậm.

---

## 5. Cập nhật hoặc xoá mẫu

- **Sửa mẫu:** sửa file `.json` (và tăng `version`), commit, push. **Giữ nguyên `id`.**
- **Xoá mẫu:** xoá file `.json` (và ảnh cùng tên nếu có), commit, push.
- **Ẩn tạm một mẫu** mà chưa xoá: đổi tên file thành `_ten-mau.json` (thêm dấu `_` ở đầu).
- **Nhận mẫu từ đồng nghiệp/người dùng:** họ vẽ trong app → "Lưu bản vẽ thành mẫu" → "Tải file .json" → gửi bạn. Bạn mở file, **kiểm tra lại `name`, `description`, `category`**, sao chép vào thư mục này (đổi tên file trùng `id`), rồi chạy kiểm tra.

> Người dùng cũng có thể **nhập file mẫu** vào trình duyệt của riêng họ (nút "Nhập mẫu từ file"). Mẫu cá nhân chỉ nằm trên máy họ, không ảnh hưởng thư viện chính thức.

---

## 6. Kiểm tra trước khi đẩy lên

```bash
npm run check:templates
```

Kết quả mẫu:

```
✓ office.json
✗ warehouse-network.json
    - devices[3]: "type" "swich" không có trong catalog (hợp lệ: internet, modem, ...)
    - connections[2]: "from"/"to" phải là "ref" của một thiết bị có trong "devices"
```

- Lệnh này **tự chạy mỗi khi build** (`npm run build`). Nếu có mẫu lỗi, **build dừng** và Vercel **giữ nguyên bản đang chạy**, người dùng không bị ảnh hưởng.
- Khi chạy `npm run dev`, mẫu lỗi bị **bỏ qua** (xem cảnh báo trong console và mục "⚠ mẫu bị lỗi" cuối thư viện mẫu); các mẫu còn lại vẫn hiện bình thường.

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân |
|---|---|
| `Không phải JSON hợp lệ` | Thiếu/dư dấu phẩy, thiếu ngoặc, dùng dấu nháy đơn `'`. JSON chỉ dùng nháy kép `"`. Không có dấu phẩy sau phần tử cuối. |
| `"id" bắt buộc…` | `id` có chữ hoa, dấu tiếng Việt, khoảng trắng hoặc ký tự đặc biệt. |
| `"type" … không có trong catalog` | Gõ sai loại thiết bị. Chép đúng từ bảng mục 7. |
| `"ref" … bị trùng` | Hai thiết bị cùng `ref`. |
| `"from"/"to" phải là "ref"…` | Dây nối trỏ tới `ref` không tồn tại (gõ sai hoặc đã xoá thiết bị). |
| `id … trùng với …` | Hai file có cùng `id`. |
| Mẫu không hiện | File bắt đầu bằng `_`, hoặc chưa push/deploy xong. |

---

## 7. Danh sách loại thiết bị (`type`) hợp lệ

| `type` | Tên | Biểu tượng | Nhóm |
|---|---|---|---|
| `internet` | Internet | ☁️ | WAN |
| `modem` | Modem | 📟 | WAN |
| `router` | Router | 🔀 | Mạng |
| `firewall` | Firewall | 🧱 | Mạng |
| `switch` | Switch | 🔌 | Mạng |
| `ap` | WiFi AP | 📶 | Mạng |
| `server` | Server | 🖥️ | Máy chủ |
| `nas` | NAS | 🗄️ | Máy chủ |
| `pc` | PC | 💻 | Thiết bị đầu cuối |
| `laptop` | Laptop | 🧑‍💻 | Thiết bị đầu cuối |
| `phone` | IP Phone | ☎️ | Thiết bị đầu cuối |
| `printer` | Máy in | 🖨️ | Thiết bị đầu cuối |
| `text` | Chữ | Aa | Chú thích |
| `camera` | Camera IP | 📷 | An ninh |
| `nvr` | NVR | 📼 | An ninh |

`text` là **ô chữ chú thích** (vd tên khu vực "Phòng server"): dùng được trong mẫu, không nối dây, chỉ hiện ở 2D (không có trong 3D).

Cần thiết bị mới? Thêm 1 dòng vào `DEVICES` trong `src/data/catalog.ts` (xem README chính). Danh sách trên là bản sao tại thời điểm viết; **nguồn chuẩn là `catalog.ts`**.

---

## 8. Danh sách kiểm tra nhanh trước khi push

- [ ] Có `name` (tên) và `description` (mô tả) rõ ràng, đúng chính tả.
- [ ] `id` không dấu, duy nhất, trùng tên file.
- [ ] Đã chọn `category` phù hợp (dùng lại nhóm sẵn có nếu được).
- [ ] Sơ đồ nhìn gọn, không chồng chéo thiết bị.
- [ ] Không có IP/thông tin thật của khách hàng.
- [ ] `npm run check:templates` báo ✓ cho mọi file.
- [ ] (Nếu có ảnh) dưới 200 KB, đặt cùng tên với file `.json`.
