import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common/UI';

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

    const roleLabels = {
        user: { title: 'Welcome Back', subtitle: 'Login to your Loom Look account', icon: '👤' },
        vendor: { title: 'Vendor Portal', subtitle: 'Access your vendor dashboard', icon: '🏪' },
        admin: { title: 'Admin Console', subtitle: 'Secure administrative access', icon: '👑' },
    };
    const { title, subtitle, icon } = roleLabels[role];

    return (
        <div className="auth-page">
            {/* Left Panel */}
            <div className="auth-left">
                <div className="auth-left-content">
                    <div className="auth-left-logo">🪡 Loom <span>Look</span></div>
                    <p className="auth-left-tagline">
                        India's most trusted marketplace for authentic handmade sarees and artisanal crafts
                    </p>
                    <div className="auth-features">
                        {[
                            ['🧵', 'Handwoven with love by master artisans'],
                            ['🔐', 'Bank-level AES-256 data encryption'],
                            ['📹', 'Live weaving demos from your home'],
                            ['🚚', 'Free shipping on orders over ₹999'],
                        ].map(([ic, text]) => (
                            <div key={text} className="auth-feature-item">
                                <span className="auth-feature-icon">{ic}</span>
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="auth-right">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{icon}</div>
                <h1 className="auth-title">{title}</h1>
                <p className="auth-subtitle">{subtitle}</p>

                {error && (
                    <div style={{
                        background: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)',
                        padding: '12px 16px', marginBottom: 20, fontSize: '0.875rem', border: '1px solid #fca5a5',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            id={`${role}-email`}
                            type="email"
                            className="form-control"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Password</span>
                            <span style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setShowPass(!showPass)}>
                                {showPass ? 'Hide' : 'Show'}
                            </span>
                        </label>
                        <input
                            id={`${role}-password`}
                            type={showPass ? 'text' : 'password'}
                            className="form-control"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <Spinner size={18} color="white" /> : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                {!isAdmin && (
                    <>
                        <div className="auth-divider">or</div>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {isVendor ? (
                                <>New vendor? <Link to="/vendor/register"><b>Register your shop</b></Link></>
                            ) : (
                                <>Don't have an account? <Link to="/register"><b>Sign up free</b></Link></>
                            )}
                        </p>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 12 }}>
                            {isVendor ? (
                                <Link to="/login">← User Login</Link>
                            ) : (
                                <><Link to="/vendor/login">Vendor?</Link> &nbsp;|&nbsp; <Link to="/admin/login">Admin?</Link></>
                            )}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
