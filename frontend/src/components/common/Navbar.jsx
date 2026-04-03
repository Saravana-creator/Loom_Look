import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
    const { isAuthenticated, role, logout } = useAuth();
    const { itemCount, fetchCart } = useCart();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 20);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isAuthenticated && role === 'user') fetchCart();
    }, [isAuthenticated, role, fetchCart]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getDashboardLink = () => {
        if (role === 'admin') return '/admin/dashboard';
        if (role === 'vendor') return '/vendor/dashboard';
        return '/profile';
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    🪡 Loom <span>Look</span>
                </Link>

                {/* Navigation Links */}
                <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
                    <li><NavLink to="/">Home</NavLink></li>
                    <li><NavLink to="/shop">Shop</NavLink></li>
                    <li><NavLink to="/sessions">Live Sessions</NavLink></li>
                    <li><NavLink to="/about">About</NavLink></li>
                </ul>

                {/* Actions */}
                <div className="navbar-actions">
                    {/* Cart (user only) */}
                    {isAuthenticated && role === 'user' && (
                        <button
                            className="cart-icon-btn"
                            onClick={() => navigate('/cart')}
                            aria-label="Cart"
                        >
                            🛒
                            {itemCount > 0 && (
                                <span className="cart-badge">{itemCount}</span>
                            )}
                        </button>
                    )}

                    {isAuthenticated ? (
                        <>
                            {role === 'user' && (
                                <Link to="/my-sessions" className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>
                                    📹 My Sessions
                                </Link>
                            )}
                            <Link to={getDashboardLink()} className="btn btn-secondary btn-sm">
                                {role === 'admin' ? '👑 Admin' : role === 'vendor' ? '🏪 Vendor' : '👤 Profile'}
                            </Link>
                            <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                        </>
                    )}

                    {/* Mobile Toggle */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
