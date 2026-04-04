import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
    const { items, subtotal, fetchCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'
    const [address, setAddress] = useState({
        fullName: user?.name || '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
    });

    const shippingCharge = subtotal > 999 ? 0 : 80;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shippingCharge + tax;

    const handleChange = (e) => {
        setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLocationDetection = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Using OSM Nominatim for free reverse geocoding
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    
                    if (data && data.address) {
                        const { road, suburb, city, town, state, postcode } = data.address;
                        setAddress(prev => ({
                            ...prev,
                            street: [road, suburb].filter(Boolean).join(', '),
                            city: city || town || '',
                            state: state || '',
                            pincode: postcode || prev.pincode
                        }));
                        toast.success('📍 Location detected successfully!');
                    }
                } catch (err) {
                    toast.error('Could not fetch address details. Please fill manually.');
                } finally {
                    setDetecting(false);
                }
            },
            () => {
                toast.error('Location access denied. Please fill manually.');
                setDetecting(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) return;

        setLoading(true);
        try {
            const orderItems = items.map((item) => ({
                productId: item.product._id,
                quantity: item.quantity,
            }));

            const { data } = await orderService.createOrder({
                items: orderItems,
                shippingAddress: address,
                paymentMethod: paymentMethod,
            });

            const { order, razorpayOrderId, amount, currency, razorpayKeyId } = data.data;

            if (paymentMethod === 'cod') {
                // COD Flow
                await fetchCart(); // Refresh cart to show it's empty
                toast.success('🎉 Order confirmed! You can pay on delivery.');
                navigate(`/orders`);
                return;
            }

            // Razorpay Flow
            const loaded = await loadRazorpay();
            if (!loaded) { toast.error('Failed to load payment gateway.'); setLoading(false); return; }

            const options = {
                key: razorpayKeyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount,
                currency,
                name: 'Loom Look',
                description: 'Handmade Saree Marketplace',
                image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100',
                order_id: razorpayOrderId,
                handler: async (response) => {
                    try {
                        await orderService.verifyPayment({
                            orderId: order._id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        await fetchCart();
                        toast.success('🎉 Payment successful! Order confirmed.');
                        navigate(`/orders`);
                    } catch {
                        toast.error('Payment verification failed. Contact support.');
                    }
                },
                prefill: {
                    name: address.fullName,
                    contact: address.phone,
                },
                theme: { color: '#8B4513' },
                modal: { ondismiss: () => setLoading(false) },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process order.');
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            <div className="page-header" style={{ marginBottom: 40 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--primary-dark)' }}>Order Checkout</h1>
                <p style={{ color: 'var(--text-light)' }}>Secure your favorite handmade sarees</p>
            </div>

            <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
                <form onSubmit={handleOrderSubmit}>
                    <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 40, alignItems: 'start' }}>
                        
                        {/* Section 1: Shipping & Location */}
                        <div className="checkout-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: '1.5rem' }}>📦</span> Shipping Details
                                </h3>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm" 
                                    onClick={handleLocationDetection}
                                    disabled={detecting}
                                    style={{ borderRadius: 20, padding: '6px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    {detecting ? '⌛ Detecting...' : '📍 Use My Location'}
                                </button>
                            </div>
                            
                            <div className="form-card" style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                                <div className="grid-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Full Name</label>
                                        <input className="form-control" name="fullName" value={address.fullName} onChange={handleChange} required placeholder="Recipient name" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Mobile Number</label>
                                        <input className="form-control" name="phone" value={address.phone} onChange={handleChange} required pattern="[6-9]\d{9}" placeholder="10-digit mobile number" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Street/Area Address</label>
                                        <textarea className="form-control" name="street" value={address.street} onChange={handleChange} rows={2} required placeholder="House No, Road, Locality" />
                                    </div>
                                    <div>
                                        <label className="form-label">City</label>
                                        <input className="form-control" name="city" value={address.city} onChange={handleChange} required placeholder="City/Town" />
                                    </div>
                                    <div>
                                        <label className="form-label">PIN Code</label>
                                        <input className="form-control" name="pincode" value={address.pincode} onChange={handleChange} required pattern="\d{6}" placeholder="6 digits" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Payment Options */}
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 40, marginBottom: 24 }}>
                                <span style={{ fontSize: '1.5rem' }}>💳</span> Payment Method
                            </h3>
                            <div className="payment-options" style={{ display: 'grid', gap: 16 }}>
                                <label className={`payment-card ${paymentMethod === 'razorpay' ? 'active' : ''}`} style={{ 
                                    display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', padding: 20, 
                                    border: `2px solid ${paymentMethod === 'razorpay' ? 'var(--primary)' : 'var(--border-light)'}`, 
                                    borderRadius: 16, background: paymentMethod === 'razorpay' ? 'var(--bg-highlight)' : 'var(--bg-card)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <input type="radio" name="payment" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} style={{ width: 18, height: 18 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>Secure Online Payment</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Cards, UPI, NetBanking, Wallets</p>
                                    </div>
                                    <span style={{ fontSize: '1.2rem' }}>🌐</span>
                                </label>

                                <label className={`payment-card ${paymentMethod === 'cod' ? 'active' : ''}`} style={{ 
                                    display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', padding: 20, 
                                    border: `2px solid ${paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border-light)'}`, 
                                    borderRadius: 16, background: paymentMethod === 'cod' ? 'var(--bg-highlight)' : 'var(--bg-card)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ width: 18, height: 18 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>Cash on Delivery</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Pay when your saree arrives</p>
                                    </div>
                                    <span style={{ fontSize: '1.2rem' }}>💵</span>
                                </label>
                            </div>
                        </div>

                        {/* Section 3: Summary & Action */}
                        <div className="summary-section">
                            <div className="order-summary-card" style={{ position: 'sticky', top: 100, background: 'var(--bg-card)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
                                <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>Order Summary</h3>
                                <div className="summary-items" style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 8 }}>
                                    {items.map((item) => {
                                        const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price;
                                        return (
                                            <div key={item.product?._id} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                                                <img src={item.product?.images?.[0]?.url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.product?.name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Qty: {item.quantity}</p>
                                                </div>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{(price * item.quantity).toLocaleString('en-IN')}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 16, display: 'grid', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}><span>Shipping</span><span>{shippingCharge === 0 ? <span style={{ color: '#16a34a' }}>FREE</span> : `₹${shippingCharge}`}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}><span>GST (5%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem', marginTop: 12, color: 'var(--primary-dark)' }}>
                                        <span>Total</span>
                                        <span>₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 32, padding: '16px', borderRadius: 12, fontSize: '1rem', fontWeight: 600 }} disabled={loading}>
                                    {loading ? 'Processing...' : (paymentMethod === 'razorpay' ? '🔒 Pay & Place Order' : '📦 Confirm COD Order')}
                                </button>
                                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                    {paymentMethod === 'razorpay' ? 'Secure encrypted transactions by Razorpay' : 'Pay in cash when delivery partner reaches you'}
                                </p>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;
