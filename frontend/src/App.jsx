import React, { Suspense, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { PageLoader } from './components/common/UI';

// ── Lazy-loaded Pages ──────────────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VendorRegisterPage = lazy(() => import('./pages/auth/VendorRegisterPage'));

// User
const CartPage = lazy(() => import('./pages/user/CartPage'));
const CheckoutPage = lazy(() => import('./pages/user/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/user/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const UserSessions = lazy(() => import('./pages/user/UserSessions'));

// Vendor
const VendorLayout = lazy(() => import('./pages/vendor/VendorLayout'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorSessions = lazy(() => import('./pages/vendor/VendorSessions'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'));

// Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));

// ── App Layout (with Navbar/Footer) ───────────────────────────────────────
// memo + defined OUTSIDE App() so it never unmounts on parent re-render
const AppLayout = memo(({ children }) => (
    <>
        <Navbar />
        <main>{children}</main>
        <Footer />
    </>
));

// ── Main App ───────────────────────────────────────────────────────────────
function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PageLoader message="Loading Loom Look..." /></div>}>
                        <Routes>
                            {/* ── PUBLIC ROUTES ── */}
                            <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
                            <Route path="/shop" element={<AppLayout><ShopPage /></AppLayout>} />
                            <Route path="/product/:id" element={<AppLayout><ProductDetailPage /></AppLayout>} />
                            <Route path="/sessions" element={<AppLayout><SessionsPage /></AppLayout>} />

                            {/* ── AUTH ── */}
                            <Route path="/login" element={<LoginPage role="user" />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/vendor/login" element={<LoginPage role="vendor" />} />
                            <Route path="/vendor/register" element={<VendorRegisterPage />} />
                            <Route path="/admin/login" element={<LoginPage role="admin" />} />

                            {/* ── USER (protected) ── */}
                            <Route path="/cart" element={
                                <ProtectedRoute allowedRoles={['user']}>
                                    <AppLayout><CartPage /></AppLayout>
                                </ProtectedRoute>
                            } />
                            <Route path="/checkout" element={
                                <ProtectedRoute allowedRoles={['user']}>
                                    <AppLayout><CheckoutPage /></AppLayout>
                                </ProtectedRoute>
                            } />
                            <Route path="/orders" element={
                                <ProtectedRoute allowedRoles={['user']}>
                                    <AppLayout><OrdersPage /></AppLayout>
                                </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                                <ProtectedRoute allowedRoles={['user']}>
                                    <AppLayout><ProfilePage /></AppLayout>
                                </ProtectedRoute>
                            } />
                            <Route path="/my-sessions" element={
                                <ProtectedRoute allowedRoles={['user']}>
                                    <AppLayout><UserSessions /></AppLayout>
                                </ProtectedRoute>
                            } />

                            {/* ── VENDOR (nested) ── */}
                            <Route path="/vendor" element={
                                <ProtectedRoute allowedRoles={['vendor']}>
                                    <VendorLayout />
                                </ProtectedRoute>
                            }>
                                <Route path="dashboard" element={<VendorDashboard />} />
                                <Route path="products" element={<VendorProducts />} />
                                <Route path="sessions" element={<VendorSessions />} />
                                <Route path="orders" element={<VendorOrders />} />
                                <Route path="profile" element={<VendorProfile />} />
                                <Route index element={<Navigate to="dashboard" replace />} />
                            </Route>

                            {/* ── ADMIN (nested) ── */}
                            <Route path="/admin" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }>
                                <Route path="dashboard" element={<AdminDashboard />} />
                                <Route path="users" element={<AdminUsers />} />
                                <Route path="vendors" element={<AdminVendors />} />
                                <Route index element={<Navigate to="dashboard" replace />} />
                            </Route>

                            {/* ── 404 ── */}
                            <Route path="*" element={
                                <AppLayout>
                                    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ fontSize: '5rem' }}>🧵</div>
                                        <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Page Not Found</h2>
                                        <p style={{ color: 'var(--text-light)' }}>The thread you're following leads nowhere...</p>
                                        <a href="/" className="btn btn-primary">← Return Home</a>
                                    </div>
                                </AppLayout>
                            } />
                        </Routes>
                    </Suspense>

                    <ToastContainer
                        position="bottom-right"
                        autoClose={3500}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        theme="colored"
                        toastStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
                    />
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
