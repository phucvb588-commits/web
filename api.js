/**
 * api.js – SD'bike Fake Product API
 *
 * Mô phỏng một REST API thực bằng cách đọc dữ liệu từ file database.json cục bộ.
 * Có tích hợp sẵn tùy chọn dùng Google Custom Search API để lấy ảnh sản phẩm tự động.
 */

class FakeProductAPI {
    /**
     * @param {string} databaseUrl - Đường dẫn tới file JSON chứa dữ liệu sản phẩm
     */
    constructor(databaseUrl) {
        this.databaseUrl = databaseUrl;

        // ── Google Custom Search (tùy chọn) ──────────────────────────────────
        // Thay bằng API_KEY và SEARCH_ENGINE_ID thật để tự động lấy ảnh từ Google.
        // Nếu để giá trị mặc định, tính năng này bị tắt và ảnh trong JSON được dùng.
        this.GOOGLE_API_KEY = 'API_KEY';
        this.GOOGLE_CX = 'SEARCH_ENGINE_ID';
    }

    // ── Tiện ích ──────────────────────────────────────────────────────────────

    /**
     * Định dạng số tiền sang chuỗi VND (ví dụ: 1.500.000 ₫)
     * @param {number} amount
     * @returns {string}
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // ── Google Image Search ───────────────────────────────────────────────────

    /**
     * Lấy ảnh sản phẩm từ Google Custom Search API.
     * Chỉ hoạt động khi đã cung cấp GOOGLE_API_KEY và GOOGLE_CX thật.
     * @param {string} productName - Tên sản phẩm cần tìm ảnh
     * @returns {Promise<string|null>} URL ảnh hoặc null nếu thất bại
     */
    async fetchImageForProduct(productName) {
        if (this.GOOGLE_API_KEY === 'API_KEY' || this.GOOGLE_CX === 'SEARCH_ENGINE_ID') {
            return null; // Chưa cấu hình → bỏ qua
        }

        try {
            const url = `https://www.googleapis.com/customsearch/v1`
                + `?q=${encodeURIComponent(productName)}`
                + `&searchType=image`
                + `&key=${this.GOOGLE_API_KEY}`
                + `&cx=${this.GOOGLE_CX}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Lỗi kết nối Google API');

            const data = await res.json();
            return data.items?.[0]?.link ?? null; // Trả về ảnh đầu tiên tìm được
        } catch (err) {
            console.error('[API] Lỗi lấy ảnh Google:', err);
            return null;
        }
    }

    // ── Dữ liệu chính ─────────────────────────────────────────────────────────

    /**
     * Lấy toàn bộ danh mục và sản phẩm từ database.json.
     * Kết quả được lưu vào this._cache sau lần tải đầu tiên.
     * Các lần gọi sau (getProductDetails, getProductsByCategory, search...)
     * trả về ngay từ cache — không có độ trễ 600ms.
     *
     * @returns {Promise<{categories: Array, products: Array}>}
     */
    async fetchAllData() {
        // Cache hit: trả về ngay, không fetch lại
        if (this._cache) return this._cache;

        try {
            // Mô phỏng độ trễ mạng — chỉ xảy ra 1 lần duy nhất
            await new Promise(r => setTimeout(r, 600));

            const res = await fetch(this.databaseUrl);
            if (!res.ok) throw new Error('Không thể kết nối cơ sở dữ liệu');

            const data = await res.json();

            /* ── Bật tính năng lấy ảnh tự động (cần API_KEY thật) ──
            if (this.GOOGLE_API_KEY !== 'API_KEY') {
                for (const product of data.products) {
                    const img = await this.fetchImageForProduct(product.name);
                    if (img) product.image = img;
                }
            }
            ── ─────────────────────────────────────────────────────── */

            this._cache = data; // Lưu cache để tái sử dụng
            return this._cache;
        } catch (err) {
            console.error('[API] Lỗi fetchAllData:', err);
            return { categories: [], products: [] };
        }
    }

    /**
     * Lọc sản phẩm theo ID danh mục.
     * @param {string} categoryId
     * @returns {Promise<Array>}
     */
    async getProductsByCategory(categoryId) {
        const data = await this.fetchAllData();
        return data.products.filter(p => p.categoryId === categoryId);
    }

    /**
     * Tìm một sản phẩm theo ID.
     * @param {string} productId
     * @returns {Promise<Object|undefined>}
     */
    async getProductDetails(productId) {
        const data = await this.fetchAllData();
        return data.products.find(p => p.id === productId);
    }
}

// Khởi tạo instance duy nhất dùng chung toàn bộ trang
const sdbAPI = new FakeProductAPI('./database.json');
