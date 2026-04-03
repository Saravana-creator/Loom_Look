import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services';
import { PageLoader, EmptyState, Badge } from '../../components/common/UI';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const UserSessions = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const { data } = await sessionService.getMyBookings();
            setBookings(data.data);
        } catch (err) {
            toast.error('Failed to load your sessions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const isSessionLive = (scheduledAt, duration) => {
        const now = new Date();
        const start = new Date(scheduledAt);
        const end = new Date(start.getTime() + duration * 60000);
        return now >= start && now <= end;
    };

    const isSessionUpcoming = (scheduledAt) => {
        const now = new Date();
        const start = new Date(scheduledAt);
        return now < start;
    };

    if (loading) return <PageLoader message="Fetching your bookings..." />;

    return (
        <div className="container py-10">
            <div className="page-header" style={{ marginBottom: 40 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem' }}>My Live Sessions</h1>
                <p style={{ color: 'var(--text-light)' }}>Join upcoming live demonstrations and weaving masterclasses</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => {
                            const isLive = isSessionLive(booking.scheduledAt, booking.durationMinutes);
                            const isUpcoming = isSessionUpcoming(booking.scheduledAt);
                            
                            return (
                                <div key={booking.id} className="session-card" style={{ background: 'white', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <div className="session-card__img" style={{ height: 160, background: 'var(--gradient-primary)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                                        🧵
                                        {isLive && <span style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', animation: 'pulse 2s infinite' }}>🔴 LIVE NOW</span>}
                                        {isUpcoming && <span style={{ position: 'absolute', top: 12, right: 12, background: '#2563eb', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>📅 UPCOMING</span>}
                                    </div>
                                    <div className="session-card__body" style={{ padding: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{booking.shopName || 'Artisan Workshop'}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>{booking.title}</h3>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                                <span>📅</span>
                                                <span>{new Date(booking.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                                <span>⏱️</span>
                                                <span>{new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({booking.durationMinutes} mins)</span>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
                                            {isLive ? (
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            const { data } = await sessionService.joinSession(booking.sessionId);
                                                            window.open(data.data.videoLink, '_blank');
                                                        } catch (err) {
                                                            toast.error('Failed to get join link.');
                                                        }
                                                    }}
                                                    className="btn btn-primary btn-full"
                                                >
                                                    🚀 Join Live Session
                                                </button>
                                            ) : isUpcoming ? (
                                                <button className="btn btn-secondary btn-full" disabled>
                                                    ⏳ Starts Soon
                                                </button>
                                            ) : (
                                                <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                                    ✅ Completed
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
            
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default UserSessions;
