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
        <div>
            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-content container">
                    <div className="animate-slide-up">
                        <p className="section-tag" style={{ marginBottom: 20 }}>
                            ✨ India's Finest Handmade Marketplace
                        </p>
                        <h1 className="hero-title">
                            Where Every Thread Tells a <span>Story</span>
                        </h1>
                        <p className="hero-subtitle">
                            Discover authentic handwoven sarees and handcrafted products
                            directly from skilled Indian artisans. Join live weaving sessions
                            and watch masterpieces come to life.
                        </p>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <Link to="/shop" className="btn btn-gold btn-lg">
                                🛍️ Shop Now
                            </Link>
                            <Link to="/sessions" className="btn btn-secondary btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                                📹 Live Sessions
                            </Link>
                        </div>
                        <div style={{ display: 'flex', gap: 32, marginTop: 36 }}>
                            {[['500+', 'Artisans'], ['10K+', 'Products'], ['50K+', 'Happy Customers']].map(([num, label]) => (
                                <div key={label}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gold-light)', fontFamily: 'Playfair Display, serif' }}>{num}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,254,248,0.6)' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hero-img-grid">
                        <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700" alt="Saree weaving" loading="eager" />
                        <img src="https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=400" alt="Silk saree" loading="lazy" />
                        <img src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400" alt="Chanderi saree" loading="lazy" />
                    </div>
                </div>
            </section>

            {/* ── CATEGORIES ── */}
            <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Categories</span>
                        <h2 className="section-title">Shop by Craft</h2>
                        <p className="section-subtitle">Explore our curated collection of handmade treasures from across India</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat}
                                to={`/shop?category=${encodeURIComponent(cat)}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '24px 16px',
                                        textAlign: 'center',
                                        border: '1px solid var(--border-light)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        e.currentTarget.style.borderColor = 'var(--border-light)';
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>
                                        {cat.includes('Silk') ? '🧵' : cat.includes('Cotton') ? '🌿' : cat.includes('Banarasi') ? '✨' :
                                            cat.includes('Kanjivaram') ? '🪡' : cat.includes('Jewelry') ? '💎' : '🏺'}
                                    </div>
                                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cat}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED PRODUCTS ── */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Best Sellers</span>
                        <h2 className="section-title">Featured Handmade Sarees</h2>
                        <p className="section-subtitle">Curated selections from our top artisans, loved by thousands</p>
                    </div>
                    <div className="products-grid">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                        <Link to="/shop" className="btn btn-primary btn-lg">View All Products</Link>
                    </div>
                </div>
            </section>

            {/* ── LIVE SESSIONS PROMO ── */}
            <section className="section" style={{ background: 'var(--gradient-hero)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
                        <div>
                            <span className="section-tag" style={{ background: 'rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.4)', color: 'var(--gold-light)' }}>
                                📹 Live Experiences
                            </span>
                            <h2 style={{ color: 'white', marginTop: 16, marginBottom: 16 }}>
                                Watch Masterpieces Being Created
                            </h2>
                            <p style={{ color: 'rgba(255,254,248,0.75)', marginBottom: 32, lineHeight: 1.8 }}>
                                Join our exclusive live sessions where master weavers and artisans demonstrate traditional techniques.
                                Book a session, ask questions, and witness the magic of handmade crafts in real time.
                            </p>
                            <Link to="/sessions" className="btn btn-gold">
                                🎟️ Book a Live Session
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {sessions.length > 0 ? sessions.slice(0, 2).map((session) => (
                                <div
                                    key={session._id}
                                    style={{
                                        background: 'rgba(255,255,255,0.07)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 20,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎭</div>
                                    <h4 style={{ color: 'white', fontSize: '0.95rem', marginBottom: 6 }}>{session.title}</h4>
                                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,254,248,0.6)' }}>
                                        {new Date(session.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            )) : (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,254,248,0.5)', padding: 40 }}>
                                    Coming Soon! Live sessions loading...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ARTISAN STORY ── */}
            <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
                        <div style={{ display: 'grid', gridTemplateRows: '220px 220px', gap: 12 }}>
                            <img
                                src="https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=600"
                                alt="Artisan weaving"
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <img
                                    src="https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=300"
                                    alt="Pottery craft"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                                />
                                <img
                                    src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300"
                                    alt="Handcrafted jewelry"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                                />
                            </div>
                        </div>
                        <div>
                            <span className="section-tag">Our Story</span>
                            <h2 className="section-title" style={{ marginTop: 16 }}>Empowering India's Artisan Community</h2>
                            <p style={{ marginBottom: 20 }}>
                                Loom Look was founded with a simple mission: to bridge the gap between skilled Indian artisans
                                and customers who appreciate authentic handmade products.
                            </p>
                            <p>
                                Every purchase on Loom Look directly supports a family of weavers or craftspeople,
                                helping preserve ancient traditions while creating sustainable livelihoods.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32 }}>
                                {[['🌿', 'Sustainable', 'Eco-friendly handmade products'],
                                ['🤝', 'Fair Trade', 'Direct artisan income'],
                                ['🔐', 'Secure', 'AES-encrypted transactions'],
                                ['✅', 'Verified', 'Authentic handmade only']].map(([icon, title, desc]) => (
                                    <div key={title} style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 16,
                                        border: '1px solid var(--border-light)',
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'flex-start',
                                    }}>
                                        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                                        <div>
                                            <h5 style={{ fontSize: '0.9rem', marginBottom: 4 }}>{title}</h5>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/about" className="btn btn-primary" style={{ marginTop: 28 }}>Learn More</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{
                background: 'var(--gradient-primary)',
                padding: '80px 20px',
                textAlign: 'center',
            }}>
                <div className="container">
                    <h2 style={{ color: 'white', marginBottom: 12 }}>Are You an Artisan or Weaver?</h2>
                    <p style={{ color: 'rgba(255,254,248,0.8)', maxWidth: 500, margin: '0 auto 32px' }}>
                        Join Loom Look as a vendor and reach thousands of customers who value authentic handmade products.
                    </p>
                    <Link to="/vendor/register" className="btn btn-gold btn-lg">
                        🧵 Join as Vendor
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
