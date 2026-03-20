# 📋 TÀI LIỆU THUYẾT TRÌNH DỰ ÁN SD'BIKE

> **Dự án:** Website Thương Mại Điện Tử – Bán Xe Đạp Chính Hãng  
> **Tên thương hiệu:** SD'bike  
> **Công nghệ:** HTML5, CSS3, Vanilla JavaScript (không framework)  
> **Ngày tạo tài liệu:** 19/03/2026  

---

## 📁 CẤU TRÚC DỰ ÁN

```
📂 SD'bike/
├── 📄 index.html       ← Trang chính (HTML)
├── 📄 style.css        ← Giao diện & responsive (CSS)
├── 📄 script.js        ← Logic tương tác phía client (JS)
├── 📄 api.js           ← Fake API – mô phỏng REST API
├── 📄 database.json    ← Cơ sở dữ liệu sản phẩm (JSON)
├── 🖼️ logo.png         ← Logo thương hiệu
└── 📂 images/          ← Thư mục chứa hình ảnh
```

---

## 🌐 TỔNG QUAN SẢN PHẨM

Website SD'bike là một trang thương mại điện tử bán xe đạp chính hãng, được xây dựng hoàn toàn bằng **HTML, CSS, JavaScript thuần** (Vanilla JS), không sử dụng bất kỳ framework nào. Website bao gồm các chức năng chính:

| STT | Chức năng              | Mô tả ngắn                                    |
|-----|-------------------------|------------------------------------------------|
| 1   | Splash Screen           | Màn hình giới thiệu với animation khi mở trang |
| 2   | Hiển thị sản phẩm       | Tải & phân loại sản phẩm theo danh mục         |
| 3   | Chi tiết sản phẩm       | Modal popup hiển thị thông tin chi tiết         |
| 4   | Giỏ hàng                | Thêm / xóa sản phẩm, tính tổng tiền            |
| 5   | Đăng nhập / Đăng ký     | Hệ thống tài khoản lưu trữ trên localStorage   |
| 6   | Chat hỗ trợ             | Widget chat giả lập bot trả lời tự động         |
| 7   | Tìm kiếm sản phẩm      | Gợi ý tìm kiếm trực tiếp với debounce          |
| 8   | Chuyển đổi giao diện    | Light mode ↔ Dark mode                         |
| 9   | Fake REST API           | Class mô phỏng API thực với caching             |

---

## 📄 FILE 1: `index.html` – CẤU TRÚC TRANG

### Mô tả
File HTML chính chứa toàn bộ cấu trúc giao diện của website, bao gồm các thành phần (section) được tổ chức rõ ràng.

### Các thành phần chính

#### 1. Splash Screen (Màn hình giới thiệu)
- **Mục đích:** Tạo ấn tượng đầu tiên khi người dùng truy cập
- **Cơ chế:** Hai panel trượt từ hai bên → ghép logo → hiệu ứng phát sáng → thanh loading → fade out
- **Tối ưu:** Chỉ chạy 1 lần mỗi session (dùng `sessionStorage` để đánh dấu)

#### 2. Top Bar (Thanh thông tin trên cùng)
- Hiển thị hotline và chương trình khuyến mãi

#### 3. Header (Thanh điều hướng chính)
- **Logo:** Link về trang chủ
- **Search Box:** Ô tìm kiếm với dropdown gợi ý
- **Nút chức năng:** Đổi giao diện, Đăng nhập, Giỏ hàng (có badge số lượng)

#### 4. Category Nav (Thanh danh mục)
- Điều hướng nhanh đến các danh mục: Sản phẩm mới, Xe trẻ em, Xe thể thao, Phụ kiện, Khuyến mãi

#### 5. Hero Banner (Banner chính)
- Ảnh nền responsive (dùng `<picture>` + `srcset` cho mobile)
- Tiêu đề + CTA button "Mua ngay"
- Tối ưu LCP bằng `fetchpriority="high"`

