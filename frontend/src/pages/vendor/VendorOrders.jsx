import React, { useState, useEffect } from 'react';
import { orderService } from '../../services';
import { EmptyState, PageLoader } from '../../components/common/UI';

const VendorOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const { data } = await orderService.getVendorOrders(params);
            setOrders(data.data);
        } catch { } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { load(); }, [filter, load]);

    return (
        <div className="ledger-container">
            <div className="ledger-header animate-fade-in">
                <span className="visual-label">Commercial Records</span>
                <h1 className="canvas-title">The <span className="italic">Artisan's</span> Ledger</h1>
                <p className="canvas-subtitle">Monitor your sales, acquisitions, and heritage transactions.</p>
            </div>

            <div className="ledger-controls">
                <div className="filter-ribbon">
                    {['all', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                        <button key={s} className={`ribbon-link ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                            {s.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <PageLoader /> : orders.length === 0 ? (
                <EmptyState 
                    icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>} 
                    title="Ledger is Empty" 
                    message="No transactions recorded for the selected period." 
                />
            ) : (
                <div className="ledger-entries-wrap animate-slide-up">
                    <div className="ledger-grid-header">
                        <span>TRANSACTION</span>
                        <span>ACQUISITION DETAILS</span>
                        <span>SETTLEMENT</span>
                        <span>STATUS</span>
                    </div>
                    
                    <div className="ledger-list">
                        {orders.map((o) => {
                            const paymentInfo = o.payment_info ? (typeof o.payment_info === 'string' ? JSON.parse(o.payment_info) : o.payment_info) : {};
                            return (
                                <div key={o.id} className="ledger-row">
                                    <div className="ledger-col-main">
                                        <span className="order-id">#{o.order_number || o.orderId}</span>
                                        <span className="order-date">{new Date(o.created_at || o.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="ledger-col-details">
                                        <div className="customer-info">
                                            <strong>{o.customer_name || 'Artisan Collector'}</strong>
                                            <span>{o.customer_email}</span>
                                        </div>
                                        <div className="payment-history">
                                            <span className="pay-id">PAYMENT: {paymentInfo.razorpayPaymentId || 'PENDING'}</span>
                                            <span className={`pay-status ${o.payment_status?.toLowerCase()}`}>{o.payment_status}</span>
                                        </div>
                                    </div>
                                    <div className="ledger-col-amount">
                                        <span className="currency">INR</span>
                                        <span className="value">{o.total_amount?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="ledger-col-status">
                                        <span className={`status-tag tag-${o.order_status?.toLowerCase() || o.status?.toLowerCase()}`}>
                                            {(o.order_status || o.status).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="entry-stitch"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorOrders;
