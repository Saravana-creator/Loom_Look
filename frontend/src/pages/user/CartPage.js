import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { PageLoader, EmptyState } from '../../components/common/UI';

const CartPage = () => {
    const { items, subtotal, itemCount, loading, fetchCart, updateItem, removeItem } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { fetchCart(); }, [fetchCart]);

    const shippingCharge = subtotal > 999 ? 0 : 80;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shippingCharge + tax;

    if (loading) return <PageLoader />;
    if (!isAuthenticated) { navigate('/login'); return null; }

    return (
        <div>
            <div className="page-header">
                <h1>Shopping Cart</h1>
                <p>{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
            </div>

            <div className="page-content">
                {items.length === 0 ? (
                    <EmptyState
                        icon="🛒"
                        title="Your cart is empty"
                        message="Discover beautiful handmade sarees and crafts."
                        action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>}
                    />
                ) : (
                    <div className="cart-page">
                        {/* Cart Items */}
                        <div>
                            <h3 style={{ marginBottom: 20 }}>Cart Items</h3>
                            {items.map((item) => {
                                const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price;
                                return (
                                    <div key={item.product?._id} className="cart-item">
                                        <div className="cart-item__img">
                                            <img
                                                src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200'}
                                                alt={item.product?.name}
                                            />
                                        </div>
                                        <div className="cart-item__info">
                                            <h4 className="cart-item__name">{item.product?.name}</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 4 }}>
                                                {item.product?.vendor?.shopName}
                                            </p>
                                            <p className="cart-item__price">₹{price?.toLocaleString('en-IN')}</p>
                                            <div className="qty-control">
                                                <button className="qty-btn" onClick={() => updateItem(item.product._id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button className="qty-btn" onClick={() => updateItem(item.product._id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>+</button>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: 12 }}>
                                                ₹{(price * item.quantity).toLocaleString('en-IN')}
                                            </p>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => removeItem(item.product._id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div>
                            <div className="order-summary">
                                <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 20 }}>Order Summary</h3>
                                <div className="summary-row">
                                    <span>Subtotal ({itemCount} items)</span>
                                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Shipping</span>
                                    <span style={{ color: shippingCharge === 0 ? '#16a34a' : undefined }}>
                                        {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                                    </span>
                                </div>
                                <div className="summary-row">
                                    <span>GST (5%)</span>
                                    <span>₹{tax.toLocaleString('en-IN')}</span>
                                </div>
                                {shippingCharge === 0 && (
                                    <p style={{ fontSize: '0.78rem', color: '#16a34a', margin: '4px 0 8px' }}>
                                        🎉 You saved ₹80 on shipping!
                                    </p>
                                )}
                                {subtotal < 1000 && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', margin: '4px 0 8px' }}>
                                        Add ₹{(1000 - subtotal).toLocaleString('en-IN')} more for free shipping
                                    </p>
                                )}
                                <div className="summary-total">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString('en-IN')}</span>
                                </div>
                                <button
                                    className="btn btn-primary btn-full"
                                    style={{ marginTop: 20 }}
                                    onClick={() => navigate('/checkout')}
                                >
                                    Proceed to Checkout →
                                </button>
                                <Link to="/shop" className="btn btn-secondary btn-full" style={{ marginTop: 10, fontSize: '0.85rem' }}>
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