#### 6. Trust Strip (Dải cam kết)
- 5 badge: Miễn phí vận chuyển, Đổi trả 30 ngày, Bảo hành 3 năm, Hỗ trợ 24/7, Hàng chính hãng

#### 7. Main Content (Nội dung chính)
- Container hiển thị danh sách sản phẩm (được render động bằng JavaScript)

#### 8. Footer
- 4 cột: Thương hiệu & liên hệ, Danh mục sản phẩm, Hỗ trợ khách hàng, Thanh toán & Chứng nhận

#### 9. Các Modal & Widget
- **Cart Sidebar:** Sidebar giỏ hàng trượt từ bên phải
- **Auth Modal:** Form đăng nhập / đăng ký
- **Product Modal:** Chi tiết sản phẩm
- **Chat Widget:** Widget chat hỗ trợ khách hàng

### Inline Script – Splash Animation
```javascript
// Kiểm tra session → nếu đã xem thì ẩn ngay, không replay
if (sessionStorage.getItem('sdb_splash_shown')) {
    // Ẩn splash ngay lập tức
    return;
}
// Nếu lần đầu → chạy animation theo timeline:
// 300ms  → Panel trượt vào
// 1250ms → Hiệu ứng phát sáng
// 1550ms → Logo + tagline + loading bar
// 2750ms → Fade out toàn bộ
```

---

## 📄 FILE 2: `api.js` – FAKE REST API

### Mô tả
Mô phỏng một REST API thực bằng cách đọc dữ liệu từ file `database.json`. Được xây dựng dưới dạng class `FakeProductAPI`.

### Class: `FakeProductAPI`

| Phương thức | Kiểu | Mô tả |
|---|---|---|
| `constructor(databaseUrl)` | Đồng bộ | Khởi tạo với đường dẫn database, cấu hình Google API (tùy chọn) |
| `formatCurrency(amount)` | Static | Định dạng số tiền sang VND (vd: `1.500.000 ₫`) |
| `fetchImageForProduct(name)` | Async | Lấy ảnh từ Google Custom Search API (tùy chọn) |
| `fetchAllData()` | Async | Tải toàn bộ categories + products, có **caching** |
| `getProductsByCategory(id)` | Async | Lọc sản phẩm theo ID danh mục |
| `getProductDetails(id)` | Async | Tìm 1 sản phẩm theo ID |

### Chi tiết từng hàm

#### `constructor(databaseUrl)`
```javascript
constructor(databaseUrl) {
    this.databaseUrl = databaseUrl;    // Đường dẫn tới database.json
    this.GOOGLE_API_KEY = 'API_KEY';   // Cấu hình Google Search (tùy chọn)
    this.GOOGLE_CX = 'SEARCH_ENGINE_ID';
}
```
- **Chức năng:** Lưu trữ đường dẫn database và thiết lập Google API key
- **Lưu ý:** Google API chỉ hoạt động khi thay bằng key thật

#### `static formatCurrency(amount)`
```javascript
static formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND'
    }).format(amount);
}
```
- **Chức năng:** Chuyển số thành chuỗi tiền VND
- **Ví dụ:** `1500000` → `"1.500.000 ₫"`
- **Sử dụng `Intl.NumberFormat`** – API chuẩn quốc tế hóa của JavaScript

#### `async fetchAllData()`
```javascript
async fetchAllData() {
    if (this._cache) return this._cache;  // Trả từ cache nếu đã tải
    await new Promise(r => setTimeout(r, 600)); // Giả lập độ trễ mạng
    const res = await fetch(this.databaseUrl);
    const data = await res.json();
    this._cache = data;  // Cache lại để dùng sau
    return this._cache;
}
```
- **Chức năng:** Tải toàn bộ dữ liệu (categories + products) từ JSON
- **Caching:** Chỉ fetch 1 lần duy nhất, sau đó trả từ `this._cache`
- **Mô phỏng:** Delay 600ms giả lập độ trễ mạng

#### `async getProductsByCategory(categoryId)`
- **Chức năng:** Lọc sản phẩm thuộc một danh mục cụ thể
- **Cơ chế:** Gọi `fetchAllData()` (lấy từ cache) rồi `filter()`

