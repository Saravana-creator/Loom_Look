import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services';
import { Badge, EmptyState, ConfirmModal } from '../../components/common/UI';
import { toast } from 'react-toastify';

const defaultForm = {
    title: '', description: '', category: 'Silk Sarees', scheduledAt: '',
    duration: 60, maxParticipants: 50, price: 0, videoLink: '', platform: 'Zoom',
};

const VendorSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editSession, setEditSession] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, id: null });

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await sessionService.getMyVendorSessions({ limit: 50 });
            setSessions(data.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const openNew = () => { setForm(defaultForm); setEditSession(null); setShowForm(true); };
    const openEdit = (s) => {
        setForm({
            title: s.title, description: s.description, category: s.category,
            scheduledAt: new Date(s.scheduledAt).toISOString().slice(0, 16),
            duration: s.duration, maxParticipants: s.maxParticipants, price: s.price,
            videoLink: s.videoLink || '', platform: s.platform || 'Zoom',
        });
        setEditSession(s);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, duration: Number(form.duration), maxParticipants: Number(form.maxParticipants), price: Number(form.price) };
            if (editSession) {
                await sessionService.updateSession(editSession._id, payload);
                toast.success('Session updated!');
            } else {
                await sessionService.createSession(payload);
                toast.success('Session created!');
            }
            setShowForm(false);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save session.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await sessionService.deleteSession(confirm.id);
            toast.success('Session deleted.');
            setConfirm({ open: false, id: null });
            load();
        } catch { toast.error('Failed to delete session.'); }
    };

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Live Sessions</h1>
                <button className="btn btn-primary btn-sm" onClick={openNew}>+ Schedule Session</button>
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /></div>
            ) : sessions.length === 0 ? (
                <EmptyState icon="📹" title="No sessions yet" message="Schedule your first live weaving demo!" action={<button className="btn btn-primary" onClick={openNew}>Schedule Session</button>} />
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr><th>Title</th><th>Scheduled</th><th>Duration</th><th>Capacity</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {sessions.map((s) => (
                                <tr key={s._id}>
                                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                                    <td>{new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                    <td>{s.duration} min</td>
                                    <td>{s.bookedUsers?.length || 0}/{s.maxParticipants}</td>
                                    <td><Badge status={s.status} /></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ open: true, id: s._id })}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editSession ? 'Edit Session' : 'Schedule Live Session'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input name="title" className="form-control" value={form.title} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Scheduled Date/Time *</label>
                                    <input type="datetime-local" name="scheduledAt" className="form-control" value={form.scheduledAt} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (minutes)</label>
                                    <input type="number" name="duration" className="form-control" value={form.duration} onChange={handleChange} min={15} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Participants</label>
                                    <input type="number" name="maxParticipants" className="form-control" value={form.maxParticipants} onChange={handleChange} min={1} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Entry Fee (₹)</label>
                                    <input type="number" name="price" className="form-control" value={form.price} onChange={handleChange} min={0} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Platform</label>
                                    <select name="platform" className="form-control" value={form.platform} onChange={handleChange}>
                                        {['Zoom', 'Google Meet', 'Microsoft Teams', 'YouTube Live', 'Other'].map((p) => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Video Link (shared securely with booked users)</label>
                                <input name="videoLink" className="form-control" value={form.videoLink} onChange={handleChange} placeholder="https://..." />
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 4 }}>🔐 Link is AES-encrypted before storage</p>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? 'Saving...' : editSession ? 'Update Session' : 'Schedule Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={confirm.open}
                title="Delete Session"
                message="Are you sure you want to delete this session?"
                onConfirm={handleDelete}
                onCancel={() => setConfirm({ open: false, id: null })}
                danger
            />
        </div>
    );
};

export default VendorSessions;
