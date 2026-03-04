import React, { useEffect, useState } from 'react';
import { adminService } from '../../services';
import { Badge, ConfirmModal, PageLoader } from '../../components/common/UI';
import { toast } from 'react-toastify';

const AdminVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [confirm, setConfirm] = useState({ open: false, action: null, id: null, label: '' });

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const { data } = await adminService.getVendors(params);
            setVendors(data.data);
        } catch { } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { load(); }, [filter, load]);

    const handleAction = async () => {
        const { action, id } = confirm;
        setConfirm({ open: false, action: null, id: null, label: '' });
        try {
            if (action === 'approve') await adminService.approveVendor(id);
            else if (action === 'reject') await adminService.rejectVendor(id);
            else if (action === 'suspend') await adminService.suspendVendor(id);
            else if (action === 'delete') await adminService.deleteVendor(id);
            toast.success(`Vendor ${action}d successfully.`);
            load();
        } catch {
            toast.error(`Failed to ${action} vendor.`);
        }
    };

    const prompt = (action, id, label) => setConfirm({ open: true, action, id, label });

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Vendor Management</h1>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['all', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
                    <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
                        {s}
                    </button>
                ))}
            </div>

            {loading ? <PageLoader /> : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr><th>Vendor</th><th>Shop</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {vendors.map((v) => (
                                <tr key={v._id}>
                                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                                    <td>{v.shopName}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{v.email}</td>
                                    <td><Badge status={v.status} /></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{new Date(v.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {v.status === 'pending' && (
                                                <>
                                                    <button className="btn btn-sm" style={{ background: '#dcfce7', color: '#16a34a', border: 'none' }} onClick={() => prompt('approve', v._id, v.name)}>Approve</button>
                                                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={() => prompt('reject', v._id, v.name)}>Reject</button>
                                                </>
                                            )}
                                            {v.status === 'approved' && (
                                                <button className="btn btn-sm" style={{ background: '#fef9c3', color: '#ca8a04', border: 'none' }} onClick={() => prompt('suspend', v._id, v.name)}>Suspend</button>
                                            )}
                                            <button className="btn btn-danger btn-sm" onClick={() => prompt('delete', v._id, v.name)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vendors.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No vendors found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmModal
                open={confirm.open}
                title={`${confirm.action?.charAt(0)?.toUpperCase() + confirm.action?.slice(1)} Vendor`}
                message={`Are you sure you want to ${confirm.action} vendor "${confirm.label}"?`}
                onConfirm={handleAction}
                onCancel={() => setConfirm({ open: false, action: null, id: null, label: '' })}
                danger={['reject', 'suspend', 'delete'].includes(confirm.action)}
            />
        </div>
    );
};

export default AdminVendors;
