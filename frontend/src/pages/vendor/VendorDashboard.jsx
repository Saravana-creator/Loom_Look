import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, orderService } from '../../services';
import { PageLoader, Badge } from '../../components/common/UI';

const VendorDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [prodRes, ordRes] = await Promise.all([
                    productService.getMyProducts({ limit: 5 }),
                    orderService.getVendorOrders({ limit: 5 }),
                ]);
                setProducts(prodRes.data.data);
                setRecentOrders(ordRes.data.data);
                // Calculate stats from products
                const totalRevenue = ordRes.data.data.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                const inStock = prodRes.data.data.filter((p) => p.stock > 0).length;
                setStats({
                    productCount: prodRes.data.pagination?.totalItems || prodRes.data.data.length,
                    orderCount: ordRes.data.pagination?.totalItems || ordRes.data.data.length,
                    revenue: totalRevenue,
                    inStock,
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Vendor Dashboard</h1>
                <Link to="/vendor/products/new" className="btn btn-primary btn-sm">+ Add Product</Link>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {[
                    { icon: '🧵', label: 'Total Products', value: stats?.productCount || 0, color: 'orange' },
                    { icon: '📦', label: 'Total Orders', value: stats?.orderCount || 0, color: 'blue' },
                    { icon: '💰', label: 'Revenue (recent)', value: `₹${(stats?.revenue || 0).toLocaleString('en-IN')}`, color: 'green' },
                    { icon: '✅', label: 'In Stock', value: stats?.inStock || 0, color: 'gold' },
                ].map(({ icon, label, value, color }) => (
                    <div key={label} className="stat-card">
                        <div className={`stat-icon ${color}`}>{icon}</div>
                        <div className="stat-info">
                            <div className="stat-value">{value}</div>
                            <div className="stat-label">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Recent Products */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem' }}>Recent Products</h3>
                        <Link to="/vendor/products" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>View All</Link>
                    </div>
                    {products.map((p) => (
                        <div key={p._id} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
                            <img src={p.images?.[0]?.url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>₹{p.price.toLocaleString('en-IN')}</p>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: p.stock > 0 ? '#16a34a' : '#dc2626' }}>
                                {p.stock > 0 ? `${p.stock} left` : 'OOS'}
                            </span>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>No products yet.</div>
                    )}
                </div>

                {/* Recent Orders */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem' }}>Recent Orders</h3>
                        <Link to="/vendor/orders" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>View All</Link>
                    </div>
                    {recentOrders.map((o) => (
                        <div key={o._id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>#{o.orderId}</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                            <Badge status={o.status} />
                        </div>
                    ))}
                    {recentOrders.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>No orders yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;
