import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import type { User } from '../types';

interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const redirectParam = searchParams.get('redirect');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister
                ? { name, email, password, password_confirmation: password }
                : { email, password };

            const res = await api.post(endpoint, payload);
            const token =
                res.data?.token ?? res.data?.data?.token ?? res.data?.access_token;

            if (!token) {
                setError('Yanıtta oturum anahtarı bulunamadı.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);

            const meRes = await api.get('/auth/me');
            const userData: User = meRes.data?.data ?? meRes.data?.user ?? meRes.data;
            onLoginSuccess(userData);

            if (redirectParam && redirectParam.startsWith('/')) {
                navigate(redirectParam, { replace: true });
            } else if (userData.role?.toLowerCase() === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };
                };
            };
            const firstValidationError = axiosErr.response?.data?.errors
                ? Object.values(axiosErr.response.data.errors).flat()[0]
                : undefined;

            setError(
                firstValidationError ||
                axiosErr.response?.data?.message ||
                (isRegister ? 'Kayıt işlemi başarısız oldu.' : 'Giriş işlemi başarısız oldu.')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-5">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h4 className="card-title mb-2 text-center">
                            {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
                        </h4>

                        {redirectParam === '/admin' && !isRegister && (
                            <p className="text-muted small text-center mb-3">
                                Yönetim Paneline erişmek için admin hesabınla giriş yap.
                            </p>
                        )}

                        {redirectParam === '/' && (
                            <p className="text-muted small text-center mb-3">
                                Siparişini tamamlamak için giriş yap veya müşteri hesabı oluştur.
                            </p>
                        )}

                        {error && <div className="alert alert-danger py-2">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            {isRegister && (
                                <div className="mb-3">
                                    <label className="form-label">Ad Soyad</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label">E-posta</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Şifre</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={8}
                                    required
                                />
                                {isRegister && (
                                    <div className="form-text">En az 8 karakter olmalı.</div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >
                                {loading
                                    ? 'İşleniyor...'
                                    : isRegister
                                        ? 'Kaydı Tamamla'
                                        : 'Giriş Yap'}
                            </button>
                        </form>

                        <hr />

                        <button
                            type="button"
                            className="btn btn-link w-100 text-decoration-none"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                        >
                            {isRegister
                                ? 'Zaten hesabın var mı? Giriş yap'
                                : 'Hesabın yok mu? Kayıt ol'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}