#### `async getProductDetails(productId)`
- **Chức năng:** Tìm một sản phẩm cụ thể theo ID
- **Cơ chế:** Gọi `fetchAllData()` (lấy từ cache) rồi `find()`

### Khởi tạo Instance
```javascript
const sdbAPI = new FakeProductAPI('./database.json');
```
- Tạo 1 instance duy nhất dùng chung toàn trang

---

## 📄 FILE 3: `script.js` – LOGIC CHÍNH

### Mô tả
Xử lý toàn bộ tương tác phía client, được tổ chức thành 8 phần rõ ràng. Tất cả code được bọc trong sự kiện `DOMContentLoaded` để đảm bảo DOM sẵn sàng.

### Sơ đồ kiến trúc
```
DOMContentLoaded
├── STATE (Trạng thái ứng dụng)
├── DOM REFS (Tham chiếu phần tử)
├── 1. Tải & Hiển thị sản phẩm
│   ├── buildCard()
│   └── attachCatalogEvents()
├── 2. Modal chi tiết sản phẩm
│   └── renderModal()
├── 3. Giỏ hàng
│   ├── syncCartUI()
│   ├── addToCart()
│   └── removeFromCart()
├── 4. Đăng nhập / Đăng ký
│   └── updateAuthHeader()
├── 5. Chat Widget
│   ├── addMsg()
│   └── sendChat()
├── 6. Tìm kiếm
│   ├── highlightMatch()
│   └── showSuggestions()
├── TIỆN ÍCH
│   ├── fmt()
│   └── debounce()
└── 8. Theme Toggle
```

---

### PHẦN STATE – Trạng thái ứng dụng

```javascript
let shoppingCart = JSON.parse(localStorage.getItem('sdb_cart')) || [];
let currentUser  = JSON.parse(localStorage.getItem('sdb_user')) || null;
let usersDb      = JSON.parse(localStorage.getItem('sdb_users')) || [];
let allProducts  = [];
```

| Biến | Mô tả | Lưu trữ |
|------|--------|---------|
| `shoppingCart` | Mảng sản phẩm trong giỏ hàng | localStorage |
| `currentUser` | Thông tin user đang đăng nhập | localStorage |
| `usersDb` | Danh sách tất cả tài khoản đã đăng ký | localStorage |
| `allProducts` | Cache toàn bộ sản phẩm từ API | Bộ nhớ (RAM) |

---

### 1️⃣ TẢI & HIỂN THỊ SẢN PHẨM

#### Luồng hoạt động
```
Tải trang → fetchAllData() → Cache sản phẩm → Phân loại theo category
→ Tạo DocumentFragment → Chèn vào DOM 1 lần → Gắn event delegation
```

#### Hàm `buildCard(p)`
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `p` – Object sản phẩm `{id, name, price, image, discount, originalPrice}` |
| **Đầu ra** | HTML string cho 1 card sản phẩm |
| **Chức năng** | Tạo card hiển thị ảnh, tên, giá, badge giảm giá (nếu có) |

```javascript
function buildCard(p) {
    const badge = p.discount
        ? `<div class="discount-badge">-${p.discount}%</div>` : '';
    const oldPrice = p.originalPrice
        ? `<span class="product-old-price">${fmt(p.originalPrice)}</span>` : '';
    return `
        <div class="product-card js-card" data-id="${p.id}">
            ${badge}
            <div class="product-img-wrapper">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="product-name">${p.name}</div>
            <div>
                <span class="product-price">${fmt(p.price)}</span>${oldPrice}
            </div>
        </div>`;
}
```

#### Hàm `attachCatalogEvents()`
| Thuộc tính | Giá trị |
|---|---|
| **Chức năng** | Gắn event delegation trên container để xử lý click vào card |
| **Tối ưu INP** | Chỉ 1 listener duy nhất cho tất cả card (thay vì gắn riêng lẻ) |
| **Cơ chế** | Click card → tìm sản phẩm trong cache → render modal ngay (đồng bộ) |

