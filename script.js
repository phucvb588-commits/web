/**
 * script.js – SD'bike Main Script
 *
 * Xử lý toàn bộ tương tác phía client:
 *   1. Tải & hiển thị sản phẩm từ Fake API
 *   2. Modal chi tiết sản phẩm
 *   3. Giỏ hàng (thêm / xóa / hiển thị)
 *   4. Đăng nhập / Đăng ký
 *   5. Chat widget
 *   6. Tìm kiếm với gợi ý trực tiếp (debounced)
 *
 * INP Optimizations:
 *   - Event delegation: 1 listener duy nhất trên catalogContainer thay vì
 *     gắn handler riêng lẻ cho từng card → giảm chi phí đăng ký + xử lý sự kiện.
 *   - Dùng lại `allProducts` (cache sau lần tải đầu) → không gọi API lần 2 cho search.
 *   - Debounce input tìm kiếm → tránh filter chạy liên tục mỗi keystroke.
 *   - requestAnimationFrame cho DOM update không khẩn cấp.
 */

document.addEventListener('DOMContentLoaded', async () => {

    // ── STATE ────────────────────────────────────────────────────────────────
    // Trạng thái ứng dụng, được đồng bộ với localStorage để giữ dữ liệu
    // khi người dùng tải lại trang.
    let shoppingCart = JSON.parse(localStorage.getItem('sdb_cart')) || [];
    let currentUser = JSON.parse(localStorage.getItem('sdb_user')) || null;
    let usersDb = JSON.parse(localStorage.getItem('sdb_users')) || [];

    // Danh sách sản phẩm được cache sau lần tải đầu, dùng lại cho search
    let allProducts = [];

    // ── DOM REFS ─────────────────────────────────────────────────────────────
    // Lấy sẵn các phần tử DOM hay dùng để tránh querySelector lặp lại
    const catalogContainer = document.getElementById('product-catalog-container');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartItemsList = document.getElementById('cartItemsContainer');
    const cartTotalEl = document.getElementById('cartTotalPrice');
    const cartCountEl = document.getElementById('cartCount');
    const cartSidebarCount = document.getElementById('cartSidebarCount');
    const authModal = document.getElementById('authModal');
    const productModal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');


    // ============================================================
    // 1. TẢI & HIỂN THỊ SẢN PHẨM
    // ============================================================
    try {
        const data = {
  "categories": [
    {
      "id": "new-products",
      "name": "SẢN PHẨM MỚI 2026"
    },
    {
      "id": "kids-bikes",
      "name": "XE ĐẠP TRẺ EM"
    },
    {
      "id": "sports-bikes",
      "name": "XE ĐẠP THỂ THAO"
    }
  ],
  "products": [
    {
      "id": "1",
      "categoryId": "sports-bikes",
      "name": "Xe đạp địa hình MTB X100",
      "price": 5200000,
      "image": "https://images.unsplash.com/photo-1511994298241-608e28f14fde",
      "sold": 120,
      "features": [
        "Xe đạp địa hình khung nhôm, 21 tốc độ"
      ]
    },
    {
      "id": "2",
      "categoryId": "sports-bikes",
      "name": "Xe đạp địa hình MTB Pro",
      "price": 6100000,
      "image": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8",
      "sold": 90,
      "features": [
        "Xe đạp leo núi giảm xóc trước"
      ]
    },
    {
      "id": "3",
      "categoryId": "sports-bikes",
      "name": "Xe đạp đua Road Bike R200",
      "price": 7800000,
      "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e",
      "sold": 65,
      "features": [
        "Xe đạp đua khung nhẹ tốc độ cao"
      ]
    },
    {
      "id": "4",
      "categoryId": "new-products",
      "name": "Xe đạp thành phố City Bike C1",
      "price": 4200000,
      "image": "images/citybike 1.webp",
      "sold": 74,
      "features": [
        "Xe đạp đi phố nhẹ và tiện lợi"
      ]
    },
    {
      "id": "5",
      "categoryId": "new-products",
      "name": "Xe đạp gấp Folding Bike F1",
      "price": 5500000,
      "image": "images/Folding Bike F1.webp",
      "sold": 50,
      "features": [
        "Xe đạp gấp gọn tiện mang theo"
      ]
    },
    {
      "id": "6",
      "categoryId": "sports-bikes",
      "name": "Xe đạp thể thao Speed S100",
      "price": 6300000,
      "image": "images/Speed S100.webp",
      "sold": 112,
      "features": [
        "Thiết kế thể thao khung nhôm"
      ]
    },
    {
      "id": "7",
      "categoryId": "sports-bikes",
      "name": "Xe đạp touring T500",
      "price": 8200000,
      "image": "images/touring T500.webp",
      "sold": 35,
      "features": [
        "Xe đạp du lịch đường dài"
      ]
    },
    {
      "id": "8",
      "categoryId": "new-products",
      "name": "Xe đạp Fixed Gear FG1",
      "price": 4800000,
      "image": "images/Fixed Gear FG1.webp",
      "sold": 95,
      "features": [
        "Xe đạp fixed gear phong cách"
      ]
    },
    {
      "id": "9",
      "categoryId": "sports-bikes",
      "name": "Xe đạp địa hình MTB Trail",
      "price": 6900000,
      "image": "images/MTB Trail.webp",
      "sold": 60,
      "features": [
        "Xe leo núi chuyên dụng"
      ]
    },
    {
      "id": "10",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Kid Bike K1",
      "price": 2100000,
      "image": "images/Kid Bike K1.webp",
      "sold": 150,
      "features": [
        "Xe đạp cho trẻ em 6-10 tuổi"
      ]
    },
    {
      "id": "11",
      "categoryId": "sports-bikes",
      "name": "Xe đạp địa hình MTB Storm",
      "price": 6400000,
      "image": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8",
      "sold": 82,
      "features": [
        "Khung thép bền bỉ"
      ]
    },
    {
      "id": "12",
      "categoryId": "sports-bikes",
      "name": "Xe đạp đường trường Road Pro",
      "price": 9300000,
      "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e",
      "sold": 41,
      "features": [
        "Xe đạp đua cao cấp"
      ]
    },
    {
      "id": "13",
      "categoryId": "new-products",
      "name": "Xe đạp city Classic",
      "price": 3900000,
      "image": "images/city Classic.webp",
      "sold": 67,
      "features": [
        "Phong cách cổ điển"
      ]
    },
    {
      "id": "14",
      "categoryId": "sports-bikes",
      "name": "Xe đạp touring Adventure",
      "price": 8700000,
      "image": "images/touring Adventure.webp",
      "sold": 28,
      "features": [
        "Xe đi phượt đường dài"
      ]
    },
    {
      "id": "15",
      "categoryId": "sports-bikes",
      "name": "Xe đạp MTB Hunter",
      "price": 5800000,
      "image": "images/MTB Hunter.webp",
      "sold": 76,
      "features": [
        "Giảm xóc mạnh mẽ"
      ]
    },
    {
      "id": "16",
      "categoryId": "new-products",
      "name": "Xe đạp Fixed Urban",
      "price": 4500000,
      "image": "images/Fixed Urban.webp",
      "sold": 55,
      "features": [
        "Phong cách đường phố"
      ]
    },
    {
      "id": "17",
      "categoryId": "new-products",
      "name": "Xe đạp gấp Mini Fold",
      "price": 5100000,
      "image": "images/Mini Fold.webp",
      "sold": 48,
      "features": [
        "Thiết kế nhỏ gọn"
      ]
    },
    {
      "id": "18",
      "categoryId": "sports-bikes",
      "name": "Xe đạp thể thao Power S200",
      "price": 7000000,
      "image": "images/Power S200.webp",
      "sold": 59,
      "features": [
        "Xe thể thao tốc độ cao"
      ]
    },
    {
      "id": "19",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Kid Bike K2",
      "price": 2400000,
      "image": "images/Kid Bike K2.webp",
      "sold": 132,
      "features": [
        "Xe trẻ em có bánh phụ"
      ]
    },
    {
      "id": "20",
      "categoryId": "sports-bikes",
      "name": "Xe đạp MTB Thunder",
      "price": 6600000,
      "image": "images/MTB Thunder.webp",
      "sold": 70,
      "features": [
        "Xe leo núi khung hợp kim"
      ]
    },
    {
      "id": "21",
      "categoryId": "new-products",
      "name": "Xe đạp điện E-Bike 100",
      "price": 12500000,
      "image": "images/E-Bike 100.webp",
      "sold": 15,
      "features": [
        "Thiết kế hiện đại, trợ lực điện"
      ]
    },
    {
      "id": "22",
      "categoryId": "new-products",
      "name": "Xe đạp đường phố Modern City",
      "price": 5400000,
      "image": "images/Modern City.webp",
      "sold": 80,
      "features": [
        "Dành cho di chuyển đô thị"
      ]
    },
    {
      "id": "23",
      "categoryId": "new-products",
      "name": "Xe đạp trượt Scoot",
      "price": 2300000,
      "image": "images/Scoot.webp",
      "sold": 45,
      "features": [
        "Gọn nhẹ, tiện đi lại gần"
      ]
    },
    {
      "id": "24",
      "categoryId": "new-products",
      "name": "Xe đạp nữ Vintage",
      "price": 4900000,
      "image": "images/Vintage.webp",
      "sold": 90,
      "features": [
        "Phong cách nữ tính, giỏ trước"
      ]
    },
    {
      "id": "25",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Kid Bike K3",
      "price": 2600000,
      "image": "images/Kid Bike K3.webp",
      "sold": 110,
      "features": [
        "Size 16 inch cho bé 5-8 tuổi"
      ]
    },
    {
      "id": "26",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Kid Bike K4",
      "price": 2800000,
      "image": "images/Kid Bike K4.webp",
      "sold": 85,
      "features": [
        "Size 20 inch cá tính"
      ]
    },
    {
      "id": "27",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Sporty Mini",
      "price": 3100000,
      "image": "images/Sporty Mini.webp",
      "sold": 60,
      "features": [
        "Kiểu dáng thể thao khỏe khoắn"
      ]
    },
    {
      "id": "28",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Princess",
      "price": 2700000,
      "image": "images/Princess.webp",
      "sold": 140,
      "features": [
        "Dành cho bé gái, màu hồng"
      ]
    },
    {
      "id": "29",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Hero",
      "price": 2900000,
      "image": "images/Hero.webp",
      "sold": 75,
      "features": [
        "Tem siêu anh hùng"
      ]
    },
    {
      "id": "30",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Balance Bike",
      "price": 1200000,
      "image": "images/Balance Bike.webp",
      "sold": 200,
      "features": [
        "Xe thăng bằng cho bé 2-4 tuổi"
      ]
    },
    {
      "id": "31",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em BMX Junior",
      "price": 3500000,
      "image": "images/BMX Junior.webp",
      "sold": 40,
      "features": [
        "Thích hợp biểu diễn nhẹ"
      ]
    },
    {
      "id": "32",
      "categoryId": "kids-bikes",
      "name": "Xe đạp trẻ em Junior MTB",
      "price": 3800000,
      "image": "images/Junior MTB.webp",
      "sold": 55,
      "features": [
        "Phuộc nhún trước, phanh đĩa"
      ]
    }
  ]
};
        allProducts = data.products || []; // Dùng trực tiếp dữ liệu tĩnh

        const categories = data.categories || [];
        catalogContainer.innerHTML = ''; // Xóa loading spinner

        // Dùng DocumentFragment để gom các DOM node, chèn vào trang 1 lần duy nhất
        // → giảm số lần reflow so với innerHTML += nhiều lần
        const fragment = document.createDocumentFragment();

        const cyberCatGrid = document.getElementById('cyberCatGrid');
        if (cyberCatGrid) {
            cyberCatGrid.innerHTML = categories.map(cat => {
                const count = allProducts.filter(p => p.categoryId === cat.id).length;
                let bgImage = 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7';
                if (cat.id === 'sports-bikes') bgImage = 'https://images.unsplash.com/photo-1544181057-7977a4143a57';
                else if (cat.id === 'kids-bikes') bgImage = 'https://images.unsplash.com/photo-1557257321-72f87ee8d462';
                
                return `
                <a href="#${cat.id}" class="cyber-cat-card" style="text-decoration:none;">
                    <div class="cyber-cat-bg" style="background-image: url('${bgImage}')"></div>
                    <div class="cyber-cat-content">
                        <div class="cyber-cat-title">${window.t_cat ? window.t_cat(cat.name) : cat.name}</div>
                        <div class="cyber-cat-subtitle">${cat.name.split(' ')[0] || 'XE'} ${window.t_feat ? window.t_feat('CATEGORY') : 'CATEGORY'}</div>
                        <div class="cyber-cat-bottom">
                            <span class="cyber-cat-count">${count} ${window.t_feat ? window.t_feat('sản phẩm') : 'sản phẩm'}</span>
                            <span class="cyber-cat-btn">${window.t_feat ? window.t_feat('Xem Ngay') : 'Xem Ngay'}</span>
                        </div>
                    </div>
                </a>`;
            }).join('');
        }

        categories.forEach(cat => {
            const catProducts = allProducts.filter(p => p.categoryId === cat.id);
            if (!catProducts.length) return; // Bỏ qua danh mục rỗng

            const section = document.createElement('div');
            section.className = 'category-block';
            section.id = cat.id;
            section.innerHTML = `
                <div class="cyber-section-header" style="margin-top: 40px; margin-bottom: 30px;">
                    <h2 style="font-size: 2rem !important; color: #fff; text-transform: uppercase;">${window.t_cat ? window.t_cat(cat.name) : cat.name}</h2>
                    <p style="color: var(--cyan); margin-top: 5px;">${window.t_feat ? window.t_feat('Những mẫu xe nổi bật nhất chuyên mục') : 'Những mẫu xe nổi bật nhất chuyên mục'}</p>
                </div>
                <div class="cyber-products-grid">
                    ${catProducts.slice(0, 6).map(buildCard).join('')}
                </div>`;
            fragment.appendChild(section);
        });

        catalogContainer.appendChild(fragment); // Chèn 1 lần vào DOM

        // Gắn sự kiện bằng event delegation sau khi DOM sẵn sàng
        attachCatalogEvents();

    } catch (err) {
        // Hiển thị lỗi thân thiện thay vì crash trang
        catalogContainer.innerHTML = `
            <div style="text-align:center;padding:60px;color:#cc0000;">
                <h3>Lỗi tải dữ liệu</h3>
                <p>${err}</p>
            </div>`;
    }

    /**
     * Xây dựng HTML string cho 1 card sản phẩm.
     * Không hiển thị số lượng đã bán.
     * @param {Object} p - Đối tượng sản phẩm từ API
     * @returns {string} HTML string
     */
    function buildCard(p) {
        const randomRating = (4.5 + Math.random() * 0.4).toFixed(1);
        const randomReviews = Math.floor(Math.random() * 300) + 50;
        
        const badge = p.discount ? `<div class="badge-hot">-${p.discount}%</div>` : '';
        const isHot = p.sold > 60 ? `<div class="badge-seller"><i class="ph-fill ph-star"></i> BEST SELLER</div>` : '';
        
        const oldPrice = p.originalPrice
            ? `<span class="cyber-price-old">${fmt(p.originalPrice)}</span>`
            : `<span class="cyber-price-old" style="visibility:hidden">0₫</span>`;

        const features = (p.features || []).slice(0, 2).map(f => `<li>${window.t_feat ? window.t_feat(f) : f}</li>`).join('');

        return `
            <div class="cyber-product-card js-card" data-id="${p.id}">
                <div class="cyber-product-badges">
                    ${isHot}
                    ${badge}
                </div>
                <div class="btn-heart"><i class="ph ph-heart"></i></div>
                <div class="cyber-product-img">
                    <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
                </div>
                <div class="cyber-product-info">
                    <div class="cyber-product-meta">
                        <span class="cyber-cat-tag">${p.categoryId}</span>
                        <div class="cyber-rating">
                            <span><i class="ph-fill ph-star"></i> ${randomRating}</span> (${randomReviews})
                        </div>
                    </div>
                    <div class="cyber-product-title">${window.t_name ? window.t_name(p.name) : p.name}</div>
                    <div class="cyber-product-price-row">
                        <span class="cyber-price">${fmt(p.price)}</span>
                        ${oldPrice}
                    </div>
                    <ul class="cyber-features">
                        ${features}
                        <li>Trọng lượng: ${Math.floor(Math.random()*5 + 7)}.${Math.floor(Math.random()*9)} kg</li>
                    </ul>
                    <div class="cyber-product-actions">
                        <button class="btn-details">Chi Tiết</button>
                        <button class="btn-add-cart" aria-label="Thêm vào giỏ"><i class="ph-bold ph-shopping-cart"></i></button>
                    </div>
                </div>
            </div>`;
    }


    // ============================================================
    // 2. MODAL CHI TIẾT SẢN PHẨM
    // ============================================================

    /**
     * Xây và render nội dung modal cho một sản phẩm.
     * Hàm này là ĐỒNG BỘ hoàn toàn → không gây INP delay.
     * @param {Object} p - Đối tượng sản phẩm
     */
    function renderModal(p) {
        const features = (p.features || [])
            .map(f => `<li><i class="ph-fill ph-check-circle"></i> ${window.t_feat ? window.t_feat(f) : f}</li>`)
            .join('');

        // Render toàn bộ modal 1 lần duy nhất (không double-render như trước)
        productModal.classList.add('active');
        modalBody.innerHTML = `
            <div class="modal-product-grid">
                <div class="modal-product-img">
                    <img src="${p.image}" alt="${p.name}" loading="eager">
                </div>
                <div class="modal-product-info">
                    <h2>${window.t_name ? window.t_name(p.name) : p.name}</h2>
                    <div class="modal-product-price">${fmt(p.price)}</div>
                    <ul class="modal-product-features">${features}</ul>
                    <div class="modal-actions">
                        <button class="btn-primary w-full" id="modalAddCartBtn">
                            ${i18nConfig[currentLang]?.modal_add || '<i class="ph ph-shopping-cart"></i> Thêm vào giỏ hàng'}
                        </button>
                        <button class="btn-secondary w-full">
                            ${i18nConfig[currentLang]?.modal_contact || '<i class="ph ph-phone"></i> Liên hệ mua ngay'}
                        </button>
                    </div>
                </div>
            </div>`;

        document.getElementById('modalAddCartBtn').onclick = () => {
            addToCart(p);
            productModal.classList.remove('active');
        };
    }

    /**
     * Event delegation trên catalogContainer.
     *
     * INP strategy:
     *   - Nếu sản phẩm CÓ trong allProducts cache → gọi renderModal() đồng bộ ngay,
     *     không có await, không có double-render → INP thấp nhất có thể.
     *   - Chỉ dùng async khi cache miss (hiếm): hiện spinner rồi fetch.
     */
    function attachCatalogEvents() {
        catalogContainer.addEventListener('click', e => {
            const btnCart = e.target.closest('.btn-add-cart');
            const card = e.target.closest('.js-card');
            if (!card) return;

            const id = card.dataset.id;
            const p = allProducts.find(x => x.id === id); 

            if (p) {
                if (btnCart) {
                    addToCart(p);
                } else {
                    renderModal(p);
                }
            }
        });
    }

    // Đóng modal khi nhấn X hoặc click vùng tối bên ngoài
    document.getElementById('modalCloseBtn').onclick = () =>
        productModal.classList.remove('active');
    productModal.addEventListener('click', e => {
        if (e.target === productModal) productModal.classList.remove('active');
    });


    // ============================================================
    // 3. GIỎ HÀNG
    // ============================================================

    /**
     * Cập nhật toàn bộ UI giỏ hàng (badge số lượng + danh sách + tổng tiền).
     * Được gọi mỗi khi giỏ hàng thay đổi.
     */
    function syncCartUI() {
        const n = shoppingCart.length;

        // Cập nhật badge số lượng trên header & sidebar
        if (cartCountEl) cartCountEl.textContent = n;
        if (cartSidebarCount) cartSidebarCount.textContent = n;
        if (!cartItemsList) return;

        if (n === 0) {
            cartItemsList.innerHTML = `<div class="empty-cart">${i18nConfig[currentLang]?.cart_empty || '🛒 Giỏ hàng đang trống'}</div>`;
            cartTotalEl.textContent = '0 ₫';
            return;
        }

        // Tính tổng tiền và render danh sách sản phẩm
        let total = 0;
        cartItemsList.innerHTML = shoppingCart.map((item, i) => {
            total += item.price;
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${window.t_name ? window.t_name(item.name) : item.name}</div>
                        <div class="cart-item-price">${fmt(item.price)}</div>
                        <button class="cart-item-remove" onclick="window.removeFromCart(${i})">${i18nConfig[currentLang]?.remove || 'Xóa'}</button>
                    </div>
                </div>`;
        }).join('');
        cartTotalEl.textContent = fmt(total);
    }

    /** Thêm sản phẩm vào giỏ và lưu localStorage */
    function addToCart(product) {
        shoppingCart.push(product);
        localStorage.setItem('sdb_cart', JSON.stringify(shoppingCart));
        syncCartUI();
        cartOverlay.classList.add('active');
    }

    /** Xóa sản phẩm khỏi giỏ theo chỉ số mảng */
    window.removeFromCart = i => {
        shoppingCart.splice(i, 1);
        localStorage.setItem('sdb_cart', JSON.stringify(shoppingCart));
        syncCartUI();
    };

    // Sự kiện mở/đóng sidebar giỏ hàng
    document.getElementById('cartBtnHeader').onclick = () => cartOverlay.classList.add('active');
    document.getElementById('cartCloseBtn').onclick = () => cartOverlay.classList.remove('active');
    cartOverlay.addEventListener('click', e => {
        if (e.target === cartOverlay) cartOverlay.classList.remove('active');
    });

    // Xử lý nút Thanh Toán
    document.getElementById('checkoutBtn').onclick = () => {
        if (!currentUser) {
            cartOverlay.classList.remove('active');
            authModal.classList.add('active');
            alert('Vui lòng đăng nhập để thanh toán!');
            return;
        }
        if (!shoppingCart.length) { alert('Giỏ hàng đang trống!'); return; }

        const total = shoppingCart.reduce((sum, item) => sum + item.price, 0);
        alert(`✅ Đặt hàng thành công!\nTổng tiền: ${fmt(total)}`);

        shoppingCart = [];
        localStorage.setItem('sdb_cart', JSON.stringify(shoppingCart));
        syncCartUI();
        cartOverlay.classList.remove('active');
    };

    syncCartUI(); // Khôi phục trạng thái giỏ hàng từ localStorage khi tải trang


    // ============================================================
    // 4. ĐĂNG NHẬP / ĐĂNG KÝ
    // ============================================================
    const loginTrigger = document.getElementById('loginBtnTrigger');
    const authCloseBtn = document.getElementById('authCloseBtn');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authToggleLink = document.getElementById('authToggleLink');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authToggleText = document.getElementById('authToggleText');
    const loginLabel = document.getElementById('loginLabel');
    const userInp = document.getElementById('authUsername');
    const passInp = document.getElementById('authPassword');
    const phoneGrp = document.getElementById('authPhoneGroup');
    const phoneInp = document.getElementById('authPhone');

    let isLoginMode = true; // true = đăng nhập, false = đăng ký

    /** Cập nhật tên hiển thị trên nút header: tên user hoặc "Đăng nhập" */
    function updateAuthHeader() {
        if (currentUser) {
            loginLabel.textContent = currentUser.username;
            loginTrigger.title = 'Nhấn để đăng xuất';
        } else {
            loginLabel.textContent = i18nConfig[currentLang]?.login || 'Đăng nhập';
            loginTrigger.title = '';
        }
    }

    // Nhấn nút header: nếu đã đăng nhập thì xác nhận đăng xuất, ngược lại mở modal
    loginTrigger.onclick = () => {
        if (currentUser) {
            if (confirm(`Đăng xuất khỏi "${currentUser.username}"?`)) {
                currentUser = null;
                localStorage.removeItem('sdb_user');
                updateAuthHeader();
            }
        } else {
            authModal.classList.add('active');
        }
    };

    // Đóng modal auth
    authCloseBtn.onclick = () => authModal.classList.remove('active');
    authModal.addEventListener('click', e => {
        if (e.target === authModal) authModal.classList.remove('active');
    });

    // Chuyển đổi giữa chế độ Đăng nhập ↔ Đăng ký
    authToggleLink.onclick = e => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        const d = i18nConfig[currentLang];
        authTitle.textContent = isLoginMode ? d.auth_title_login : d.auth_title_reg;
        authSubtitle.textContent = isLoginMode ? d.auth_sub_login : d.auth_sub_reg;
        authSubmitBtn.textContent = isLoginMode ? d.auth_btn_login : d.auth_btn_reg;
        authToggleText.textContent = isLoginMode ? d.auth_text_login : d.auth_text_reg;
        authToggleLink.textContent = isLoginMode ? d.auth_link_login : d.auth_link_reg;
        if (phoneGrp) phoneGrp.style.display = isLoginMode ? 'none' : 'block';
    };

    // Xử lý submit form đăng nhập / đăng ký
    authSubmitBtn.onclick = () => {
        const u = userInp.value.trim();
        const p = passInp.value.trim();
        if (!u || !p) { alert('Vui lòng điền đầy đủ thông tin.'); return; }

        if (isLoginMode) {
            // Đăng nhập: tìm user khớp username + password (tài khoản thường)
            const found = usersDb.find(x => x.username === u && x.password === p && (x.provider === 'local' || !x.provider));
            if (found) {
                currentUser = found;
                localStorage.setItem('sdb_user', JSON.stringify(found));
                authModal.classList.remove('active');
                updateAuthHeader();
                const d = i18nConfig[currentLang];
                showToast(d.toast_login.replace('{name}', found.name || found.username));
            } else {
                alert('Sai tên đăng nhập hoặc mật khẩu.');
            }
        } else {
            // Đăng ký: kiểm tra tên chưa tồn tại rồi tạo tài khoản mới
            if (usersDb.find(x => x.username === u && (x.provider === 'local' || !x.provider))) {
                alert('Tên này đã được dùng, vui lòng chọn tên khác.');
                return;
            }
            const ph = phoneInp ? phoneInp.value.trim() : '';
            if (!ph) { alert('Vui lòng nhập số điện thoại.'); return; }
            
            const newUser = { 
                id: 'local_' + Date.now(),
                username: u, 
                password: p, 
                phone: ph,
                provider: 'local',
                socialId: null,
                name: u 
            };
            usersDb.push(newUser);
            localStorage.setItem('sdb_users', JSON.stringify(usersDb));
            currentUser = newUser;
            localStorage.setItem('sdb_user', JSON.stringify(newUser));
            authModal.classList.remove('active');
            updateAuthHeader();
            const d = i18nConfig[currentLang];
            showToast(d.toast_reg.replace('{name}', newUser.name || newUser.username));
        }

        // Xóa form sau khi xử lý xong
        userInp.value = '';
        passInp.value = '';
        if (phoneInp) phoneInp.value = '';
    };

    // ============================================================
    // Đăng nhập Social (Google / Facebook) - Mock Flow
    // ============================================================
    const fbBtn = document.getElementById('authFacebookBtn');
    const googleBtn = document.getElementById('authGoogleBtn');

    function handleSocialLogin(provider) {
        // Tạo thông tin nhận diện tài khoản mạng xã hội ngẫu nhiên
        const socialId = provider.toUpperCase() + '-' + Math.floor(Math.random() * 100000);
        const randomName = provider === 'google' ? 'Google User' : 'Facebook User';
        const displayUsername = provider + '_' + Math.floor(Math.random() * 1000);

        // Trong thực tế, bạn sẽ kiểm tra theo socialId. Cấu trúc mock này mỗi lần bấm sẽ ngẫu nhiên (chưa lưu state đăng nhập thật với api).
        // Tuy nhiên để mô phỏng cơ sở dữ liệu, ta sẽ coi mỗi lần bấm đăng nhập social là tạo một phiên mới với user ngẫu nhiên
        // HOẶC giả lập bằng cách chỉ tìm user đầu tiên của mxh đó để ghi nhớ.
        let foundUser = usersDb.find(x => x.provider === provider);

        if (!foundUser) {
            foundUser = {
                id: 'social_' + Date.now(),
                username: displayUsername,
                password: '',
                phone: '',
                provider: provider,
                socialId: socialId,
                name: randomName
            };
            usersDb.push(foundUser);
            localStorage.setItem('sdb_users', JSON.stringify(usersDb));
        }

        currentUser = foundUser;
        localStorage.setItem('sdb_user', JSON.stringify(foundUser));
        
        authModal.classList.remove('active');
        updateAuthHeader();
        const d = i18nConfig[currentLang];
        showToast(d.toast_login.replace('{name}', foundUser.name || foundUser.username));
    }

    if (fbBtn) fbBtn.onclick = () => handleSocialLogin('facebook');
    if (googleBtn) googleBtn.onclick = () => handleSocialLogin('google');

    updateAuthHeader(); // Khôi phục trạng thái đăng nhập từ localStorage

    // ============================================================
    // TOAST NOTIFICATION
    // ============================================================
    function showToast(message) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="ph-fill ph-check-circle" style="color: #22c55e; font-size: 1.2rem; margin-right: 8px;"></i> ${message}`;
        container.appendChild(toast);

        // Kích hoạt transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        // Ẩn sau 2 giây
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); 
        }, 2000); 
    }


    // ============================================================
    // 5. CHAT WIDGET
    // ============================================================
    const helpBtn = document.querySelector('.floating-help-btn');
    const chatWidget = document.getElementById('chatWidget');
    const chatClose = document.getElementById('chatCloseBtn');
    const chatSend = document.getElementById('chatSendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatBody = document.getElementById('chatBody');

    // Câu trả lời tự động của bot, xoay vòng lần lượt
    const botReplies = () => {
        const d = i18nConfig[currentLang];
        return [d.bot_r1, d.bot_r2, d.bot_r3, d.bot_r4];
    };
    let replyIdx = 0;

    // Mở/đóng widget chat
    helpBtn.onclick = () => {
        chatWidget.classList.toggle('active');
        if (chatWidget.classList.contains('active')) chatInput.focus();
    };
    chatClose.onclick = () => chatWidget.classList.remove('active');

    /**
     * Thêm một tin nhắn vào khung chat.
     * @param {string} text - Nội dung tin nhắn
     * @param {'user'|'bot'} type - Người gửi
     */
    function addMsg(text, type) {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        div.textContent = text;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight; // Cuộn xuống cuối
    }

    /** Gửi tin nhắn của user và tự động trả lời sau 800ms */
    function sendChat() {
        const text = chatInput.value.trim();
        if (!text) return;
        addMsg(text, 'user');
        chatInput.value = '';
        setTimeout(() => addMsg(botReplies()[replyIdx++ % botReplies().length], 'bot'), 800);
    }

    chatSend.onclick = sendChat;
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendChat(); });


    // ============================================================
    // TIỆN ÍCH
    // ============================================================

    /**
     * Định dạng số tiền sang chuỗi VND.
     * @param {number} n
     * @returns {string} VD: "1.500.000 ₫"
     */
    function fmt(n) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(n);
    }

    /**
     * Tạo debounce wrapper để trì hoãn gọi hàm cho đến khi người dùng
     * ngừng gõ trong khoảng thời gian `delay` ms.
     * Dùng cho search input để tránh filter chạy mỗi keystroke.
     * @param {Function} fn
     * @param {number} delay - ms
     * @returns {Function}
     */
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }


    // ============================================================
    // 6. SEARCH – GỢI Ý TÌM KIẾM TRỰC TIẾP
    // ============================================================
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');

    // allProducts đã được cache từ bước 1 → không cần gọi API thêm lần nào

    /**
     * In đậm phần văn bản khớp với từ khóa tìm kiếm.
     * @param {string} text - Tên sản phẩm đầy đủ
     * @param {string} query - Từ khóa người dùng nhập
     * @returns {string} HTML string với <mark> bao quanh phần khớp
     */
    function highlightMatch(text, query) {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape ký tự đặc biệt
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Hiển thị danh sách gợi ý dựa trên từ khóa.
     * Sử dụng event delegation trên searchSuggestions để xử lý click gợi ý.
     * @param {string} query
     */
    function showSuggestions(query) {
        if (!query) {
            searchSuggestions.classList.remove('open');
            return;
        }

        const q = query.toLowerCase();
        const matches = allProducts
            .filter(p => {
                const n = window.t_name ? window.t_name(p.name) : p.name;
                return n.toLowerCase().includes(q);
            })
            .slice(0, 6); // Giới hạn tối đa 6 gợi ý để tránh overflow giao diện

        if (matches.length === 0) {
            searchSuggestions.innerHTML =
                `<div class="suggestion-no-result">Không tìm thấy kết quả cho "<b>${query}</b>"</div>`;
        } else {
            searchSuggestions.innerHTML = matches.map(p => `
                <div class="suggestion-item" data-id="${p.id}">
                    <i class="ph ph-bicycle"></i>
                    <span>${highlightMatch(window.t_name ? window.t_name(p.name) : p.name, query)}</span>
                    <span class="suggestion-price">${fmt(p.price)}</span>
                </div>
            `).join('');
        }

        searchSuggestions.classList.add('open');
    }

    const searchBtnTrigger = document.getElementById('searchBtnTrigger');
    const searchDropdown = document.getElementById('searchDropdown');

    if (searchBtnTrigger && searchDropdown) {
        searchBtnTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = searchDropdown.style.display === 'block';
            searchDropdown.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) {
                searchInput.focus();
            }
        });
        
        document.addEventListener('click', e => {
            if (!searchBtnTrigger.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
                if (searchSuggestions) searchSuggestions.classList.remove('open');
            }
        });
    }

    if (searchInput) {
        // Debounce 180ms: người dùng gõ liên tục sẽ chỉ trigger filter sau 180ms nghỉ
        searchInput.addEventListener('input', debounce(() =>
            showSuggestions(searchInput.value.trim()), 180));

        // Event delegation: 1 listener cho tất cả suggestion items
        searchSuggestions.addEventListener('click', e => {
            const item = e.target.closest('.suggestion-item');
            if (!item) return;
            // Giả lập click vào card tương ứng để mở modal chi tiết
            const card = catalogContainer.querySelector(`.js-card[data-id="${item.dataset.id}"]`);
            if (card) card.click();
            searchSuggestions.classList.remove('open');
            searchInput.value = '';
        });

        // Đóng dropdown khi nhấn phím Escape
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') searchSuggestions.classList.remove('open');
        });
    }

    // ============================================================
    // 7. HERO SLIDESHOW (Đã loại bỏ để tối ưu LCP - dùng thẻ img trực tiếp)
    // ============================================================

    // ============================================================
    // 8. THEME TOGGLE
    // ============================================================
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const rootEl = document.documentElement;

    // Giao diện đã được set trong head của HTML, chỉ cần đổi icon cho khớp
    if (rootEl.getAttribute('data-theme') === 'dark') {
        if (themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun');
    }

    if (themeToggleBtn && themeIcon) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootEl.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                rootEl.removeAttribute('data-theme');
                localStorage.setItem('sdb_theme', 'light');
                themeIcon.classList.replace('ph-sun', 'ph-moon');
            } else {
                rootEl.setAttribute('data-theme', 'dark');
                localStorage.setItem('sdb_theme', 'dark');
                themeIcon.classList.replace('ph-moon', 'ph-sun');
            }
        });
    }

    // ============================================================
    // 9. LOGO BACKGROUND REMOVAL (CANVAS)
    // ============================================================
    const logoImg = new Image();
    logoImg.src = "logo.png";
    logoImg.onload = () => {
        document.querySelectorAll('.logo-canvas').forEach(canvas => {
            const ctx = canvas.getContext('2d', {willReadFrequently: true});
            const hRatio = canvas.width / logoImg.width;
            const vRatio = canvas.height / logoImg.height;
            const ratio  = Math.min(hRatio, vRatio);
            const w = logoImg.width * ratio;
            const h = logoImg.height * ratio;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;  
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(logoImg, 0, 0, logoImg.width, logoImg.height, x, y, w, h);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for(let i = 0; i < data.length; i += 4) {
                if (data[i+3] === 0) continue;
                // Calculate luma to determine if it's white background or dark text
                const luma = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
                const alpha = 255 - luma; // White luma 255 -> alpha 0
                
                data[i] = 255; 
                data[i+1] = 255; 
                data[i+2] = 255;
                data[i+3] = Math.min(255, alpha * 1.5);
            }
            ctx.putImageData(imageData, 0, 0);
        });
    };

}); // end DOMContentLoaded
