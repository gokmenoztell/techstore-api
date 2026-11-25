import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import api from './api/client';
import Navbar from './components/Navbar';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Store, { type CartItem } from './pages/Store';
import type { Product, User } from './types';

function isAdminUser(user: User | null): boolean {
  return Boolean(user && user.role?.toLowerCase() === 'admin');
}

interface AdminRouteProps {
  user: User | null;
  authChecked: boolean;
  children: ReactNode;
}

function AdminRoute({ user, authChecked, children }: AdminRouteProps) {
  const location = useLocation();

  if (!authChecked) {
    return <div className="py-5 text-center text-muted">Oturum kontrol ediliyor...</div>;
  }

  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  if (!isAdminUser(user)) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="alert alert-warning mt-3">
            <h5 className="alert-heading">Yetkisiz Erişim</h5>
            <p className="mb-3">
              Yönetim Paneli yalnızca <strong>admin</strong> yetkisine sahip hesaplara açıktır.
            </p>
            <Link to="/" className="btn btn-dark btn-sm">
              Mağazaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthChecked(true);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        const userData = res.data?.data ?? res.data?.user ?? res.data;
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setAuthChecked(true);
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
          <Route
            path="/admin"
            element={
              <AdminRoute user={user} authChecked={authChecked}>
                <Admin user={user} />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}