---

### 2️⃣ MODAL CHI TIẾT SẢN PHẨM

#### Hàm `renderModal(p)`
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `p` – Object sản phẩm |
| **Chức năng** | Render nội dung modal: ảnh, tên, giá, danh sách tính năng, nút mua hàng |
| **Đặc điểm** | 100% đồng bộ – không gây delay INP |

```javascript
function renderModal(p) {
    // Render features list
    const features = (p.features || [])
        .map(f => `<li><i class="ph-fill ph-check-circle"></i> ${f}</li>`)
        .join('');
    // Hiển thị modal với ảnh, tên, giá, features, nút thêm giỏ hàng
    productModal.classList.add('active');
    modalBody.innerHTML = `...`; // HTML template
    // Gắn event cho nút "Thêm vào giỏ hàng"
    document.getElementById('modalAddCartBtn').onclick = () => {
        addToCart(p);
        productModal.classList.remove('active');
    };
}
```

---

### 3️⃣ GIỎ HÀNG

#### Hàm `syncCartUI()`
| Thuộc tính | Giá trị |
|---|---|
| **Chức năng** | Cập nhật toàn bộ giao diện giỏ hàng |
| **Cập nhật** | Badge số lượng (header + sidebar), danh sách sản phẩm, tổng tiền |
| **Khi nào gọi** | Mỗi khi giỏ hàng thay đổi (thêm/xóa/tải trang) |

#### Hàm `addToCart(product)`
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `product` – Object sản phẩm cần thêm |
| **Chức năng** | Push sản phẩm vào `shoppingCart`, lưu localStorage, cập nhật UI, mở sidebar |

#### Hàm `removeFromCart(i)` (gắn vào `window`)
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `i` – Chỉ số (index) sản phẩm cần xóa |
| **Chức năng** | Xóa sản phẩm khỏi mảng bằng `splice()`, cập nhật localStorage + UI |

#### Xử lý thanh toán (`checkoutBtn`)
```
Click "Thanh Toán"
├── Chưa đăng nhập? → Mở modal đăng nhập + alert
├── Giỏ trống? → Alert thông báo
└── OK → Tính tổng tiền → Alert thành công → Xóa giỏ → Đóng sidebar
```

---

### 4️⃣ ĐĂNG NHẬP / ĐĂNG KÝ

#### Hàm `updateAuthHeader()`
| Thuộc tính | Giá trị |
|---|---|
| **Chức năng** | Cập nhật tên hiển thị trên header: tên user hoặc "Đăng nhập" |

#### Luồng Đăng nhập
```
Nhập username + password → Tìm trong usersDb → Khớp → Lưu localStorage → Cập nhật UI
                                               → Không khớp → Alert lỗi
```

#### Luồng Đăng ký
```
Nhập username + password → Kiểm tra trùng tên → Không trùng → Tạo user mới
→ Push vào usersDb → Lưu localStorage → Tự động đăng nhập → Cập nhật UI
```

#### Chuyển đổi Login ↔ Register
- Dùng biến `isLoginMode` (boolean) để toggle
- Thay đổi tiêu đề, text button, link chuyển đổi

---

### 5️⃣ CHAT WIDGET

#### Hàm `addMsg(text, type)`
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `text` – Nội dung tin nhắn, `type` – `'user'` hoặc `'bot'` |
| **Chức năng** | Tạo DOM element tin nhắn, thêm vào khung chat, tự cuộn xuống cuối |

#### Hàm `sendChat()`
| Thuộc tính | Giá trị |
|---|---|
| **Chức năng** | Gửi tin nhắn user → Bot tự động trả lời sau 800ms |
| **Bot replies** | Xoay vòng 4 câu trả lời có sẵn (round-robin) |

```javascript
const botReplies = [
    'Chào bạn! Mình có thể hỗ trợ gì cho bạn?',
    'Chính sách đổi trả trong 30 ngày, bạn yên tâm nhé!',
    'Miễn phí vận chuyển cho đơn hàng từ 500.000₫.',
    'Liên hệ hotline 1800 1234 để được tư vấn trực tiếp.',
];
```

