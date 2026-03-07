import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { cartService } from '../services';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CART':
            return { ...state, ...action.payload, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'CLEAR_CART':
            return { ...state, items: [], subtotal: 0, itemCount: 0 };
        default:
            return state;
    }
};

const initialState = { items: [], subtotal: 0, itemCount: 0, loading: false };

export const CartProvider = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const { isAuthenticated, role } = useAuth();

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated || role !== 'user') return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const { data } = await cartService.getCart();
            dispatch({ type: 'SET_CART', payload: data.data });
        } catch {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [isAuthenticated, role]);

    const addToCart = async (productId, quantity = 1) => {
        try {
            await cartService.addToCart({ productId, quantity });
            await fetchCart();
            toast.success('Added to cart!');
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to add to cart.';
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const updateItem = async (productId, quantity) => {
        try {
            await cartService.updateCartItem(productId, { quantity });
            await fetchCart();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update cart.');
        }
    };

    const removeItem = async (productId) => {
        try {
            await cartService.removeFromCart(productId);
            await fetchCart();
            toast.success('Item removed from cart.');
        } catch {
            toast.error('Failed to remove item.');
        }
    };

    const clearCart = async () => {
        try {
            await cartService.clearCart();
            dispatch({ type: 'CLEAR_CART' });
        } catch { }
    };

    return (
        <CartContext.Provider
            value={{ ...state, fetchCart, addToCart, updateItem, removeItem, clearCart }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used inside CartProvider');
    return context;
};

export default CartContext;
