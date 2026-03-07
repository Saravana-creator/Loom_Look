import React, { useState, useEffect } from 'react';
import { orderService } from '../../services';
import { Badge, EmptyState, PageLoader } from '../../components/common/UI';

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
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Orders</h1>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
                        {s}
                    </button>
                ))}
            </div>

            {loading ? <PageLoader /> : orders.length === 0 ? (
                <EmptyState icon="📦" title="No orders yet" message="Your orders will appear here." />
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => (
                                <tr key={o._id}>
                                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.82rem' }}>#{o.orderId}</td>
                                    <td>{o.user?.name || 'Customer'}</td>
                                    <td>{o.items?.length || 0} item(s)</td>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                                    <td><Badge status={o.status} /></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
                                        {new Date(o.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VendorOrders;