---

### 6️⃣ TÌM KIẾM VỚI GỢI Ý TRỰC TIẾP

#### Hàm `highlightMatch(text, query)`
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `text` – Tên sản phẩm, `query` – Từ khóa tìm kiếm |
| **Đầu ra** | HTML string với `<mark>` bao quanh phần khớp |
| **Chức năng** | In đậm phần văn bản khớp với từ khóa trong dropdown gợi ý |

#### Hàm `showSuggestions(query)`
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `query` – Từ khóa tìm kiếm |
| **Chức năng** | Lọc sản phẩm từ `allProducts` cache → hiển thị tối đa 6 gợi ý |
| **Không có kết quả** | Hiển thị thông báo "Không tìm thấy kết quả" |

#### Cơ chế hoạt động
```
User gõ → debounce 180ms → filter allProducts (từ cache)
→ Render dropdown gợi ý → Click gợi ý → Mở modal sản phẩm tương ứng
```

---

### TIỆN ÍCH

#### Hàm `fmt(n)`
| Thuộc tính | Giá trị |
|---|---|
| **Chức năng** | Định dạng số tiền sang chuỗi VND |
| **Ví dụ** | `fmt(1500000)` → `"1.500.000 ₫"` |

#### Hàm `debounce(fn, delay)`
| Thuộc tính | Giá trị |
|---|---|
| **Đầu vào** | `fn` – Hàm cần delay, `delay` – thời gian chờ (ms) |
| **Đầu ra** | Hàm wrapper – chỉ gọi `fn` sau khi user ngừng thao tác trong `delay` ms |
| **Sử dụng** | Search input (180ms) – tránh filter chạy mỗi lần gõ phím |

```javascript
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
```

---

### 8️⃣ THEME TOGGLE (Chuyển giao diện)

#### Cơ chế hoạt động
```
Click nút 🌙/☀️ → Kiểm tra data-theme hiện tại
├── dark → Xóa data-theme → Lưu 'light' vào localStorage → Đổi icon thành 🌙
└── light → Set data-theme="dark" → Lưu 'dark' vào localStorage → Đổi icon thành ☀️
```

- **Khởi tạo nhanh:** Theme được set ngay trong `<head>` (trước khi DOM render) để tránh flash
- **CSS Variables:** Dark mode thay đổi các biến CSS (`--text`, `--bg`, `--white`, `--border`)

---

## 📄 FILE 4: `style.css` – GIAO DIỆN

### Mô tả
File CSS chứa toàn bộ style cho website, bao gồm 1545 dòng code được tổ chức thành các section rõ ràng.

### Các phần chính

| Section | Mô tả |
|---|---|
| CSS Variables (`:root`) | Biến màu chủ đạo: `--red`, `--bg`, `--text`, `--border`, `--radius` |
| Dark Theme (`[data-theme="dark"]`) | Override biến màu cho chế độ tối |
| Splash Screen | Animation cho màn hình giới thiệu |
| Header & Search | Thanh điều hướng cố định (sticky), ô tìm kiếm, dropdown gợi ý |
| Hero Banner | Banner toàn màn hình với overlay gradient |
| Product Grid & Card | Grid 5 cột, card với hover effect (nâng lên + shadow) |
| Cart Sidebar | Sidebar trượt từ phải, overlay tối |
| Modal | Popup overlay chi tiết sản phẩm, form đăng nhập |
| Chat Widget | Widget chat nổi góc phải |
| Footer | Grid 4 cột với thông tin thương hiệu |
| Responsive | Media queries cho tablet và mobile |

### CSS Variables hệ thống
```css
:root {
    --red: #cc0000;        /* Màu chủ đạo */
    --red-hover: #aa0000;  /* Màu hover */
    --text: #222;          /* Màu chữ */
    --text-muted: #777;    /* Màu chữ phụ */
    --bg: #f5f5f5;         /* Nền */
    --white: #fff;         /* Nền card */
    --border: #e0e0e0;     /* Viền */
    --radius: 8px;         /* Bo góc */
}

[data-theme="dark"] {
    --text: #f0f0f0;
    --bg: #121212;
    --white: #1e1e1e;
    --border: #4a4a4a;
}
```

