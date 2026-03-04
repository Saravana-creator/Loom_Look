import React, { useEffect, useState } from 'react';
import { adminService } from '../../services';
import { PageLoader } from '../../components/common/UI';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService.getDashboard().then(({ data }) => {
            setStats(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <PageLoader />;

    const cards = [
        { icon: '👥', label: 'Total Users', value: stats?.users?.total || 0, sub: `${stats?.users?.activeToday || 0} active today`, color: 'blue' },
        { icon: '🏪', label: 'Vendors', value: stats?.vendors?.total || 0, sub: `${stats?.vendors?.pending || 0} pending approval`, color: 'orange' },
        { icon: '🧵', label: 'Products', value: stats?.products?.total || 0, sub: `${stats?.products?.outOfStock || 0} out of stock`, color: 'gold' },
        { icon: '📦', label: 'Orders', value: stats?.orders?.total || 0, sub: `${stats?.orders?.pending || 0} pending`, color: 'purple' },
        { icon: '💰', label: 'Revenue', value: `₹${(stats?.revenue?.total || 0).toLocaleString('en-IN')}`, sub: 'Total platform revenue', color: 'green' },
        { icon: '📹', label: 'Live Sessions', value: stats?.sessions?.total || 0, sub: `${stats?.sessions?.upcoming || 0} upcoming`, color: 'blue' },
    ];

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Admin Dashboard</h1>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>

            {/* AEGIS Protocol Alert */}
            <div style={{
                background: 'linear-gradient(135deg, #1a0f0a 0%, #2c1810 100%)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
            }}>
                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                <div>
                    <p style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: '0.9rem' }}>AEGIS Protocol — Active</p>
                    <p style={{ color: 'rgba(255,254,248,0.6)', fontSize: '0.8rem' }}>All domain mail encrypted · AES-256 data protection active · JWT secure sessions running</p>
                </div>
                <span style={{ marginLeft: 'auto', background: 'rgba(22,163,74,0.2)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(74,222,128,0.3)' }}>
                    🟢 SECURE
                </span>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {cards.map(({ icon, label, value, sub, color }) => (
                    <div key={label} className="stat-card">
                        <div className={`stat-icon ${color}`}>{icon}</div>
                        <div className="stat-info">
                            <div className="stat-value">{value}</div>
                            <div className="stat-label">{label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>{sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 32 }}>
                {[
                    { icon: '✅', label: 'Approve Vendors', href: '/admin/vendors', color: '#dcfce7', textColor: '#16a34a' },
                    { icon: '🛑', label: 'Manage Users', href: '/admin/users', color: '#dbeafe', textColor: '#2563eb' },
                    { icon: '📧', label: 'Domain Mail', href: '/admin/mail', color: '#fef9c3', textColor: '#ca8a04' },
                    { icon: '📦', label: 'View Orders', href: '/admin/orders', color: '#f3e8ff', textColor: '#7c3aed' },
                ].map(({ icon, label, href, color, textColor }) => (
                    <a key={label} href={href} style={{ background: color, borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', transition: 'transform 0.2s ease' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                        <span style={{ fontWeight: 700, color: textColor, fontSize: '0.88rem' }}>{label}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
