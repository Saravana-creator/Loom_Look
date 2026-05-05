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
    const [showPass, setShowPass] = useState(false);

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
        <div className="auth-container">
            <div className="auth-card animate-fade-in" style={{ maxWidth: '520px' }}>
                <div className="auth-header">
                    <div className="auth-icon-wrap">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">
                        Step {step} of 2 &bull; {step === 1 ? 'Basic Details' : 'Delivery Address'}
                    </p>
                </div>

                <div className="auth-progress-bar">
                    <div className="auth-progress-fill" style={{ width: `${step * 50}%` }}></div>
                </div>

                {error && (
                    <div className="auth-error-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleNext} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" name="name" className="form-control" placeholder="Enter your name" value={form.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" name="email" className="form-control" placeholder="name@example.com" value={form.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-with-icon">
                                <input 
                                    type={showPass ? 'text' : 'password'} 
                                    name="password" 
                                    className="form-control" 
                                    placeholder="Min. 6 characters" 
                                    value={form.password} 
                                    onChange={handleChange} 
                                    required 
                                />
                                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? 
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : 
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    }
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input type="password" name="confirmPassword" className="form-control" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-auth">Next Step &rarr;</button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="tel" name="phone" className="form-control" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} pattern="[6-9]\d{9}" required />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input type="text" name="city" className="form-control" placeholder="City" value={form.city} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">State</label>
                                <input type="text" name="state" className="form-control" placeholder="State" value={form.state} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">PIN Code</label>
                            <input type="text" name="pincode" className="form-control" placeholder="6-digit PIN" value={form.pincode} onChange={handleChange} pattern="\d{6}" required />
                        </div>
                        <div className="auth-btn-row">
                            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>&larr; Back</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? <Spinner size={20} color="white" /> : 'Complete Registration'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        Already have an account? 
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
