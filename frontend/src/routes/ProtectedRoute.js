import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — redirects to login if not authenticated
 * Optionally restricts to specific roles
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, role } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to appropriate login page
        const loginPath = allowedRoles.includes('admin')
            ? '/admin/login'
            : allowedRoles.includes('vendor')
                ? '/vendor/login'
                : '/login';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Wrong role — redirect to their dashboard
        const dashboardPath =
            role === 'admin' ? '/admin/dashboard' :
                role === 'vendor' ? '/vendor/dashboard' : '/';
        return <Navigate to={dashboardPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
