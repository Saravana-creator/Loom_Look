import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../services';
import { useAuth } from '../context/AuthContext';
import { PageLoader, EmptyState } from '../components/common/UI';
import { toast } from 'react-toastify';

const fmtDate = (v) =>
    v ? new Date(v).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-';
const fmtTime = (v) =>
    v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';

const SessionsPage = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState(null);
    const [bookedSessionIds, setBookedSessionIds] = useState(new Set());
    const [confirmation, setConfirmation] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuth();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [{ data: sData }, bData] = await Promise.all([
                    sessionService.getSessions(),
                    isAuthenticated && role === 'user'
                        ? sessionService.getMyBookings()
                        : Promise.resolve({ data: { data: [] } }),
                ]);
                setSessions(Array.isArray(sData.data) ? sData.data : []);
                const bookings = bData.data?.data;
                if (Array.isArray(bookings)) {
                    setBookedSessionIds(new Set(bookings.map((b) => b.sessionId)));
                }
            } catch {
                toast.error('Failed to load sessions.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isAuthenticated, role]);

    const handleBook = async (session) => {
        if (!isAuthenticated || role !== 'user') {
            toast.info('Please login as a user to book a session.');
            return;
        }
        setBookingId(session._id);
        try {
            const { data } = await sessionService.bookSession(session._id);
            setBookedSessionIds((prev) => new Set([...prev, session._id]));
            setConfirmation({
                title: data.data?.title || session.title,
                scheduledAt: data.data?.scheduledAt || session.scheduledAt,
                durationMinutes: data.data?.durationMinutes || session.duration,
            });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed.');
        } finally {
            setBookingId(null);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div>
            <div className="page-header">
                <h1>Live Sessions</h1>
                <p>Book exclusive live demos from master artisans and weavers</p>
            </div>

            <div className="page-content">
                {sessions.length === 0 ? (
                    <EmptyState
                        icon="📹"
                        title="No sessions available"
                        message="Check back soon for upcoming live weaving demonstrations."
                    />
                ) : (
                    <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {sessions.map((session) => {
                            const spotsLeft = session.maxParticipants - (session.bookedUsers?.length || 0);
                            const alreadyBooked = bookedSessionIds.has(session._id);
                            return (
                                <div key={session._id} className="session-card">
                                    <div className="session-card__img">
                                        <span>🪡</span>
                                        {session.status === 'live' && (
                                            <span className="session-card__live-badge">🔴 LIVE</span>
                                        )}
                                        {session.status === 'upcoming' && (
                                            <span style={{ position: 'absolute', top: 12, right: 12, background: '#2563eb', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                                                📅 Upcoming
                                            </span>
                                        )}
                                    </div>
                                    <div className="session-card__body">
                                        <p className="session-card__topic">{session.category || 'Weaving Demo'}</p>
                                        <h3 className="session-card__title">{session.title}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                                            {session.description?.slice(0, 100)}{session.description?.length > 100 ? '...' : ''}
                                        </p>
                                        <div className="session-card__meta">
                                            <span>📅 {new Date(session.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span>⏱️ {session.duration} min</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#16a34a' }}>FREE</span>
                                            <span style={{ fontSize: '0.78rem', color: spotsLeft < 10 ? '#dc2626' : 'var(--text-light)' }}>
                                                {spotsLeft > 0 ? `${spotsLeft} spots left` : '🔴 Full'}
                                            </span>
                                        </div>
                                        {session.shopName && (
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 14 }}>
                                                🏪 {session.shopName}
                                            </p>
                                        )}
                                        <button
                                            className={`btn btn-full btn-sm ${alreadyBooked ? 'btn-secondary' : 'btn-primary'}`}
                                            onClick={() => alreadyBooked ? navigate('/my-sessions') : handleBook(session)}
                                            disabled={(!alreadyBooked && spotsLeft === 0) || bookingId === session._id || session.status === 'completed'}
                                        >
                                            {bookingId === session._id ? '⏳ Booking...' :
                                                alreadyBooked ? '✅ Already Booked — View' :
                                                    session.status === 'completed' ? 'Completed' :
                                                        spotsLeft === 0 ? 'Fully Booked' : '🎟️ Book Now'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Booking Confirmation Modal */}
            {confirmation && (
                <div className="modal-overlay" onClick={() => setConfirmation(null)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 440, width: '94vw', textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '32px 28px' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
                            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: 8, color: 'var(--text-primary)' }}>
                                You&apos;re Booked!
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
                                Your spot is confirmed for:
                            </p>

                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 24, textAlign: 'left' }}>
                                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 10 }}>
                                    📹 {confirmation.title}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    📅 {fmtDate(confirmation.scheduledAt)}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    ⏰ {fmtTime(confirmation.scheduledAt)}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    ⏱ Duration: {confirmation.durationMinutes} minutes
                                </p>
                            </div>

                            <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 24 }}>
                                🔐 The meeting link will be available in <strong>My Sessions</strong> when the session goes live.
                            </p>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setConfirmation(null)}
                                >
                                    Continue Browsing
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => { setConfirmation(null); navigate('/my-sessions'); }}
                                >
                                    📹 My Sessions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionsPage;
