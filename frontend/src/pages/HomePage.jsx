import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, sessionService } from '../services';
import ProductCard from '../components/common/ProductCard';
import { PageLoader } from '../components/common/UI';

const CATEGORIES = [
    'Silk Sarees', 'Kanjivaram Sarees', 'Banarasi Sarees',
    'Cotton Sarees', 'Handcrafted Jewelry', 'Home Decor',
];

const HomePage = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [prodRes, sesRes] = await Promise.all([
                    productService.getProducts({ limit: 8, sort: '-totalSold' }),
                    sessionService.getSessions({ limit: 3 }),
                ]);
                setFeaturedProducts(prodRes.data.data);
                setSessions(sesRes.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div className="home-page">
            {/* ── HERO SECTION ── */}
            <section className="hero-section">
                <div className="hero-inner container">
                    <div className="hero-text animate-slide-up">
                        <span className="hero-tag">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                            Authentic Handloom Marketplace
                        </span>
                        <h1 className="hero-title">
                            Where Every Thread Tells a <span>Masterpiece</span>
                        </h1>
                        <p className="hero-subtitle">
                            Discover the finest collection of handwoven sarees and artisanal crafts directly from India's master weavers. Experience the magic of live craftsmanship from your home.
                        </p>
                        <div className="hero-btns">
                            <Link to="/shop" className="btn btn-primary btn-lg">
                                Explore Collection
                            </Link>
                            <Link to="/sessions" className="btn btn-secondary btn-lg">
                                Watch Live Weaving
                            </Link>
                        </div>
                        <div className="hero-stats">
                            {[
                                { val: '500+', label: 'Artisans' },
                                { val: '10K+', label: 'Masterpieces' },
                                { val: '50K+', label: 'Global Lovers' }
                            ].map((stat) => (
                                <div key={stat.label} className="stat-item">
                                    <span className="stat-value">{stat.val}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hero-visuals animate-fade-in">
                        <div className="hero-image-main">
                            <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800" alt="Saree weaving" />
                        </div>
                        <div className="hero-image-side">
                            <img src="https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=400" alt="Silk detail" />
                            <img src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400" alt="Artisan work" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CATEGORIES SECTION ── */}
            <section className="category-section section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Shop by Heritage</h2>
                        <p className="section-subtitle">Curated collections from India's most renowned weaving clusters</p>
                    </div>
                    <div className="category-grid">
                        {CATEGORIES.map((cat) => (
                            <Link key={cat} to={`/shop?category=${encodeURIComponent(cat)}`} className="category-card">
                                <div className="category-icon-box">
                                    {cat.includes('Silk') ? 
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> : 
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                                    }
                                </div>
                                <span className="category-name">{cat}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED PRODUCTS ── */}
            <section className="featured-section section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Artisan's Choice</h2>
                        <p className="section-subtitle">Most loved masterpieces from our verified sellers</p>
                    </div>
                    <div className="products-grid">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    <div className="section-footer">
                        <Link to="/shop" className="btn btn-secondary">Discover More</Link>
                    </div>
                </div>
            </section>

            {/* ── LIVE SESSION PROMO ── */}
            <section className="sessions-promo section">
                <div className="container promo-inner">
                    <div className="promo-content">
                        <span className="promo-tag">Live Craftsmanship</span>
                        <h2 className="promo-title">Witness the Art of Weaving in Real-Time</h2>
                        <p className="promo-text">
                            Join exclusive live sessions with master artisans. Watch as a masterpiece comes to life, ask questions directly to the weavers, and book unique pieces before they hit the market.
                        </p>
                        <Link to="/sessions" className="btn btn-primary">
                            Explore Live Sessions
                        </Link>
                    </div>
                    <div className="promo-cards">
                        {sessions.length > 0 ? sessions.slice(0, 2).map((s) => (
                            <div key={s._id} className="mini-session-card">
                                <div className="live-dot-wrap">
                                    <span className="live-dot"></span>
                                    {s.status}
                                </div>
                                <h4>{s.title}</h4>
                                <p>{new Date(s.scheduledAt).toLocaleDateString()}</p>
                            </div>
                        )) : (
                            <div className="empty-promo">Upcoming sessions are being scheduled.</div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── ARTISAN STORY ── */}
            <section className="story-section section">
                <div className="container story-inner">
                    <div className="story-images">
                        <img src="https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=600" className="img-large" alt="Artisan" />
                        <div className="img-stack">
                            <img src="https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=300" alt="Craft" />
                            <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300" alt="Jewelry" />
                        </div>
                    </div>
                    <div className="story-text">
                        <h2 className="section-title">Preserving Heritage, One Saree at a Time</h2>
                        <p>
                            Loom Look is more than a marketplace. It's a bridge between ancient craftsmanship and the modern home. Every purchase directly empowers artisan families and ensures these timeless traditions survive for generations.
                        </p>
                        <div className="story-features">
                            {[
                                { title: 'Verified Authentic', desc: '100% handwoven certification', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
                                { title: 'Direct Income', desc: 'Fair trade directly to artisans', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                                { title: 'Sustainable', desc: 'Eco-friendly traditional dyes', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> }
                            ].map(f => (
                                <div key={f.title} className="story-feature-item">
                                    <div className="f-icon">{f.icon}</div>
                                    <div>
                                        <h5>{f.title}</h5>
                                        <p>{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/about" className="btn btn-secondary">Our Full Story</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
