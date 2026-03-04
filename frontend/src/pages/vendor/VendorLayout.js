import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VendorLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => { await logout(); navigate('/'); };

    const navItems = [
        { to: '/vendor/dashboard', icon: '📊', label: 'Dashboard' },
        { to: '/vendor/products', icon: '🧵', label: 'Products' },
        { to: '/vendor/orders', icon: '📦', label: 'Orders' },
        { to: '/vendor/sessions', icon: '📹', label: 'Live Sessions' },
        { to: '/vendor/profile', icon: '👤', label: 'Profile' },
    ];

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">🪡 Loom <span>Look</span></div>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,254,248,0.4)', marginBottom: 4 }}>Vendor</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{user?.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,254,248,0.5)' }}>{user?.shopName || user?.email}</p>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(({ to, icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/vendor/dashboard'}>
                            <span className="nav-icon">{icon}</span> {label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ padding: '16px 24px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'absolute', bottom: 0, width: '100%' }}>
                    <button onClick={handleLogout} className="btn btn-danger btn-full btn-sm">
                        🚪 Logout
                    </button>
                </div>
            </aside>
            {/* Main content */}
            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
};

export default VendorLayout;
