import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
    <footer className="footer">
        <div className="footer-grid">
            <div className="footer-brand">
                <h3>🪡 Loom <span>Look</span></h3>
                <p>
                    India's premier marketplace for authentic handmade sarees and
                    artisanal crafts. Connecting weavers and artisans directly with
                    those who cherish handcrafted beauty.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', fontSize: '1.3rem' }}>
                    <span style={{ cursor: 'pointer', opacity: 0.7 }}>📘</span>
                    <span style={{ cursor: 'pointer', opacity: 0.7 }}>📷</span>
                    <span style={{ cursor: 'pointer', opacity: 0.7 }}>🐦</span>
                    <span style={{ cursor: 'pointer', opacity: 0.7 }}>▶️</span>
                </div>
            </div>
            <div className="footer-col">
                <h4>Shop</h4>
                <ul>
                    <li><Link to="/shop?category=Silk Sarees">Silk Sarees</Link></li>
                    <li><Link to="/shop?category=Kanjivaram Sarees">Kanjivaram</Link></li>
                    <li><Link to="/shop?category=Banarasi Sarees">Banarasi</Link></li>
                    <li><Link to="/shop?category=Handcrafted Jewelry">Jewelry</Link></li>
                    <li><Link to="/shop?category=Home Decor">Home Decor</Link></li>
                </ul>
            </div>
            <div className="footer-col">
                <h4>Account</h4>
                <ul>
                    <li><Link to="/login">User Login</Link></li>
                    <li><Link to="/register">Register</Link></li>
                    <li><Link to="/vendor/login">Vendor Login</Link></li>
                    <li><Link to="/profile">My Profile</Link></li>
                    <li><Link to="/orders">My Orders</Link></li>
                </ul>
            </div>
            <div className="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><Link to="/about">About Us</Link></li>
                    <li><Link to="/sessions">Live Sessions</Link></li>
                    <li><a href="mailto:contact@loomlook.com">Contact</a></li>
                    <li><Link to="/privacy">Privacy Policy</Link></li>
                    <li><Link to="/terms">Terms of Service</Link></li>
                </ul>
            </div>
        </div>
        <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Loom Look. All rights reserved. Made with ❤️ for Indian artisans.</p>
        </div>
    </footer>
);

export default Footer;
