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
        <div className="canvas-container">
            {/* ── ARTISTIC HERO ── */}
            <section className="canvas-hero">
                <div className="hero-montage">
                    <div className="montage-item item-1 animate-fade-in">
                        <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800" alt="Weaving" />
                    </div>
                    <div className="montage-item item-2 animate-slide-up">
                        <img src="https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=400" alt="Silk" />
                    </div>
                </div>
                
                <div className="hero-text-overlay">
                    <span className="canvas-tag">Est. 2024</span>
                    <h1 className="canvas-title">
                        THREADS OF <br />
                        <span className="italic">HERITAGE.</span>
                    </h1>
                    <p className="canvas-subtitle">
                        A curated sanctuary for India's most profound weaving traditions. 
                        Directly from the artisan's loom to your soul.
                    </p>
                    <div className="canvas-btns">
                        <Link to="/shop" className="btn btn-primary">
                            <span>EXPLORE COLLECTION</span>
                        </Link>
                        <div className="canvas-scroll-hint">
                            <div className="hint-line"></div>
                            <span>SCROLL TO DISCOVER</span>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="stitch-line" />

            {/* ── ASYMMETRIC CATEGORIES ── */}
            <section className="canvas-section">
                <div className="container">
                    <div className="asymmetric-header">
                        <h2 className="canvas-heading">The <span className="italic">Craft</span> Clusters</h2>
                        <p>Explore by weaving style.</p>
                    </div>
                    
                    <div className="gallery-masonry">
                        {CATEGORIES.map((cat, idx) => (
                            <Link key={cat} to={`/shop?category=${encodeURIComponent(cat)}`} className={`masonry-card card-${idx % 4}`}>
                                <div className="card-inner">
                                    <span className="card-num">0{idx + 1}</span>
                                    <h3>{cat}</h3>
                                    <div className="card-arrow">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STAGGERED PRODUCTS ── */}
            <section className="canvas-section bg-silk">
                <div className="container">
                    <div className="section-intro">
                        <h2 className="canvas-heading">The <span className="italic">Masterpieces</span></h2>
                    </div>
                    
                    <div className="staggered-grid">
                        {featuredProducts.map((product, idx) => (
                            <div key={product._id} className={`stagger-item ${idx % 2 === 0 ? 'even' : 'odd'}`}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                    
                    <div className="canvas-footer-btn">
                        <Link to="/shop" className="btn btn-primary">
                            <span>VIEW ENTIRE GALLERY</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── LIVE EXPERIENCE ── */}
            <section className="canvas-experience">
                <div className="experience-inner container">
                    <div className="exp-visual">
                        <img src="https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=800" alt="Live Artisan" />
                        <div className="live-badge">LIVE NOW</div>
                    </div>
                    <div className="exp-text">
                        <h2 className="canvas-heading white">Watch the <span className="italic">Rhythm</span> of the Loom</h2>
                        <p>Join our master artisans in real-time sessions. Witness the precision, the passion, and the patience required to weave a masterpiece.</p>
                        <Link to="/sessions" className="btn btn-primary bg-crimson">
                            <span>ENTER THE STUDIO</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── ARTISAN FOOTER ── */}
            <section className="canvas-story">
                <div className="container">
                    <div className="story-split">
                        <div className="story-text">
                            <h2 className="canvas-heading">Preserving the <span className="italic">Invisible</span> Art.</h2>
                            <p>Every purchase on Loom Look is a direct contribution to the artisan's heritage. We ensure fair trade, transparent pricing, and the preservation of ancient techniques.</p>
                            <div className="story-stat-row">
                                <div className="story-stat">
                                    <span className="stat-big">500+</span>
                                    <span className="stat-small">ARTISAN FAMILIES</span>
                                </div>
                                <div className="story-stat">
                                    <span className="stat-big">24+</span>
                                    <span className="stat-small">CRAFT CLUSTERS</span>
                                </div>
                            </div>
                        </div>
                        <div className="story-collage">
                            <img src="https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400" className="collage-1" alt="Pottery" />
                            <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400" className="collage-2" alt="Jewelry" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
