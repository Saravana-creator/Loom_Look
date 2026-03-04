import api from './api';

// ── Auth Services ──────────────────────────────────────────────────────────
export const authService = {
    registerUser: (data) => api.post('/auth/register', data),
    loginUser: (data) => api.post('/auth/login', data),
    registerVendor: (data) => api.post('/auth/vendor/register', data),
    loginVendor: (data) => api.post('/auth/vendor/login', data),
    loginAdmin: (data) => api.post('/auth/admin/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/me', data),
    refreshToken: () => api.post('/auth/refresh'),
};

// ── Product Services ───────────────────────────────────────────────────────
export const productService = {
    getProducts: (params) => api.get('/products', { params }),
    getProduct: (id) => api.get(`/products/${id}`),
    createProduct: (data) => api.post('/products/vendor/create', data),
    updateProduct: (id, data) => api.put(`/products/vendor/${id}`, data),
    deleteProduct: (id) => api.delete(`/products/vendor/${id}`),
    getMyProducts: (params) => api.get('/products/vendor/my-products', { params }),
    getAllProductsAdmin: (params) => api.get('/products/admin/all', { params }),
    addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
};

// ── Cart Services ──────────────────────────────────────────────────────────
export const cartService = {
    getCart: () => api.get('/cart'),
    addToCart: (data) => api.post('/cart', data),
    updateCartItem: (productId, data) => api.put(`/cart/${productId}`, data),
    removeFromCart: (productId) => api.delete(`/cart/${productId}`),
    clearCart: () => api.delete('/cart'),
};

// ── Order Services ─────────────────────────────────────────────────────────
export const orderService = {
    createOrder: (data) => api.post('/orders', data),
    verifyPayment: (data) => api.post('/orders/verify-payment', data),
    getMyOrders: (params) => api.get('/orders/my-orders', { params }),
    getOrder: (id) => api.get(`/orders/my-orders/${id}`),
    getVendorOrders: (params) => api.get('/orders/vendor/orders', { params }),
    getAllOrdersAdmin: (params) => api.get('/orders/admin/all', { params }),
    updateOrderStatus: (id, data) => api.put(`/orders/admin/${id}/status`, data),
};

// ── Session Services ───────────────────────────────────────────────────────
export const sessionService = {
    getSessions: (params) => api.get('/sessions', { params }),
    getSession: (id) => api.get(`/sessions/${id}`),
    bookSession: (id) => api.post(`/sessions/${id}/book`),
    joinSession: (id) => api.get(`/sessions/${id}/join`),
    getMyBookings: () => api.get('/sessions/my-bookings'),
    createSession: (data) => api.post('/sessions/vendor/create', data),
    updateSession: (id, data) => api.put(`/sessions/vendor/${id}`, data),
    deleteSession: (id) => api.delete(`/sessions/vendor/${id}`),
    getMyVendorSessions: (params) => api.get('/sessions/vendor/my-sessions', { params }),
};

// ── Admin Services ─────────────────────────────────────────────────────────
export const adminService = {
    getDashboard: () => api.get('/admin/dashboard'),
    // Users
    getUsers: (params) => api.get('/admin/users', { params }),
    suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
    activateUser: (id) => api.put(`/admin/users/${id}/activate`),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    // Vendors
    getVendors: (params) => api.get('/admin/vendors', { params }),
    approveVendor: (id) => api.put(`/admin/vendors/${id}/approve`),
    rejectVendor: (id) => api.put(`/admin/vendors/${id}/reject`),
    suspendVendor: (id) => api.put(`/admin/vendors/${id}/suspend`),
    deleteVendor: (id) => api.delete(`/admin/vendors/${id}`),
    // Products
    getAdminProducts: (params) => api.get('/admin/products', { params }),
    // Orders
    getAdminOrders: (params) => api.get('/admin/orders', { params }),
    updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
    // Mail
    getMails: (params) => api.get('/admin/mail', { params }),
    createMailAccount: (data) => api.post('/admin/mail', data),
    suspendMail: (id, data) => api.put(`/admin/mail/${id}/suspend`, data),
    activateMail: (id) => api.put(`/admin/mail/${id}/activate`),
    deleteMail: (id) => api.delete(`/admin/mail/${id}`),
    updateMailConfig: (id, data) => api.put(`/admin/mail/${id}/config`, data),
    getMailActivity: (id) => api.get(`/admin/mail/${id}/activity`),
};
