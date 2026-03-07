import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../services';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PageLoader, Badge } from '../components/common/UI';
import { toast } from 'react-toastify';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated, role } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [review, setReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await productService.getProduct(id);
                setProduct(data.data);
            } catch {
                navigate('/shop');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    const handleAddToCart = async () => {
        if (!isAuthenticated || role !== 'user') {
            toast.info('Please login as a user to add items to cart.');
            navigate('/login');
            return;
        }
        setAddingToCart(true);
        await addToCart(product._id, quantity);
        setAddingToCart(false);
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        navigate('/cart');
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated || role !== 'user') {
            toast.info('Login to leave a review.');
            return;
        }
        setSubmittingReview(true);
        try {
            await productService.addReview(id, review);
            toast.success('Review submitted!');
            const { data } = await productService.getProduct(id);
            setProduct(data.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!product) return null;

    const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
    const discountPercent = product.discountPrice > 0
        ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
        : 0;

    return (
        <div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                <div className="container">
                    <Link to="/" style={{ color: 'var(--text-light)' }}>Home</Link> &gt;{' '}
                    <Link to="/shop" style={{ color: 'var(--text-light)' }}>Shop</Link> &gt;{' '}
                    <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
                </div>
            </div>

            <div className="page-content">
                {/* Main detail grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 60 }}>
                    {/* Images */}
                    <div>
                        <div style={{ height: 480, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 12, background: 'var(--bg-secondary)' }}>
                            <img
                                src={product.images?.[selectedImage]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        {product.images?.length > 1 && (
                            <div style={{ display: 'flex', gap: 10 }}>
                                {product.images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            width: 80, height: 80, borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden', cursor: 'pointer',
                                            border: `2px solid ${selectedImage === idx ? 'var(--primary)' : 'var(--border-light)'}`,
                                        }}
                                        onClick={() => setSelectedImage(idx)}
                                    >
                                        <img src={img.url} alt={img.altText} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            {product.category}
                        </p>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: 16 }}>{product.name}</h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                                {'⭐'.repeat(Math.round(product.ratings?.average || 0))}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                {product.ratings?.average?.toFixed(1) || 'No'} rating ({product.ratings?.count || 0} reviews)
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
                            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'Playfair Display, serif' }}>
                                ₹{displayPrice.toLocaleString('en-IN')}
                            </span>
                            {discountPercent > 0 && (
                                <>
                                    <span style={{ fontSize: '1.1rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </span>
                                    <Badge status={`${discountPercent}% off`} />
                                </>
                            )}
                        </div>

                        <p style={{ lineHeight: 1.8, marginBottom: 24, color: 'var(--text-secondary)' }}>{product.description}</p>

                        {/* Details */}
                        {(product.material || product.handmadeDetails) && (
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24 }}>
                                <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Product Details</h4>
                                {product.material && <p style={{ fontSize: '0.88rem', marginBottom: 6 }}><b>Material:</b> {product.material}</p>}
                                {product.handmadeDetails?.craftType && <p style={{ fontSize: '0.88rem', marginBottom: 6 }}><b>Craft:</b> {product.handmadeDetails.craftType}</p>}
                                {product.handmadeDetails?.region && <p style={{ fontSize: '0.88rem', marginBottom: 6 }}><b>Region:</b> {product.handmadeDetails.region}</p>}
                                {product.handmadeDetails?.artisan && <p style={{ fontSize: '0.88rem' }}><b>Artisan:</b> {product.handmadeDetails.artisan}</p>}
                            </div>
                        )}

                        {/* Stock */}
                        <p style={{ fontSize: '0.88rem', marginBottom: 20, color: product.stock > 0 ? '#16a34a' : '#dc2626' }}>
                            {product.stock > 0 ? `✅ ${product.stock} in stock` : '❌ Out of stock'}
                        </p>

                        {/* Quantity */}
                        {product.stock > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Qty:</span>
                                <div className="qty-control">
                                    <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                                    <span className="qty-value">{quantity}</span>
                                    <button className="qty-btn" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleAddToCart}
                                disabled={product.stock === 0 || addingToCart}
                            >
                                {addingToCart ? '⏳ Adding...' : '🛒 Add to Cart'}
                            </button>
                            <button
                                className="btn btn-gold"
                                style={{ flex: 1 }}
                                onClick={handleBuyNow}
                                disabled={product.stock === 0}
                            >
                                ⚡ Buy Now
                            </button>
                        </div>

                        {product.vendor && (
                            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏪</div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.vendor.shopName}</p>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Verified Artisan Vendor</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div>
                    <h2 style={{ marginBottom: 24 }}>Customer Reviews</h2>

                    {/* Add review form */}
                    {isAuthenticated && role === 'user' && (
                        <form onSubmit={handleReviewSubmit} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 28, border: '1px solid var(--border-light)' }}>
                            <h4 style={{ marginBottom: 16 }}>Write a Review</h4>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        style={{ fontSize: '1.4rem', cursor: 'pointer', opacity: review.rating >= star ? 1 : 0.3 }}
                                        onClick={() => setReview((r) => ({ ...r, rating: star }))}
                                    >⭐</span>
                                ))}
                            </div>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Share your experience..."
                                value={review.comment}
                                onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                                style={{ marginBottom: 14 }}
                            />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    )}

                    {/* Review list */}
                    {product.reviews?.length === 0 ? (
                        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>
                            No reviews yet. Be the first to review!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {product.reviews?.map((r, idx) => (
                                <div key={idx} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 600 }}>Customer Review</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                            {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        {'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                    </div>
                                    <p style={{ fontSize: '0.9rem' }}>{r.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
