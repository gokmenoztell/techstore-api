import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import api from './api/client';
import Navbar from './components/Navbar';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Store, { type CartItem } from './pages/Store';
import type { Product, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    api
      .get('/auth/me')
      .then((res) => {
        const userData = res.data?.data ?? res.data?.user ?? res.data;
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <BrowserRouter>
      <Navbar user={user} onUserChange={setUser} cartCount={cartCount} />
      <main className="container pb-5">
        <Routes>
          <Route
            path="/"
            element={
              <Store
                user={user}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateQty={handleUpdateQty}
                onClearCart={() => setCart([])}
              />
            }
          />
          <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}