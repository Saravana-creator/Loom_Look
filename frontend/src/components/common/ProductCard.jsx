import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ProductCard = memo(({ product }) => {
    const { addToCart } = useCart();
    const { isAuthenticated, role } = useAuth();

    const discountPercent =
        product.discountPrice > 0
            ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
            : 0;

    const displayPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated || role !== 'user') {
            toast.info('Please login as a user to add items to cart.');
            return;
        }
        if (product.stock === 0) {
            toast.error('This product is out of stock.');
            return;
        }
        await addToCart(product.id, 1);
    };

    return (
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
            <div className="product-card">
                {/* Image wrapper — consistent height with object-fit: cover */}
                <div className="product-card__image-wrap">
                    <img
                        src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400'}
                        alt={product.images?.[0]?.altText || product.name}
                        loading="lazy"
                    />
                    {discountPercent > 0 && (
                        <span className="product-card__badge">{discountPercent}% OFF</span>
                    )}
                    {product.stock === 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1rem',
                                letterSpacing: '0.05em',
                            }}
                        >
                            OUT OF STOCK
                        </div>
                    )}
                </div>

                <div className="product-card__body">
                    <p className="product-card__category">{product.category}</p>
                    <h3 className="product-card__name">{product.name}</h3>

                    <div className="product-card__rating">
                        <div className="rating-stars">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < Math.round(product.ratings?.average || 0) ? "var(--gold-silk)" : "none"} stroke="var(--gold-silk)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            ))}
                        </div>
                        <span>({product.ratings?.count || 0})</span>
                    </div>

                    <div className="product-card__price-row">
                        <span className="product-card__price">
                            ₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        {discountPercent > 0 && (
                            <>
                                <span className="product-card__original-price">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                                <span className="product-card__discount">{discountPercent}% off</span>
                            </>
                        )}
                    </div>

                    {product.vendor?.shopName && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-moss)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            {product.vendor.shopName}
                        </p>
                    )}

                    <div className="product-card__actions">
                        <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, fontSize: '0.82rem' }}
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            {product.stock === 0 ? 'Out of Stock' : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                                    ADD TO CART
                                </>
                            )}
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '8px 12px' }}
                            onClick={(e) => e.preventDefault()}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
