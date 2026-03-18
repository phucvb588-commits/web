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
        const data = await sdbAPI.fetchAllData();
        allProducts = data.products || []; // Cache để search dùng lại, không cần gọi API lần 2

        const categories = data.categories || [];
        catalogContainer.innerHTML = ''; // Xóa loading spinner

        // Dùng DocumentFragment để gom các DOM node, chèn vào trang 1 lần duy nhất
        // → giảm số lần reflow so với innerHTML += nhiều lần
        const fragment = document.createDocumentFragment();

        categories.forEach(cat => {
            const catProducts = allProducts.filter(p => p.categoryId === cat.id);
            if (!catProducts.length) return; // Bỏ qua danh mục rỗng

            const section = document.createElement('div');
            section.className = 'category-block';
            section.id = cat.id;
            section.innerHTML = `
                <div class="section-header">
                    <h2>${cat.name}</h2>
                    <a href="#">Xem tất cả →</a>
                </div>
                <div class="products-grid">
                    ${catProducts.map(buildCard).join('')}
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
        // Badge giảm giá (chỉ hiện nếu sản phẩm có trường discount)
        const badge = p.discount
            ? `<div class="discount-badge">-${p.discount}%</div>`
            : '';

        // Giá gốc bị gạch (chỉ hiện nếu có originalPrice)
        const oldPrice = p.originalPrice
            ? `<span class="product-old-price">${fmt(p.originalPrice)}</span>`
            : '';

        return `
            <div class="product-card js-card" data-id="${p.id}">
                ${badge}
                <div class="product-img-wrapper">
                    <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
                </div>
                <div class="product-name">${p.name}</div>
                <div>
                    <span class="product-price">${fmt(p.price)}</span>${oldPrice}
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
            .map(f => `<li><i class="ph-fill ph-check-circle"></i> ${f}</li>`)
            .join('');

        // Render toàn bộ modal 1 lần duy nhất (không double-render như trước)
        productModal.classList.add('active');
        modalBody.innerHTML = `
            <div class="modal-product-grid">
                <div class="modal-product-img">
                    <img src="${p.image}" alt="${p.name}" loading="eager">
                </div>
                <div class="modal-product-info">
                    <h2>${p.name}</h2>
                    <div class="modal-product-price">${fmt(p.price)}</div>
                    <ul class="modal-product-features">${features}</ul>
                    <div class="modal-actions">
                        <button class="btn-primary w-full" id="modalAddCartBtn">
                            <i class="ph ph-shopping-cart"></i> Thêm vào giỏ hàng
                        </button>
                        <button class="btn-secondary w-full">
                            <i class="ph ph-phone"></i> Liên hệ mua ngay
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
            const card = e.target.closest('.js-card');
            if (!card) return;

            const id = card.dataset.id;
            const p = allProducts.find(x => x.id === id); // Tìm trong cache — O(n), đồng bộ

            if (p) {
                // ✅ Cache hit: render ngay trong cùng frame với click → INP tối ưu
                renderModal(p);
                return;
            }

            // ⚠️ Cache miss (hiếm): dùng spinner + async fetch làm fallback
            productModal.classList.add('active');
            modalBody.innerHTML = `
                <div style="text-align:center;padding:60px;">
                    <i class="ph ph-circle-notch"
                       style="font-size:1.8rem;animation:spin 1s linear infinite;color:#cc0000;">
                    </i>
                </div>`;
            sdbAPI.getProductDetails(id).then(prod => {
                if (prod) renderModal(prod);
            });
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
            cartItemsList.innerHTML = `<div class="empty-cart">🛒 Giỏ hàng đang trống</div>`;
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
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${fmt(item.price)}</div>
                        <button class="cart-item-remove" onclick="window.removeFromCart(${i})">Xóa</button>
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

    let isLoginMode = true; // true = đăng nhập, false = đăng ký

    /** Cập nhật tên hiển thị trên nút header: tên user hoặc "Đăng nhập" */
    function updateAuthHeader() {
        if (currentUser) {
            loginLabel.textContent = currentUser.username;
            loginTrigger.title = 'Nhấn để đăng xuất';
        } else {
            loginLabel.textContent = 'Đăng nhập';
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
        authTitle.textContent = isLoginMode ? 'Đăng Nhập' : 'Đăng Ký';
        authSubtitle.textContent = isLoginMode ? 'Chào mừng bạn trở lại!' : 'Tạo tài khoản mới';
        authSubmitBtn.textContent = isLoginMode ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ';
        authToggleText.textContent = isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?';
        authToggleLink.textContent = isLoginMode ? 'Đăng ký ngay' : 'Đăng nhập';
    };

    // Xử lý submit form đăng nhập / đăng ký
    authSubmitBtn.onclick = () => {
        const u = userInp.value.trim();
        const p = passInp.value.trim();
        if (!u || !p) { alert('Vui lòng điền đầy đủ thông tin.'); return; }

        if (isLoginMode) {
            // Đăng nhập: tìm user khớp username + password
            const found = usersDb.find(x => x.username === u && x.password === p);
            if (found) {
                currentUser = found;
                localStorage.setItem('sdb_user', JSON.stringify(found));
                authModal.classList.remove('active');
                updateAuthHeader();
                alert(`Chào mừng ${found.username}! 🎉`);
            } else {
                alert('Sai tên đăng nhập hoặc mật khẩu.');
            }
        } else {
            // Đăng ký: kiểm tra tên chưa tồn tại rồi tạo tài khoản mới
            if (usersDb.find(x => x.username === u)) {
                alert('Tên này đã được dùng, vui lòng chọn tên khác.');
                return;
            }
            const newUser = { username: u, password: p };
            usersDb.push(newUser);
            localStorage.setItem('sdb_users', JSON.stringify(usersDb));
            currentUser = newUser;
            localStorage.setItem('sdb_user', JSON.stringify(newUser));
            authModal.classList.remove('active');
            updateAuthHeader();
            alert(`Đăng ký thành công! Chào ${newUser.username} 🎉`);
        }

        // Xóa form sau khi xử lý xong
        userInp.value = '';
        passInp.value = '';
    };

    updateAuthHeader(); // Khôi phục trạng thái đăng nhập từ localStorage


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
    const botReplies = [
        'Chào bạn! Mình có thể hỗ trợ gì cho bạn?',
        'Chính sách đổi trả trong 30 ngày, bạn yên tâm nhé!',
        'Miễn phí vận chuyển cho đơn hàng từ 500.000₫.',
        'Liên hệ hotline 1800 1234 để được tư vấn trực tiếp.',
    ];
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
        setTimeout(() => addMsg(botReplies[replyIdx++ % botReplies.length], 'bot'), 800);
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
            .filter(p => p.name.toLowerCase().includes(q))
            .slice(0, 6); // Giới hạn tối đa 6 gợi ý để tránh overflow giao diện

        if (matches.length === 0) {
            searchSuggestions.innerHTML =
                `<div class="suggestion-no-result">Không tìm thấy kết quả cho "<b>${query}</b>"</div>`;
        } else {
            searchSuggestions.innerHTML = matches.map(p => `
                <div class="suggestion-item" data-id="${p.id}">
                    <i class="ph ph-bicycle"></i>
                    <span>${highlightMatch(p.name, query)}</span>
                    <span class="suggestion-price">${fmt(p.price)}</span>
                </div>
            `).join('');
        }

        searchSuggestions.classList.add('open');
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

        // Đóng dropdown khi click bên ngoài search wrapper
        document.addEventListener('click', e => {
            if (!searchInput.closest('.search-wrapper').contains(e.target)) {
                searchSuggestions.classList.remove('open');
            }
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

}); // end DOMContentLoaded
