import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import { PageLoader, EmptyState } from '../../components/common/UI';
import { generateInvoice } from '../../utils/generateInvoice';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        orderService.getMyOrders().then(({ data }) => {
            setOrders(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleDownload = async (id) => {
        try {
            const { data } = await orderService.getOrder(id);
            generateInvoice(data.data);
        } catch (err) {
            console.error('Failed to download invoice', err);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="canvas-orders">
            <div className="orders-header animate-fade-in">
                <span className="visual-label">Your Acquisition History</span>
                <h1 className="canvas-title">The <span className="italic">Heritage</span> Journal</h1>
                <p className="canvas-subtitle">A curated record of the masterpieces you've brought home.</p>
            </div>

            <div className="orders-journal-list">
                {orders.length === 0 ? (
                    <EmptyState 
                        icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 8V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M3 3h18v5H3z"/><path d="M10 12h4"/></svg>} 
                        title="Journal is Empty" 
                        message="Your collection awaits its first authentic piece." 
                        action={<Link to="/shop" className="btn btn-primary">EXPLORE GALLERY</Link>} 
                    />
                ) : (
                    <div className="journal-grid">
                        {orders.map((order, idx) => (
                            <div key={order.id} className="journal-entry animate-slide-up">
                                <div className="entry-meta">
                                    <span className="entry-num">#{orders.length - idx}</span>
                                    <div className="entry-info">
                                        <h3>ID: {order.id}</h3>
                                        <p>{new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <div className={`entry-status status-${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="entry-visuals">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="mini-acquisition">
                                            <img src={item.product?.images?.[0]?.url || item.image} alt="" />
                                            <div className="acquisition-overlay">
                                                <span>{item.quantity}×</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="entry-footer">
                                    <div className="entry-total">
                                        <span className="label">Total Acquisition</span>
                                        <span className="value">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="entry-actions">
                                        <button 
                                            onClick={() => handleDownload(order.id)} 
                                            className="btn-journal-action"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                            DOWNLOAD INVOICE
                                        </button>
                                    </div>
                                </div>
                                <div className="entry-stitch"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
