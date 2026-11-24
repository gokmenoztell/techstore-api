import { useEffect, useState } from 'react';
import api from '../api/client';
import type { Order, Product, User } from '../types';

export interface CartItem {
    product: Product;
    quantity: number;
}

interface StoreProps {
    user: User | null;
    cart: CartItem[];
    onAddToCart: (product: Product) => void;
    onUpdateQty: (productId: number, quantity: number) => void;
    onClearCart: () => void;
}

export default function Store({
    user,
    cart,
    onAddToCart,
    onUpdateQty,
    onClearCart,
}: StoreProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
    const [submittingOrder, setSubmittingOrder] = useState(false);

    const loadProducts = async () => {
        const res = await api.get('/products');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setProducts(list);
    };

    const loadOrders = async () => {
        if (!user) {
            setOrders([]);
            return;
        }
        try {
            const res = await api.get('/orders');
            const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setOrders(list);
        } catch {
            setOrders([]);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        loadOrders();
    }, [user]);

    const handleCreateOrder = async () => {
        if (!user) {
            setFeedback({ type: 'danger', text: 'Sipariş vermek için önce giriş yapmalısın.' });
            return;
        }
        if (cart.length === 0) return;

        setSubmittingOrder(true);
        setFeedback(null);
        try {
            await api.post('/orders', {
                items: cart.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                })),
            });
            onClearCart();
            await Promise.all([loadProducts(), loadOrders()]);
            setFeedback({ type: 'success', text: 'Sipariş oluşturuldu ve stok güncellendi.' });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setFeedback({
                type: 'danger',
                text: axiosErr.response?.data?.message || 'Sipariş oluşturulamadı.',
            });
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handleOrderAction = async (orderId: number, action: 'pay' | 'cancel') => {
        setFeedback(null);
        try {
            await api.post(`/orders/${orderId}/${action}`);
            await Promise.all([loadProducts(), loadOrders()]);
            setFeedback({
                type: 'success',
                text: action === 'pay' ? `Sipariş #${orderId} ödendi.` : `Sipariş #${orderId} iptal edildi.`,
            });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setFeedback({
                type: 'danger',
                text: axiosErr.response?.data?.message || 'İşlem gerçekleştirilemedi.',
            });
        }
    };

    return (
        <div>
            {feedback && (
                <div className={`alert alert-${feedback.type} alert-dismissible`} role="alert">
                    {feedback.text}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setFeedback(null)}
                    ></button>
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-8">
                    <h4 className="mb-3">Ürünler</h4>
                    <div className="row row-cols-1 row-cols-md-2 g-3">
                        {products.map((product) => (
                            <div className="col" key={product.id}>
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body d-flex flex-column justify-content-between">
                                        <div>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h5 className="card-title mb-0">{product.name}</h5>
                                                <span className="badge bg-secondary">Stok: {product.stock}</span>
                                            </div>
                                            {product.description && (
                                                <p className="card-text text-muted small">{product.description}</p>
                                            )}
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                                            <strong className="fs-6">{Number(product.price).toFixed(2)} TL</strong>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                disabled={product.stock <= 0}
                                                onClick={() => onAddToCart(product)}
                                            >
                                                {product.stock > 0 ? 'Sepete Ekle' : 'Tükendi'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-lg-4" id="cart">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white fw-bold">Sepet</div>
                        <div className="card-body">
                            {cart.length === 0 ? (
                                <p className="text-muted small mb-0">Sepetin şu an boş.</p>
                            ) : (
                                <>
                                    <ul className="list-group list-group-flush mb-3">
                                        {cart.map(({ product, quantity }) => (
                                            <li
                                                key={product.id}
                                                className="list-group-item d-flex justify-content-between align-items-center px-0"
                                            >
                                                <div>
                                                    <div className="fw-semibold">{product.name}</div>
                                                    <small className="text-muted">
                                                        {(Number(product.price) * quantity).toFixed(2)} TL
                                                    </small>
                                                </div>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => onUpdateQty(product.id, quantity - 1)}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="btn btn-light disabled">{quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        disabled={quantity >= product.stock}
                                                        onClick={() => onUpdateQty(product.id, quantity + 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        className="btn btn-success w-100"
                                        disabled={submittingOrder}
                                        onClick={handleCreateOrder}
                                    >
                                        {submittingOrder ? 'Sipariş Gönderiliyor...' : 'Siparişi Tamamla'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {user && (
                        <div className="card shadow-sm">
                            <div className="card-header bg-white fw-bold">Siparişlerim</div>
                            <div className="card-body">
                                {orders.length === 0 ? (
                                    <p className="text-muted small mb-0">Henüz siparişin yok.</p>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {orders.map((order) => (
                                            <div key={order.id} className="border rounded p-2">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <strong>#{order.id}</strong>
                                                    <span className="badge bg-info text-dark">{order.status}</span>
                                                </div>
                                                <div className="small text-muted mb-2">
                                                    Tutar: {Number(order.total_price ?? order.total ?? 0).toFixed(2)} TL
                                                </div>
                                                {order.status === 'pending' && (
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleOrderAction(order.id, 'pay')}
                                                        >
                                                            Öde
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleOrderAction(order.id, 'cancel')}
                                                        >
                                                            İptal Et
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}