import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { toast } from 'react-toastify';
import { PageLoader } from '../../components/common/UI';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        avatar: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await authService.getMe();
                const u = data.data;
                setForm({
                    name: u.name || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    address: u.address || '',
                    city: u.city || '',
                    state: u.state || '',
                    pincode: u.pincode || '',
                    avatar: u.avatar || '',
                });
                updateUser(u);
            } catch (err) {
                toast.error('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await authService.updateProfile(form);
            updateUser(data.data);
            toast.success('✨ Profile updated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <PageLoader message="Loading your profile..." />;

    return (
        <div className="container py-10">
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div className="page-header" style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 40 }}>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem' }}>My Profile</h1>
                    <p style={{ color: 'var(--text-light)' }}>Manage your personal information and delivery preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Avatar */}
                    <div className="md:col-span-1">
                        <div style={{ 
                            background: 'white', 
                            padding: 30, 
                            borderRadius: 'var(--radius-xl)', 
                            border: '1px solid var(--border-light)',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ 
                                width: 120, 
                                height: 120, 
                                borderRadius: '50%', 
                                background: 'var(--gradient-primary)', 
                                margin: '0 auto 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                                color: 'white',
                                fontWeight: 700,
                                boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)'
                            }}>
                                {form.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 4 }}>{form.name}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: 20 }}>{form.email}</p>
                            
                            <div style={{ 
                                borderTop: '1px solid var(--border-light)', 
                                paddingTop: 20, 
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12
                            }}>
                                <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: 'var(--primary)' }}>👤</span>
                                    <span>Verified Account</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: 'var(--primary)' }}>📅</span>
                                    <span>Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} style={{ 
                            background: 'white', 
                            padding: 40, 
                            borderRadius: 'var(--radius-xl)', 
                            border: '1px solid var(--border-light)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            <h4 style={{ fontWeight: 700, marginBottom: 24, fontSize: '1.1rem' }}>Personal Details</h4>
                            
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input 
                                    name="name" 
                                    className="form-control" 
                                    value={form.name} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address (Read-only)</label>
                                <input 
                                    className="form-control" 
                                    value={form.email} 
                                    disabled 
                                    style={{ background: '#f9fafb' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input 
                                    name="phone" 
                                    className="form-control" 
                                    value={form.phone} 
                                    onChange={handleChange} 
                                    placeholder="Enter 10-digit mobile number"
                                    pattern="[6-9]\d{9}"
                                />
                            </div>

                            <h4 style={{ fontWeight: 700, marginTop: 40, marginBottom: 24, fontSize: '1.1rem' }}>Shipping Address</h4>

                            <div className="form-group">
                                <label className="form-label">Full Address</label>
                                <textarea 
                                    name="address" 
                                    className="form-control" 
                                    rows={3} 
                                    value={form.address} 
                                    onChange={handleChange} 
                                    placeholder="House No, Street Name, Area..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input 
                                        name="city" 
                                        className="form-control" 
                                        value={form.city} 
                                        onChange={handleChange} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input 
                                        name="state" 
                                        className="form-control" 
                                        value={form.state} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Pincode</label>
                                <input 
                                    name="pincode" 
                                    className="form-control" 
                                    value={form.pincode} 
                                    onChange={handleChange} 
                                    pattern="\d{6}"
                                />
                            </div>

                            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
