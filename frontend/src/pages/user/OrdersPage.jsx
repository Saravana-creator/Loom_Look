import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import { PageLoader, EmptyState, Badge } from '../../components/common/UI';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        orderService.getMyOrders().then(({ data }) => {
            setOrders(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div>
            <div className="page-header">
                <h1>My Orders</h1>
                <p>Track and manage your orders</p>
            </div>
            <div className="page-content">
                {orders.length === 0 ? (
                    <EmptyState icon="📦" title="No orders yet" message="You haven't placed any orders yet." action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {orders.map((order) => (
                            <div key={order._id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Order #{order.orderId}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Badge status={order.status} />
                                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <div style={{ padding: '12px 20px' }}>
                                    {order.items?.slice(0, 2).map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: i < order.items.length - 1 ? 10 : 0 }}>
                                            <img src={item.product?.images?.[0]?.url} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.product?.name}</p>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Qty: {item.quantity} &nbsp;·&nbsp; ₹{item.price?.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {order.items?.length > 2 && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 10 }}>+{order.items.length - 2} more items</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
