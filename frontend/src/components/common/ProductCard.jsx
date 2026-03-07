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
        await addToCart(product._id, 1);
    };

    return (
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
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
                        {'⭐'.repeat(Math.round(product.ratings?.average || 0))}
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
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '12px' }}>
                            🏪 {product.vendor.shopName}
                        </p>
                    )}

                    <div className="product-card__actions">
                        <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, fontSize: '0.82rem' }}
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '8px 12px' }}
                            onClick={(e) => e.preventDefault()}
                        >
                            🤍
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
