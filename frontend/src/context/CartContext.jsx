import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      setItems(await api.getCart());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  async function addToCart(productId, quantity = 1) {
    await api.addToCart(productId, quantity);
    await fetchCart();
  }

  async function updateItem(itemId, quantity) {
    await api.updateCartItem(itemId, quantity);
    await fetchCart();
  }

  async function removeItem(itemId) {
    await api.removeCartItem(itemId);
    await fetchCart();
  }

  async function clearCart() {
    await api.clearCart();
    setItems([]);
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, itemCount, subtotal, addToCart, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
