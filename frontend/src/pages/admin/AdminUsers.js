import React, { useEffect, useState } from 'react';
import { adminService } from '../../services';
import { Badge, ConfirmModal, PageLoader } from '../../components/common/UI';
import { toast } from 'react-toastify';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState({ open: false, action: null, id: null, label: '' });

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await adminService.getUsers();
            setUsers(data.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleAction = async () => {
        const { action, id } = confirm;
        setConfirm({ open: false, action: null, id: null, label: '' });
        try {
            if (action === 'suspend') await adminService.suspendUser(id);
            else if (action === 'activate') await adminService.activateUser(id);
            else if (action === 'delete') await adminService.deleteUser(id);
            toast.success(`User ${action}d successfully.`);
            load();
        } catch { toast.error(`Failed to ${action} user.`); }
    };

    const prompt = (action, id, label) => setConfirm({ open: true, action, id, label });

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">User Management</h1>
            </div>
            {loading ? <PageLoader /> : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr><th>User</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id}>
                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{u.email}</td>
                                    <td><Badge status={u.isActive ? 'active' : 'suspended'} /></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {u.isActive
                                                ? <button className="btn btn-sm" style={{ background: '#fef9c3', color: '#ca8a04', border: 'none' }} onClick={() => prompt('suspend', u._id, u.name)}>Suspend</button>
                                                : <button className="btn btn-sm" style={{ background: '#dcfce7', color: '#16a34a', border: 'none' }} onClick={() => prompt('activate', u._id, u.name)}>Activate</button>
                                            }
                                            <button className="btn btn-danger btn-sm" onClick={() => prompt('delete', u._id, u.name)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmModal
                open={confirm.open}
                title={`${confirm.action?.charAt(0)?.toUpperCase() + confirm.action?.slice(1)} User`}
                message={`Are you sure you want to ${confirm.action} user "${confirm.label}"?`}
                onConfirm={handleAction}
                onCancel={() => setConfirm({ open: false, action: null, id: null, label: '' })}
                danger={['suspend', 'delete'].includes(confirm.action)}
            />
        </div>
    );
};

export default AdminUsers;
