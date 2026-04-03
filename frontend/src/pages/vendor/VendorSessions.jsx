import React, { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../services';
import { EmptyState, ConfirmModal } from '../../components/common/UI';
import { toast } from 'react-toastify';

const CATEGORIES = [
    'Silk Sarees', 'Cotton Sarees', 'Banarasi Sarees', 'Kanjivaram Sarees',
    'Chanderi Sarees', 'Handloom Sarees', 'Designer Sarees', 'Other',
];

const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'YouTube Live', 'Other'];

const defaultForm = {
    title: '', description: '', category: 'Silk Sarees', scheduledAt: '',
    duration: 60, maxParticipants: 50, videoLink: '', platform: 'Zoom',
};

const toLocalDatetimeString = (dateInput) => {
    if (!dateInput) return '';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        // format as YYYY-MM-DDTHH:mm in local timezone for datetime-local input
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return '';
    }
};

const formatDate = (dateInput) => {
    if (!dateInput) return 'Not set';
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return 'Invalid date';
    }
};

const STATUS_COLORS = {
    upcoming: { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
    live: { bg: '#dcfce7', color: '#15803d', label: '🔴 Live' },
    completed: { bg: '#f3f4f6', color: '#6b7280', label: 'Completed' },
    cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_COLORS[status?.toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280', label: status || 'Unknown' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {s.label}
        </span>
    );
};

const VendorSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editSession, setEditSession] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, id: null });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await sessionService.getMyVendorSessions({ limit: 50 });
            setSessions(Array.isArray(data.data) ? data.data : []);
        } catch (err) {
            console.error('Failed to load sessions', err);
            toast.error('Failed to load sessions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const openNew = () => {
        setForm(defaultForm);
        setEditSession(null);
        setShowForm(true);
    };

    const openEdit = (s) => {
        setForm({
            title: s.title || '',
            description: s.description || '',
            category: s.category || 'Silk Sarees',
            scheduledAt: toLocalDatetimeString(s.scheduledAt),
            duration: s.duration || 60,
            maxParticipants: s.maxParticipants || 50,
            videoLink: '',
            platform: s.platform || 'Zoom',
        });
        setEditSession(s);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditSession(null);
        setForm(defaultForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                // datetime-local gives local time string — convert to UTC ISO for backend
                scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
                duration: Number(form.duration),
                maxParticipants: Number(form.maxParticipants),
            };
            if (editSession) {
                await sessionService.updateSession(editSession._id, payload);
                toast.success('✅ Session updated!');
            } else {
                await sessionService.createSession(payload);
                toast.success('🎉 Session scheduled!');
            }
            closeForm();
            await load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save session.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await sessionService.deleteSession(confirm.id);
            toast.success('Session removed.');
            setConfirm({ open: false, id: null });
            await load();
        } catch {
            toast.error('Failed to remove session.');
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="dashboard-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="dashboard-title">Live Sessions</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: 4 }}>
                        Schedule and manage your live weaving demonstrations
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openNew}>
                    + Schedule Session
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="page-loader"><div className="spinner" /></div>
            ) : sessions.length === 0 ? (
                <EmptyState
                    icon="📹"
                    title="No sessions yet"
                    message="Schedule your first live weaving demo and connect with customers!"
                    action={<button className="btn btn-primary" onClick={openNew}>Schedule First Session</button>}
                />
            ) : (
                <>
                    {/* Desktop Table (hidden on mobile) */}
                    <div className="table-wrapper vendor-sessions-table">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Scheduled</th>
                                    <th>Duration</th>
                                    <th>Capacity</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => (
                                    <tr key={s._id}>
                                        <td style={{ fontWeight: 600, maxWidth: 200 }}>{s.title}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(s.scheduledAt)}</td>
                                        <td>{s.duration} min</td>
                                        <td>{(s.bookedUsers?.length || 0)}/{s.maxParticipants}</td>
                                        <td><StatusBadge status={s.status} /></td>
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

                    {/* Mobile Cards (hidden on desktop) */}
                    <div className="vendor-sessions-cards">
                        {sessions.map((s) => (
                            <div key={s._id} style={{
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-light)',
                                padding: 20,
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', flex: 1, marginRight: 12 }}>{s.title}</h4>
                                    <StatusBadge status={s.status} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span>📅</span><span>{formatDate(s.scheduledAt)}</span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span>⏱️</span><span>{s.duration} minutes</span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span>👥</span><span>{s.bookedUsers?.length || 0} / {s.maxParticipants} booked</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(s)}>✏️ Edit</button>
                                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => setConfirm({ open: true, id: s._id })}>🗑️ Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div
                        className="modal"
                        style={{ maxWidth: 600, width: '95vw', maxHeight: '95vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3 className="modal-title">{editSession ? '✏️ Edit Session' : '📹 Schedule Live Session'}</h3>
                            <button className="modal-close" onClick={closeForm}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label className="form-label">Session Title *</label>
                                <input
                                    name="title"
                                    className="form-control"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Kanjivaram Weaving Masterclass"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-control"
                                    rows={3}
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Describe what participants will learn..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select name="category" className="form-control" value={form.category} onChange={handleChange}>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* 2-col grid on tablet+ */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '0 16px',
                            }}>
                                <div className="form-group">
                                    <label className="form-label">Scheduled Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        name="scheduledAt"
                                        className="form-control"
                                        value={form.scheduledAt}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        name="duration"
                                        className="form-control"
                                        value={form.duration}
                                        onChange={handleChange}
                                        min={15}
                                        max={480}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Participants</label>
                                    <input
                                        type="number"
                                        name="maxParticipants"
                                        className="form-control"
                                        value={form.maxParticipants}
                                        onChange={handleChange}
                                        min={1}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Platform</label>
                                <select name="platform" className="form-control" value={form.platform} onChange={handleChange}>
                                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Meeting / Video Link *</label>
                                <input
                                    name="videoLink"
                                    className="form-control"
                                    value={form.videoLink}
                                    onChange={handleChange}
                                    placeholder="https://zoom.us/j/... or meet.google.com/..."
                                    required
                                />
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 4 }}>
                                    🔐 Encrypted and only revealed to users who have booked this session
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={closeForm} style={{ minWidth: 100 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                                    {saving ? '⏳ Saving...' : editSession ? '✅ Update Session' : '🚀 Schedule Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={confirm.open}
                title="Remove Session"
                message="Are you sure you want to remove this session? This will cancel all bookings."
                onConfirm={handleDelete}
                onCancel={() => setConfirm({ open: false, id: null })}
                danger
            />
        </div>
    );
};

export default VendorSessions;
