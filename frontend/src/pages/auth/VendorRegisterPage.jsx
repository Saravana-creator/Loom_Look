import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services';
import { Spinner } from '../../components/common/UI';
import { toast } from 'react-toastify';

const VendorRegisterPage = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', password: '', shopName: '', shopDescription: '',
        phone: '', gstNumber: '',
        address: { street: '', city: '', state: '', pincode: '' },
    });
    const [error, setError] = useState('');

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const handleAddrChange = (e) => setForm((f) => ({ ...f, address: { ...f.address, [e.target.name]: e.target.value } }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.registerVendor(form);
            setSuccess(true);
            toast.success('Registration submitted! Awaiting admin approval.');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page" style={{ justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: 60, maxWidth: 480 }}>
                    <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎉</div>
                    <h2 style={{ marginBottom: 16 }}>Application Submitted!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                        Your vendor application has been successfully submitted. Our admin team will review and approve your account within 24-48 hours. You'll receive an email once approved.
                    </p>
                    <Link to="/vendor/login" className="btn btn-primary">Go to Vendor Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-left-content">
                    <div className="auth-left-logo">🪡 Loom <span>Look</span></div>
                    <p className="auth-left-tagline">Join our community of artisans and reach thousands of saree lovers</p>
                    <div className="auth-features">
                        {[
                            ['🏪', 'Create your own virtual shop'],
                            ['📹', 'Host live weaving demonstrations'],
                            ['💰', 'Direct earnings, no middlemen'],
                            ['📊', 'Powerful vendor analytics dashboard'],
                        ].map(([ic, text]) => (
                            <div key={text} className="auth-feature-item">
                                <span className="auth-feature-icon">{ic}</span>
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="auth-right" style={{ width: 520, overflowY: 'auto' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏪</div>
                <h1 className="auth-title">Vendor Registration</h1>
                <p className="auth-subtitle">Apply to join as a vendor (admin approval required)</p>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: '0.875rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Personal Info</h4>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone *</label>
                        <input type="tel" name="phone" className="form-control" value={form.phone} onChange={handleChange} required pattern="[6-9]\d{9}" />
                    </div>

                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, marginTop: 8 }}>Shop Details</h4>
                    <div className="form-group">
                        <label className="form-label">Shop Name *</label>
                        <input type="text" name="shopName" className="form-control" value={form.shopName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Shop Description</label>
                        <textarea name="shopDescription" className="form-control" rows={3} value={form.shopDescription} onChange={handleChange} placeholder="Describe your craft, specialties, and heritage..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">GST Number (optional)</label>
                        <input type="text" name="gstNumber" className="form-control" value={form.gstNumber} onChange={handleChange} />
                    </div>

                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, marginTop: 8 }}>Address</h4>
                    <div className="form-group">
                        <label className="form-label">Street</label>
                        <input type="text" name="street" className="form-control" value={form.address.street} onChange={handleAddrChange} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <input type="text" name="city" className="form-control" value={form.address.city} onChange={handleAddrChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">State</label>
                            <input type="text" name="state" className="form-control" value={form.address.state} onChange={handleAddrChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">PIN Code</label>
                        <input type="text" name="pincode" className="form-control" value={form.address.pincode} onChange={handleAddrChange} pattern="\d{6}" />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <Spinner size={18} color="white" /> : '🚀 Submit Application'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 20 }}>
                    Already a vendor? <Link to="/vendor/login"><b>Login</b></Link>
                </p>
            </div>
        </div>
    );
};

export default VendorRegisterPage;
