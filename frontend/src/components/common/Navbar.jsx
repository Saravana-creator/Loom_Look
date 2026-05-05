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
        const handleScroll = () => setScrolled(window.scrollY > 20);
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
                    <span className="logo-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </span>
                    Loom <span>Look</span>
                </Link>

                {/* Navigation Links */}
                <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
                    <li><NavLink to="/" end>Home</NavLink></li>
                    <li><NavLink to="/shop">Shop</NavLink></li>
                    <li><NavLink to="/sessions">Live Sessions</NavLink></li>
                    <li><NavLink to="/about">About</NavLink></li>
                </ul>

                {/* Actions */}
                <div className="navbar-actions">
                    {isAuthenticated && role === 'user' && (
                        <button
                            className="cart-icon-btn"
                            onClick={() => navigate('/cart')}
                            aria-label="Cart"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                        </button>
                    )}

                    {isAuthenticated ? (
                        <div className="auth-nav-group">
                            {role === 'user' && (
                                <Link to="/my-sessions" className="nav-icon-link" title="My Sessions">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                </Link>
                            )}
                            <Link to={getDashboardLink()} className="nav-profile-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                <span className="nav-role-text">{role === 'admin' ? 'Admin' : role === 'vendor' ? 'Vendor' : 'Profile'}</span>
                            </Link>
                            <button className="btn btn-primary btn-sm nav-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="guest-nav-group">
                            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Join Now</Link>
                        </div>
                    )}

                    {/* Mobile Toggle */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? 
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> : 
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        }
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
