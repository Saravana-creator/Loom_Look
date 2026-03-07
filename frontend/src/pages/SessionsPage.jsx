import React, { useEffect, useState } from 'react';
import { sessionService } from '../services';
import { useAuth } from '../context/AuthContext';
import { PageLoader, EmptyState } from '../components/common/UI';
import { toast } from 'react-toastify';

const SessionsPage = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState(null);
    const { isAuthenticated, role } = useAuth();

    useEffect(() => {
        sessionService.getSessions().then(({ data }) => {
            setSessions(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleBook = async (session) => {
        if (!isAuthenticated || role !== 'user') {
            toast.info('Please login as a user to book a session.');
            return;
        }
        setBookingId(session._id);
        try {
            await sessionService.bookSession(session._id);
            toast.success('🎉 Session booked successfully!');
            const { data } = await sessionService.getSessions();
            setSessions(data.data);
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
                <h1>📹 Live Sessions</h1>
                <p>Book exclusive live demos from master artisans and weavers</p>
            </div>

            <div className="page-content">
                {sessions.length === 0 ? (
                    <EmptyState icon="📹" title="No sessions available" message="Check back soon for upcoming live weaving demonstrations." />
                ) : (
                    <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {sessions.map((session) => {
                            const spotsLeft = session.maxParticipants - (session.bookedUsers?.length || 0);
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
                                            {session.description?.slice(0, 100)}...
                                        </p>
                                        <div className="session-card__meta">
                                            <span>📅 {new Date(session.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span>⏱️ {session.duration} min</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                            <div>
                                                <span style={{ fontWeight: 700, fontSize: '1rem', color: session.price > 0 ? 'var(--primary)' : '#16a34a' }}>
                                                    {session.price > 0 ? `₹${session.price}` : 'FREE'}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.78rem', color: spotsLeft < 10 ? '#dc2626' : 'var(--text-light)' }}>
                                                {spotsLeft > 0 ? `${spotsLeft} spots left` : '🔴 Full'}
                                            </span>
                                        </div>
                                        {session.vendor?.shopName && (
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 14 }}>🏪 {session.vendor.shopName}</p>
                                        )}
                                        <button
                                            className="btn btn-primary btn-full btn-sm"
                                            onClick={() => handleBook(session)}
                                            disabled={spotsLeft === 0 || bookingId === session._id || session.status === 'completed'}
                                        >
                                            {bookingId === session._id ? '⏳ Booking...' :
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
        </div>
    );
};

export default SessionsPage;
