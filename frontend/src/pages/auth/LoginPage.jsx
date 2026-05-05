import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';



const LoginPage = ({ role = 'user' }) => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(form, role);
        if (result.success) {
            const redirectMap = { admin: '/admin/dashboard', vendor: '/vendor/dashboard', user: '/' };
            navigate(redirectMap[role] || '/');
        } else {
            setError(result.message);
        }
    };

    const isAdmin = role === 'admin';
    const isVendor = role === 'vendor';

    return (
        <div className="gallery-auth-container">
            {/* Artistic Left Side */}
            <div className="gallery-auth-visual">
                <div className="visual-content animate-slide-up">
                    <span className="visual-label">Est. 2024</span>
                    <h1 className="visual-headline">
                        The Art of <br />
                        <span className="italic">Authentic</span> <br />
                        Weaving.
                    </h1>
                    <div className="visual-footer">
                        <p>Loom Look &copy; {new Date().getFullYear()}</p>
                        <div className="visual-stitch"></div>
                    </div>
                </div>
                <div className="visual-bg-overlay"></div>
            </div>

            {/* Minimalist Right Side */}
            <div className="gallery-auth-form">
                <div className="form-inner animate-fade-in">
                    <div className="form-header">
                        <h2 className="form-title">
                            Sign In <span className="role-tag">{role}</span>
                        </h2>
                        <p className="form-subtitle">Enter your credentials to access the collection.</p>
                    </div>

                    {error && (
                        <div className="gallery-error">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="minimal-form">
                        <div className="minimal-group">
                            <input
                                id={`${role}-email`}
                                type="email"
                                className="minimal-input"
                                placeholder="EMAIL ADDRESS"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                            <div className="minimal-bar"></div>
                        </div>

                        <div className="minimal-group">
                            <input
                                id={`${role}-password`}
                                type={showPass ? 'text' : 'password'}
                                className="minimal-input"
                                placeholder="PASSWORD"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                            <div className="minimal-bar"></div>
                            <button type="button" className="minimal-toggle" onClick={() => setShowPass(!showPass)}>
                                {showPass ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>

                        <button type="submit" className="btn btn-primary btn-gallery" disabled={loading}>
                            <span>{loading ? 'AUTHENTICATING...' : 'PROCEED'}</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                    </form>

                    <div className="gallery-form-footer">
                        <div className="footer-links">
                            {!isAdmin && (
                                <p>
                                    NEW HERE? <Link to={isVendor ? "/vendor/register" : "/register"}>CREATE ACCOUNT</Link>
                                </p>
                            )}
                            <div className="switch-options">
                                {isVendor ? (
                                    <Link to="/login">USER ACCESS</Link>
                                ) : (
                                    <>
                                        <Link to="/vendor/login">VENDOR PORTAL</Link>
                                        <Link to="/admin/login">ADMINISTRATION</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
