import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
    const { items, subtotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (items.length === 0) return;

        setLoading(true);
        try {
            // Load Razorpay
            const loaded = await loadRazorpay();
            if (!loaded) { toast.error('Failed to load payment gateway.'); setLoading(false); return; }

            // Create order in backend
            const orderItems = items.map((item) => ({
                productId: item.product._id,
                quantity: item.quantity,
            }));

            const { data } = await orderService.createOrder({
                items: orderItems,
                shippingAddress: address,
                paymentMethod: 'razorpay',
            });

            const { order, razorpayOrderId, amount, currency, razorpayKeyId } = data.data;

            // Open Razorpay checkout
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
                        await clearCart();
                        toast.success('🎉 Payment successful! Your order is confirmed.');
                        navigate(`/orders/${order._id}`);
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
            toast.error(err.response?.data?.message || 'Failed to create order.');
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Checkout</h1>
                <p>Complete your order</p>
            </div>

            <div className="page-content">
                <form onSubmit={handlePayment}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
                        {/* Shipping Address */}
                        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 28, border: '1px solid var(--border-light)' }}>
                            <h3 style={{ marginBottom: 24 }}>📦 Shipping Address</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-control" name="fullName" value={address.fullName} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Phone *</label>
                                    <input className="form-control" name="phone" value={address.phone} onChange={handleChange} required pattern="[6-9]\d{9}" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Street Address *</label>
                                    <textarea className="form-control" name="street" value={address.street} onChange={handleChange} rows={2} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input className="form-control" name="city" value={address.city} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State *</label>
                                    <input className="form-control" name="state" value={address.state} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PIN Code *</label>
                                    <input className="form-control" name="pincode" value={address.pincode} onChange={handleChange} required pattern="\d{6}" />
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <div className="order-summary">
                                <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 20 }}>Order Summary</h3>
                                <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
                                    {items.map((item) => {
                                        const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price;
                                        return (
                                            <div key={item.product?._id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                                                <img src={item.product?.images?.[0]?.url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.product?.name}</p>
                                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>x{item.quantity}</p>
                                                </div>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>₹{(price * item.quantity).toLocaleString('en-IN')}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                                <div className="summary-row"><span>Shipping</span><span>{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span></div>
                                <div className="summary-row"><span>GST (5%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
                                <div className="summary-total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 20 }} disabled={loading}>
                                    {loading ? '⏳ Processing...' : '💳 Pay with Razorpay'}
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                    🔒 Secured by Razorpay
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;
