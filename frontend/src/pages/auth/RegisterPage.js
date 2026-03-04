import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common/UI';

const RegisterPage = () => {
    const { register, loading } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', city: '', state: '', pincode: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleNext = (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setError('');
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const { confirmPassword, ...data } = form;
        const result = await register(data, 'user');
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-left-content">
                    <div className="auth-left-logo">🪡 Loom <span>Look</span></div>
                    <p className="auth-left-tagline">Join thousands who love authentic handmade Indian sarees and crafts</p>
                    <div className="auth-features">
                        {[
                            ['🔐', 'Your data is AES-256 encrypted'],
                            ['🎟️', 'Exclusive live weaving sessions'],
                            ['💎', 'Authentic verified handmade products'],
                            ['🚚', 'Free shipping on orders above ₹999'],
                        ].map(([ic, text]) => (
                            <div key={text} className="auth-feature-item">
                                <span className="auth-feature-icon">{ic}</span>
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✨</div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">
                    Step {step} of 2 — {step === 1 ? 'Basic Information' : 'Address (encrypted & secure)'}
                </p>

                {/* Progress bar */}
                <div style={{ height: 4, background: 'var(--border-medium)', borderRadius: 2, marginBottom: 24 }}>
                    <div style={{ height: '100%', width: `${step * 50}%`, background: 'var(--gradient-primary)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: '0.875rem', border: '1px solid #fca5a5' }}>
                        ⚠️ {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleNext}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" name="name" className="form-control" placeholder="Your full name" value={form.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" name="email" className="form-control" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" name="password" className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input type="password" name="confirmPassword" className="form-control" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full">Continue →</button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 16, background: 'var(--primary-glow)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                            🔐 Your address is encrypted with AES-256 before being stored
                        </p>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="tel" name="phone" className="form-control" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} pattern="[6-9]\d{9}" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input type="text" name="city" className="form-control" placeholder="City" value={form.city} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">State</label>
                                <input type="text" name="state" className="form-control" placeholder="State" value={form.state} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">PIN Code</label>
                            <input type="text" name="pincode" className="form-control" placeholder="6-digit PIN" value={form.pincode} onChange={handleChange} pattern="\d{6}" />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? <Spinner size={18} color="white" /> : '🎉 Create Account'}
                            </button>
                        </div>
                    </form>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 20 }}>
                    Already have an account? <Link to="/login"><b>Sign in</b></Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
