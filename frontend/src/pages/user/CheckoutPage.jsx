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
    const [paymentMethod, setPaymentMethod] = useState('razorpay'); 
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
        if (!navigator.geolocation) return;
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
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
                        toast.success('Location Refined');
                    }
                } catch (err) {
                    toast.error('Could not auto-fill address.');
                } finally {
                    setDetecting(false);
                }
            },
            () => setDetecting(false),
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
                productId: item.product.id,
                quantity: item.quantity,
            }));

            const { data } = await orderService.createOrder({
                items: orderItems,
                shippingAddress: address,
                paymentMethod: paymentMethod,
            });

            const { order, razorpayOrderId, amount, currency, razorpayKeyId } = data.data;

            if (paymentMethod === 'cod') {
                await fetchCart();
                toast.success('Heritage piece reserved! Pay on arrival.');
                navigate(`/orders`);
                return;
            }

            const loaded = await loadRazorpay();
            if (!loaded) { toast.error('Payment gateway unavailable.'); setLoading(false); return; }

            const options = {
                key: razorpayKeyId,
                amount,
                currency,
                name: 'Loom Look',
                description: 'Authentic Heritage Collection',
                image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100',
                order_id: razorpayOrderId,
                handler: async (response) => {
                    try {
                        await orderService.verifyPayment({
                            orderId: order.id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        await fetchCart();
                        toast.success('Payment Secured. Weaving your order.');
                        navigate(`/orders`);
                    } catch {
                        toast.error('Verification failed. Assistance required.');
                    }
                },
                prefill: { name: address.fullName, contact: address.phone },
                theme: { color: '#064E3B' },
                modal: { ondismiss: () => setLoading(false) },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transaction could not be initialized.');
            setLoading(false);
        }
    };

    return (
        <div className="canvas-checkout">
            <div className="checkout-split">
                {/* ── LEFT: ARTISAN'S SUMMARY ── */}
                <div className="checkout-summary-panel">
                    <div className="summary-inner animate-fade-in">
                        <span className="visual-label">Your Selection</span>
                        <h2 className="summary-title">The <span className="italic">Artisan's</span> Invoice</h2>
                        <div className="summary-items-list">
                            {items.map((item) => (
                                <div key={item.product?.id} className="summary-item-card">
                                    <div className="item-visual">
                                        <img src={item.product?.images?.[0]?.url} alt="" />
                                    </div>
                                    <div className="item-detail">
                                        <h4>{item.product?.name}</h4>
                                        <p>Qty: {item.quantity}</p>
                                    </div>
                                    <div className="item-price">
                                        ₹{( (item.product?.discount_price > 0 ? item.product.discount_price : item.product?.price) * item.quantity).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="summary-totals">
                            <div className="total-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                            <div className="total-row"><span>Shipping</span><span>{shippingCharge === 0 ? 'COMPLIMENTARY' : `₹${shippingCharge}`}</span></div>
                            <div className="total-row"><span>GST (5%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
                            <div className="total-grand">
                                <span>GRAND TOTAL</span>
                                <span>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: SHIPPING & PAYMENT ── */}
                <div className="checkout-form-panel">
                    <form onSubmit={handleOrderSubmit} className="form-inner animate-slide-up">
                        <div className="form-header">
                            <h3 className="section-title">Shipping <span className="italic">Destiny</span></h3>
                            <button type="button" className="btn-text-only" onClick={handleLocationDetection}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                                {detecting ? 'REFINING...' : 'USE GEOLOCATION'}
                            </button>
                        </div>

                        <div className="minimal-grid">
                            <div className="minimal-group full">
                                <input className="minimal-input" name="fullName" value={address.fullName} onChange={handleChange} required placeholder="RECIPIENT NAME" />
                                <div className="minimal-bar"></div>
                            </div>
                            <div className="minimal-group full">
                                <input className="minimal-input" name="phone" value={address.phone} onChange={handleChange} required pattern="[6-9]\d{9}" placeholder="CONTACT NUMBER" />
                                <div className="minimal-bar"></div>
                            </div>
                            <div className="minimal-group full">
                                <textarea className="minimal-input" name="street" value={address.street} onChange={handleChange} required placeholder="STREET ADDRESS" rows="1" />
                                <div className="minimal-bar"></div>
                            </div>
                            <div className="minimal-group">
                                <input className="minimal-input" name="city" value={address.city} onChange={handleChange} required placeholder="CITY" />
                                <div className="minimal-bar"></div>
                            </div>
                            <div className="minimal-group">
                                <input className="minimal-input" name="pincode" value={address.pincode} onChange={handleChange} required pattern="\d{6}" placeholder="PINCODE" />
                                <div className="minimal-bar"></div>
                            </div>
                        </div>

                        <div className="payment-selection">
                            <h3 className="section-title">Payment <span className="italic">Portal</span></h3>
                            <div className="unique-payment-grid">
                                <div 
                                    className={`payment-method-box ${paymentMethod === 'razorpay' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('razorpay')}
                                >
                                    <div className="method-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </div>
                                    <div className="method-text">
                                        <h5>SECURE ONLINE</h5>
                                        <p>UPI, CARDS, NETBANKING</p>
                                    </div>
                                </div>
                                <div 
                                    className={`payment-method-box ${paymentMethod === 'cod' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('cod')}
                                >
                                    <div className="method-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                                    </div>
                                    <div className="method-text">
                                        <h5>HAND OVER CASH</h5>
                                        <p>PAY ON ARRIVAL</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-checkout" disabled={loading}>
                            <span>{loading ? 'PROCESSING TRANSACTION...' : 'FINALIZE RESERVATION'}</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
