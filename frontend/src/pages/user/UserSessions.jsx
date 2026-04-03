import React, { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { PageLoader, EmptyState } from '../../components/common/UI';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

/* ─── helpers ─────────────────────────────────────────────────── */
const safeDate = (v) => (v ? new Date(v) : null);
const isLive     = (scheduledAt, mins) => {
    if (!scheduledAt) return false;
    const now = Date.now();
    const start = safeDate(scheduledAt).getTime();
    return now >= start && now <= start + mins * 60000;
};
const isUpcoming = (scheduledAt) => {
    if (!scheduledAt) return false;
    return Date.now() < safeDate(scheduledAt).getTime();
};
const fmtDate = (v) => {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (v) => {
    if (!v) return '—';
    return new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/* ─── Pre-Join Modal ──────────────────────────────────────────── */
const PreJoinModal = ({ booking, user, onConfirm, onClose }) => {
    const [displayName, setDisplayName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [joining, setJoining] = useState(false);

    const handleJoin = async () => {
        if (!displayName.trim()) { toast.error('Please enter your display name.'); return; }
        if (!email.trim()) { toast.error('Please enter your email address.'); return; }
        setJoining(true);
        try {
            await onConfirm(booking, displayName, email);
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 460, width: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">🚀 Join Live Session</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: '24px' }}>
                    {/* Session Info */}
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 24 }}>
                        <h4 style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{booking.title}</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                            📅 {fmtDate(booking.scheduledAt)} at {fmtTime(booking.scheduledAt)} · ⏱ {booking.durationMinutes} mins
                        </p>
                        {booking.shopName && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 4 }}>🏪 {booking.shopName}</p>
                        )}
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Enter your name and email to identify yourself in the meeting. This info is only for your reference.
                    </p>

                    <div className="form-group">
                        <label className="form-label">Your Display Name *</label>
                        <input
                            className="form-control"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="How you want to appear in the meeting"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: 20 }}>
                        🔐 The meeting link is encrypted and only visible to booked participants.
                    </p>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" style={{ minWidth: 80 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleJoin} disabled={joining}>
                            {joining ? '⏳ Getting link...' : '🚀 Join Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ──────────────────────────────────────────── */
const UserSessions = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [preJoin, setPreJoin] = useState(null);   // booking object to join
    const { user } = useAuth();

    const loadBookings = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await sessionService.getMyBookings();
            const rows = Array.isArray(data.data) ? data.data : [];
            setBookings(rows);
        } catch {
            toast.error('Failed to load your sessions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    const handleJoinConfirm = async (booking, displayName, email) => {
        try {
            const { data } = await sessionService.joinSession(booking.sessionId);
            const link = data.data?.videoLink;
            if (!link) { toast.error('Could not retrieve meeting link.'); return; }

            // Open the link — many platforms accept ?uname and ?email pre-fill params
            let finalLink = link;
            try {
                const url = new URL(link);
                // Zoom supports ?uname= ; Google Meet ignores extras harmlessly
                url.searchParams.set('uname', displayName);
                url.searchParams.set('email', email);
                finalLink = url.toString();
            } catch { /* if not a valid URL, use as-is */ }

            window.open(finalLink, '_blank', 'noopener,noreferrer');
            setPreJoin(null);
            toast.success(`✅ Joining as ${displayName}. Have a great session!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to get join link.');
        }
    };

    if (loading) return <PageLoader message="Fetching your bookings..." />;

    return (
        <>
            {/* Page Header */}
            <div className="page-header">
                <h1>📹 My Live Sessions</h1>
                <p>Join upcoming live demonstrations and weaving masterclasses</p>
            </div>

            <div className="page-content">
                {bookings.length === 0 ? (
                    <EmptyState
                        icon="📹"
                        title="No bookings yet"
                        message="Explore and book upcoming live sessions from our artisans."
                        action={<Link to="/sessions" className="btn btn-primary">Browse Sessions</Link>}
                    />
                ) : (
                    <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
                        {bookings.map((booking) => {
                            const live     = isLive(booking.scheduledAt, booking.durationMinutes);
                            const upcoming = isUpcoming(booking.scheduledAt);

                            return (
                                <div
                                    key={booking._id}
                                    style={{
                                        background: 'white',
                                        borderRadius: 'var(--radius-xl)',
                                        overflow: 'hidden',
                                        border: live ? '2px solid #ef4444' : '1px solid var(--border-light)',
                                        boxShadow: live
                                            ? '0 0 20px rgba(239,68,68,0.15)'
                                            : '0 4px 12px rgba(0,0,0,0.05)',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {/* Card Banner */}
                                    <div style={{
                                        height: 140,
                                        background: live ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'var(--gradient-primary)',
                                        position: 'relative',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '3rem',
                                    }}>
                                        🧵
                                        {live && (
                                            <span style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(255,255,255,0.2)',
                                                color: 'white', fontSize: '0.68rem', fontWeight: 800,
                                                padding: '4px 10px', borderRadius: 999,
                                                animation: 'pulse 1.5s infinite', backdropFilter: 'blur(4px)',
                                            }}>
                                                🔴 LIVE NOW
                                            </span>
                                        )}
                                        {upcoming && !live && (
                                            <span style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(37,99,235,0.9)',
                                                color: 'white', fontSize: '0.68rem', fontWeight: 700,
                                                padding: '4px 10px', borderRadius: 999,
                                            }}>
                                                📅 UPCOMING
                                            </span>
                                        )}
                                        {!live && !upcoming && (
                                            <span style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(100,100,100,0.8)',
                                                color: 'white', fontSize: '0.68rem', fontWeight: 700,
                                                padding: '4px 10px', borderRadius: 999,
                                            }}>
                                                ✅ COMPLETED
                                            </span>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: 20 }}>
                                        {booking.shopName && (
                                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                                {booking.shopName}
                                            </p>
                                        )}
                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                            {booking.title}
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                                                <span>📅</span>
                                                <span>{fmtDate(booking.scheduledAt)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                                                <span>⏰</span>
                                                <span>{fmtTime(booking.scheduledAt)} ({booking.durationMinutes} mins)</span>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', display: 'flex', gap: 8 }}>
                                                <span>🎫</span>
                                                <span style={{ color: booking.bookingStatus === 'Confirmed' ? '#16a34a' : 'var(--text-light)', fontWeight: 600 }}>
                                                    {booking.bookingStatus || 'Confirmed'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                                            {live ? (
                                                <button
                                                    className="btn btn-primary btn-full"
                                                    style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', animation: 'pulse 2s infinite' }}
                                                    onClick={() => setPreJoin(booking)}
                                                >
                                                    🚀 Join Live Now
                                                </button>
                                            ) : upcoming ? (
                                                <div>
                                                    <button className="btn btn-secondary btn-full" disabled>
                                                        ⏳ Starts {fmtDate(booking.scheduledAt)} at {fmtTime(booking.scheduledAt)}
                                                    </button>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: 8 }}>
                                                        The "Join" button will activate when session goes live
                                                    </p>
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                                    ✅ Session completed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pre-Join Modal */}
            {preJoin && (
                <PreJoinModal
                    booking={preJoin}
                    user={user}
                    onConfirm={handleJoinConfirm}
                    onClose={() => setPreJoin(null)}
                />
            )}

            <style>{`
                @keyframes pulse {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50%      { opacity: 0.85; transform: scale(1.02); }
                }
            `}</style>
        </>
    );
};

export default UserSessions;
