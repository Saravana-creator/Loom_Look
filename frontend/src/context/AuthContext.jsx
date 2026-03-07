import React, { createContext, useContext, useReducer } from 'react';
import { authService } from '../services';

// ── Initial state ──────────────────────────────────────────────────────────
const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    role: localStorage.getItem('userRole') || null,
    accessToken: localStorage.getItem('accessToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading: false,
    error: null,
};

// ── Reducer ────────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
    switch (action.type) {
        case 'AUTH_LOADING':
            return { ...state, loading: true, error: null };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                user: action.payload.user,
                role: action.payload.user.role,
                accessToken: action.payload.accessToken,
                error: null,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                role: null,
                accessToken: null,
                isAuthenticated: false,
            };
        case 'UPDATE_USER':
            return { ...state, user: { ...state.user, ...action.payload } };
        case 'AUTH_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Login handler
    const login = async (credentials, role = 'user') => {
        dispatch({ type: 'AUTH_LOADING' });
        try {
            let response;
            if (role === 'admin') {
                response = await authService.loginAdmin(credentials);
            } else if (role === 'vendor') {
                response = await authService.loginVendor(credentials);
            } else {
                response = await authService.loginUser(credentials);
            }

            const { accessToken, user } = response.data;

            // Persist to localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
            return { success: true, user };
        } catch (err) {
            const errorData = err.response?.data;
            let message = errorData?.message || 'Login failed.';
            if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                message = errorData.errors[0].msg;
            }
            dispatch({ type: 'AUTH_ERROR', payload: message });
            return { success: false, message };
        }
    };

    // Register handler
    const register = async (data, role = 'user') => {
        dispatch({ type: 'AUTH_LOADING' });
        try {
            let response;
            if (role === 'vendor') {
                response = await authService.registerVendor(data);
                dispatch({ type: 'AUTH_ERROR', payload: null });
                return { success: true, message: response.data.message };
            } else {
                response = await authService.registerUser(data);
                const { accessToken, user } = response.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('userRole', user.role);
                localStorage.setItem('user', JSON.stringify(user));
                dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
                return { success: true, user };
            }
        } catch (err) {
            const errorData = err.response?.data;
            let message = errorData?.message || 'Registration failed.';
            if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                message = errorData.errors[0].msg;
            }
            dispatch({ type: 'AUTH_ERROR', payload: message });
            return { success: false, message };
        }
    };

    // Logout handler
    const logout = async () => {
        try {
            await authService.logout();
        } catch { }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    // Update user in context
    const updateUser = (userData) => {
        const updated = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(updated));
        dispatch({ type: 'UPDATE_USER', payload: userData });
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
};

export default AuthContext;
