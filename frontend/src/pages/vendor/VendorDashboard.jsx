import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, orderService } from '../../services';
import { PageLoader } from '../../components/common/UI';

const VendorDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [prodRes, ordRes] = await Promise.all([
                    productService.getMyProducts({ limit: 4 }),
                    orderService.getVendorOrders({ limit: 4 }),
                ]);
                setProducts(prodRes.data.data);
                setRecentOrders(ordRes.data.data);
                
                // Detailed calculation for payment transparency
                const settledEarnings = ordRes.data.data
                    .filter(o => o.payment_status?.toLowerCase() === 'paid')
                    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
                    
                const pendingAcquisitions = ordRes.data.data
                    .filter(o => o.payment_status?.toLowerCase() !== 'paid')
                    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

                setStats({
                    productCount: prodRes.data.pagination?.totalItems || prodRes.data.data.length,
                    orderCount: ordRes.data.pagination?.totalItems || ordRes.data.data.length,
                    settled: settledEarnings,
                    pending: pendingAcquisitions,
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
        <div className="atelier-container">
            <div className="atelier-header animate-fade-in">
                <div className="header-text">
                    <span className="visual-label">Commercial Overview</span>
                    <h1 className="canvas-title">The <span className="italic">Artisan's</span> Atelier</h1>
                </div>
                <Link to="/vendor/products/new" className="btn btn-primary">
                    <span>LAUNCH NEW MASTERPIECE</span>
                </Link>
            </div>

            {/* Cinematic Stats */}
            <div className="atelier-stats-grid animate-slide-up">
                <div className="atelier-stat-main">
                    <span className="stat-tag">Commercial Pulse</span>
                    <div className="stat-split">
                        <div className="stat-block">
                            <span className="stat-label">SETTLED EARNINGS</span>
                            <span className="stat-value">₹{stats?.settled?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="stat-block">
                            <span className="stat-label">PENDING ACQUISITIONS</span>
                            <span className="stat-value opacity-50">₹{stats?.pending?.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
                <div className="atelier-stat-side">
                    <div className="stat-mini">
                        <span className="stat-label">TOTAL PIECES</span>
                        <span className="stat-value">{stats?.productCount}</span>
                    </div>
                    <div className="stat-mini">
                        <span className="stat-label">ACTIVE ORDERS</span>
                        <span className="stat-value">{stats?.orderCount}</span>
                    </div>
                </div>
            </div>

            <div className="atelier-recent-grid">
                {/* Recent Collections */}
                <div className="recent-section">
                    <div className="section-header">
                        <h3 className="section-title">Latest <span className="italic">Acquisitions</span></h3>
                        <Link to="/vendor/orders" className="btn-text-only">VIEW LEDGER</Link>
                    </div>
                    <div className="recent-list">
                        {recentOrders.map((o) => (
                            <div key={o._id} className="recent-order-item">
                                <div className="order-meta">
                                    <span className="order-id">#{o.order_number || o.orderId}</span>
                                    <span className="order-customer">{o.customer_name || 'Anonymous Collector'}</span>
                                </div>
                                <div className="order-status-wrap">
                                    <span className={`status-dot dot-${o.order_status?.toLowerCase() || o.status?.toLowerCase()}`}></span>
                                    <span className="status-text">{o.order_status || o.status}</span>
                                </div>
                                <div className="entry-stitch"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Masterpiece Preview */}
                <div className="recent-section">
                    <div className="section-header">
                        <h3 className="section-title">Masterpiece <span className="italic">Preview</span></h3>
                        <Link to="/vendor/products" className="btn-text-only">MANAGE GALLERY</Link>
                    </div>
                    <div className="recent-products-collage">
                        {products.map((p, idx) => (
                            <div key={p._id} className={`collage-piece piece-${idx}`}>
                                <img src={p.images?.[0]?.url} alt={p.name} />
                                <div className="piece-overlay">
                                    <span>{p.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;
