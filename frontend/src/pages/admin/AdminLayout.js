import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = async () => { await logout(); navigate('/'); };

    const navItems = [
        { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { to: '/admin/users', icon: '👥', label: 'Users' },
        { to: '/admin/vendors', icon: '🏪', label: 'Vendors' },
        { to: '/admin/products', icon: '🧵', label: 'Products' },
        { to: '/admin/orders', icon: '📦', label: 'Orders' },
        { to: '/admin/mail', icon: '📧', label: 'Domain Mail' },
    ];

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">🪡 Loom <span>Look</span></div>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,254,248,0.4)', marginBottom: 4 }}>👑 Admin</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{user?.name || 'Administrator'}</p>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(({ to, icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/admin/dashboard'}>
                            <span className="nav-icon">{icon}</span> {label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'absolute', bottom: 0, width: '100%' }}>
                    <button onClick={handleLogout} className="btn btn-danger btn-full btn-sm">🚪 Logout</button>
                </div>
            </aside>
            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
