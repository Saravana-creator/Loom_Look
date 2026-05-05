import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
    <footer className="footer">
        <div className="footer-grid">
            <div className="footer-brand">
                <h3>Loom <span>Look</span></h3>
                <p>
                    India's premier marketplace for authentic handmade sarees and
                    artisanal crafts. Connecting weavers and artisans directly with
                    those who cherish handcrafted beauty.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <span className="footer-social-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </span>
                    <span className="footer-social-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    </span>
                    <span className="footer-social-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                    </span>
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
            <p>© {new Date().getFullYear()} Loom Look. All rights reserved. Curated for Indian artisans.</p>
        </div>
    </footer>
);

export default Footer;
