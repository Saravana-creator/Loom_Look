import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { toast } from 'react-toastify';

const VendorProfile = () => {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        shopName: user?.shopName || '',
        shopDescription: user?.shopDescription || '',
        phone: user?.phone || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await authService.updateProfile(form);
            updateUser(data.data);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Profile</h1>
            </div>
            <div style={{ maxWidth: 560, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', fontWeight: 700 }}>
                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{user?.email}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Shop Name</label>
                        <input className="form-control" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Shop Description</label>
                        <textarea className="form-control" rows={3} value={form.shopDescription} onChange={(e) => setForm({ ...form, shopDescription: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} pattern="[6-9]\d{9}" />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VendorProfile;
