import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { User } from '../types';

interface NavbarProps {
    user: User | null;
    onUserChange: (user: User | null) => void;
    cartCount: number;
}

export default function Navbar({ user, onUserChange, cartCount }: NavbarProps) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Sunucu yanıtı dönmese bile yerel token temizlenir
        } finally {
            localStorage.removeItem('token');
            onUserChange(null);
            navigate('/login');
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/">
                    <i className="bi bi-cpu me-2"></i>TechStore
                </Link>

                <div className="navbar-nav me-auto">
                    <Link className="nav-link" to="/">Mağaza</Link>
                    <Link className="nav-link" to="/admin">Yönetim Paneli</Link>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Link to="/#cart" className="btn btn-outline-light btn-sm">
                        <i className="bi bi-cart3 me-1"></i>Sepet ({cartCount})
                    </Link>

                    {user ? (
                        <>
                            <span className="text-light small px-2">{user.name}</span>
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={handleLogout}
                            >
                                Çıkış
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm">
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}