---

## ⚡ TỐI ƯU HIỆU NĂNG

### Các kỹ thuật đã áp dụng

| Kỹ thuật | Giải thích |
|---|---|
| **Event Delegation** | 1 listener trên container thay vì gắn cho từng card → giảm bộ nhớ |
| **DocumentFragment** | Gom DOM nodes, chèn 1 lần duy nhất → giảm reflow |
| **Cache API Data** | `allProducts` cache sau lần tải đầu → search không gọi API lần 2 |
| **Debounce Search** | Chờ 180ms sau khi ngừng gõ mới filter → giảm tải CPU |
| **`pointer-events: none`** | Trên ảnh và text trong card → click luôn hit vào card cha |
| **LCP Optimization** | `fetchpriority="high"` cho hero image |
| **CLS Fix** | `aspect-ratio` cho ảnh sản phẩm, `min-height` cho loading state |
| **Lazy Loading** | `loading="lazy"` cho ảnh sản phẩm ngoài viewport |
| **Font Optimization** | Font Parker tải qua `media="print"` → không block render |
| **Session-based Splash** | Splash chỉ chạy 1 lần mỗi session → không replay khi chuyển tab |

---

## 🔄 LUỒNG HOẠT ĐỘNG TỔNG THỂ

```
1. User mở trang
   └── Splash Screen animation (lần đầu trong session)

2. DOMContentLoaded
   ├── Khôi phục state từ localStorage (giỏ hàng, user, theme)
   ├── Gọi sdbAPI.fetchAllData()
   │   └── Fetch database.json → Cache → Render sản phẩm theo danh mục
   ├── Gắn event delegation cho catalog
   ├── Khởi tạo Cart, Auth, Chat, Search, Theme Toggle
   └── syncCartUI() → Hiển thị giỏ hàng từ localStorage

3. User tương tác
   ├── Click sản phẩm → renderModal() → Xem chi tiết / Thêm giỏ hàng
   ├── Tìm kiếm → debounce → showSuggestions() → Click gợi ý → Modal
   ├── Giỏ hàng → addToCart() / removeFromCart() → syncCartUI()
   ├── Đăng nhập → Validate → Lưu localStorage → updateAuthHeader()
   ├── Chat → sendChat() → Bot trả lời tự động
   └── Theme → Toggle dark/light → Lưu localStorage
```

---

## 📊 THỐNG KÊ DỰ ÁN

| Chỉ số | Giá trị |
|---|---|
| Tổng số file code | 4 (HTML, CSS, JS, API) |
| Dòng HTML | ~349 dòng |
| Dòng CSS | ~1.545 dòng |
| Dòng JavaScript | ~588 dòng (script.js) + ~130 dòng (api.js) |
| Số hàm chính | 13 hàm |
| Framework sử dụng | Không (Vanilla JS) |
| Lưu trữ dữ liệu | localStorage + JSON file |
| Icon Library | Phosphor Icons |
| Font chữ | Inter, Parker |

---

## 🎯 KẾT LUẬN

Dự án SD'bike là một website thương mại điện tử hoàn chỉnh được xây dựng **100% bằng công nghệ web thuần (HTML, CSS, JavaScript)**, không phụ thuộc vào bất kỳ framework nào. Website thể hiện khả năng:

1. **Thiết kế giao diện** hiện đại với dark mode, responsive, animation
2. **Xử lý logic phức tạp** bằng Vanilla JavaScript (giỏ hàng, auth, search)
3. **Tối ưu hiệu năng web** (INP, LCP, CLS) theo các tiêu chuẩn Google Core Web Vitals
4. **Quản lý trạng thái** client-side với localStorage
5. **Mô phỏng kiến trúc API** với class FakeProductAPI có caching

---


