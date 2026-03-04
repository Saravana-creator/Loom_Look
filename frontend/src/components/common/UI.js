import React from 'react';

export const Spinner = ({ size = 28, color = 'var(--primary)' }) => (
    <div
        style={{
            display: 'inline-block',
            width: size,
            height: size,
            border: `3px solid var(--border-medium)`,
            borderTopColor: color,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }}
    />
);

export const PageLoader = ({ message = 'Loading...' }) => (
    <div className="page-loader">
        <Spinner size={40} />
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{message}</p>
    </div>
);

export const EmptyState = ({ icon = '📭', title = 'Nothing here', message = '', action }) => (
    <div className="empty-state">
        <div className="empty-state__icon">{icon}</div>
        <h3>{title}</h3>
        {message && <p style={{ marginTop: 8, marginBottom: 20 }}>{message}</p>}
        {action}
    </div>
);

export const Badge = ({ status }) => {
    const map = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        suspended: 'danger',
        active: 'success',
        paid: 'success',
        failed: 'danger',
        confirmed: 'success',
        cancelled: 'danger',
        delivered: 'success',
        processing: 'info',
        shipped: 'info',
        upcoming: 'info',
        live: 'danger',
        completed: 'success',
    };
    const type = map[status] || 'info';
    return <span className={`badge badge-${type}`}>{status}</span>;
};

export const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger }) => {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h4 className="modal-title">{title}</h4>
                    <button className="modal-close" onClick={onCancel}>✕</button>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
                    <button
                        className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const UI = { Spinner, PageLoader, EmptyState, Badge, ConfirmModal };
export default UI;
