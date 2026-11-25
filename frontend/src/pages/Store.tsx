import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

type PaymentMethod = 'card' | 'transfer' | 'cash_on_delivery';

export default function Store({
    user,
    cart,
    onAddToCart,
    onUpdateQty,
    onClearCart,
}: StoreProps) {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
    const [submittingOrder, setSubmittingOrder] = useState(false);

    // Ödeme modalı state'leri
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    const [cardHolder, setCardHolder] = useState('TEST KULLANICI');
    const [cardNumber, setCardNumber] = useState('4543 6000 0000 0001');
    const [cardExpiry, setCardExpiry] = useState('12/28');
    const [cardCvc, setCardCvc] = useState('123');
    const [sandboxOutcome, setSandboxOutcome] = useState<'success' | 'declined'>('success');
    const [payingLoading, setPayingLoading] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const getOrderTotal = (order: Order): number => {
        const raw =
            (order as unknown as { total_amount?: number | string }).total_amount ??
            order.total_price ??
            order.total ??
            0;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    };

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
            navigate('/login?redirect=/');
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

    const openPaymentModal = (order: Order) => {
        setFeedback(null);
        setPaymentError(null);
        setPayingOrder(order);
        setPaymentMethod('card');
        setSandboxOutcome('success');
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingOrder) return;

        setPaymentError(null);

        const digitsOnly = cardNumber.replace(/\D/g, '');
        if (paymentMethod === 'card') {
            if (digitsOnly.length < 12) {
                setPaymentError('Lütfen geçerli bir test kart numarası gir.');
                return;
            }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
                setPaymentError('Son kullanma tarihini AA/YY formatında gir (ör. 12/28).');
                return;
            }
            if (!/^\d{3,4}$/.test(cardCvc.trim())) {
                setPaymentError('CVC kodunu 3 veya 4 haneli gir.');
                return;
            }
        }

        const last4 = paymentMethod === 'card' ? digitsOnly.slice(-4) : undefined;

        setPayingLoading(true);
        setFeedback(null);
        try {
            await api.post(`/orders/${payingOrder.id}/pay`, {
                sandbox_outcome: sandboxOutcome,
                card_last4: last4,
                payment_method: paymentMethod,
            });
            const paidOrderId = payingOrder.id;
            setPayingOrder(null);
            setPaymentError(null);
            await Promise.all([loadProducts(), loadOrders()]);
            setFeedback({
                type: 'success',
                text: `Sipariş #${paidOrderId} (${paymentMethod === 'card' ? `Kart •••• ${last4}` : paymentMethod}) test ödemesiyle tamamlandı.`,
            });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            const msg = axiosErr.response?.data?.message || 'Ödeme reddedildi veya işlem tamamlanamadı.';
            setPaymentError(msg);
            setFeedback({
                type: 'danger',
                text: msg,
            });
        } finally {
            setPayingLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        setFeedback(null);
        try {
            await api.post(`/orders/${orderId}/cancel`);
            await Promise.all([loadProducts(), loadOrders()]);
            setFeedback({
                type: 'success',
                text: `Sipariş #${orderId} iptal edildi.`,
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
                                                    Tutar: {getOrderTotal(order).toFixed(2)} TL
                                                </div>
                                                {order.status === 'pending' && (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => openPaymentModal(order)}
                                                        >
                                                            Ödeme Yap
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleCancelOrder(order.id)}
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

            {payingOrder && (
                <div
                    className="modal show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleConfirmPayment}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        Sipariş #{payingOrder.id} — Ödeme ({getOrderTotal(payingOrder).toFixed(2)} TL)
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setPayingOrder(null);
                                            setPaymentError(null);
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    {paymentError && (
                                        <div className="alert alert-danger py-2 small" role="alert">
                                            {paymentError}
                                        </div>
                                    )}

                                    <div className="alert alert-secondary py-2 small">
                                        Test / Sandbox modu: Gerçek karttan para çekilmez.
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Ödeme Yöntemi</label>
                                        <select
                                            className="form-select"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                        >
                                            <option value="card">Kredi / Banka Kartı (Test)</option>
                                            <option value="transfer">Havale / EFT (Test)</option>
                                            <option value="cash_on_delivery">Kapıda Ödeme (Test)</option>
                                        </select>
                                    </div>

                                    {paymentMethod === 'card' && (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label">Kart Üzerindeki İsim</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={cardHolder}
                                                    onChange={(e) => setCardHolder(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Kart Numarası</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    placeholder="4543 6000 0000 0001"
                                                    required
                                                />
                                            </div>
                                            <div className="row g-2 mb-3">
                                                <div className="col-6">
                                                    <label className="form-label">Son Kullanma (AA/YY)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(e.target.value)}
                                                        placeholder="12/28"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label">CVC</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={cardCvc}
                                                        onChange={(e) => setCardCvc(e.target.value)}
                                                        placeholder="123"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="mb-1">
                                        <label className="form-label fw-semibold">Simülasyon Sonucu</label>
                                        <select
                                            className="form-select"
                                            value={sandboxOutcome}
                                            onChange={(e) =>
                                                setSandboxOutcome(e.target.value as 'success' | 'declined')
                                            }
                                        >
                                            <option value="success">Başarılı Ödeme (Onaylansın)</option>
                                            <option value="declined">Reddedilen Kart / Bakiye Yetersiz</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setPayingOrder(null);
                                            setPaymentError(null);
                                        }}
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success"
                                        disabled={payingLoading}
                                    >
                                        {payingLoading ? 'İşleniyor...' : 'Ödemeyi Onayla'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}