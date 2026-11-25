import { useEffect, useState, type FormEvent } from 'react';
import api from '../api/client';
import type { Product, User } from '../types';

interface AdminProps {
    user: User | null;
}

export default function Admin({ user }: AdminProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('10');
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

    const loadProducts = async () => {
        try {
            const res = await api.get('/products');
            const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setProducts(list);
        } catch {
            setMessage({ type: 'danger', text: 'Ürün listesi alınamadı.' });
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setPrice('');
        setStock('10');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const payload = {
            name,
            description: description || null,
            price: Number(price),
            stock: Number(stock),
        };

        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
                setMessage({ type: 'success', text: 'Ürün güncellendi.' });
            } else {
                await api.post('/products', payload);
                setMessage({ type: 'success', text: 'Yeni ürün eklendi.' });
            }
            resetForm();
            await loadProducts();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setMessage({
                type: 'danger',
                text: axiosErr.response?.data?.message || 'Ürün kaydedilemedi.',
            });
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setDescription(product.description ?? '');
        setPrice(String(product.price));
        setStock(String(product.stock));
    };

    const handleDelete = async (id: number) => {
        setMessage(null);
        try {
            await api.delete(`/products/${id}`);
            setMessage({ type: 'success', text: 'Ürün silindi.' });
            await loadProducts();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setMessage({
                type: 'danger',
                text: axiosErr.response?.data?.message || 'Ürün silinemedi.',
            });
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Yönetim Paneli — Ürün Yönetimi</h4>
                {user && (
                    <span className="badge bg-secondary">
                        Admin: {user.name} ({user.email})
                    </span>
                )}
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}

            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white fw-bold">
                            {editingId ? `Ürünü Düzenle (#${editingId})` : 'Yeni Ürün Ekle'}
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Ürün Adı</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Açıklama</label>
                                    <textarea
                                        className="form-control"
                                        rows={2}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Fiyat (TL)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-control"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Stok</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-control"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-grow-1">
                                        {editingId ? 'Güncelle' : 'Kaydet'}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={resetForm}
                                        >
                                            İptal
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Ürün</th>
                                            <th>Fiyat</th>
                                            <th>Stok</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.id}>
                                                <td>{product.id}</td>
                                                <td>{product.name}</td>
                                                <td>{Number(product.price).toFixed(2)} TL</td>
                                                <td>{product.stock}</td>
                                                <td className="text-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        Düzenle
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        Sil
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}