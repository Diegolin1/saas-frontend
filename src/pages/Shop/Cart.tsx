import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { createOrder } from '../../services/order.service';
import { Toast } from '../../components/Toast';
import { formatMXN } from '../../utils/format';
import { getPublicCompanyInfo } from '../../services/settings.service';

export default function Cart() {
    const { items, removeFromCart, updateQuantity, total, clearCart, isB2BUnlocked, b2bLead } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lead, setLead] = useState({ name: b2bLead?.name || '', phone: b2bLead?.phone || '' });
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
    const [searchParams] = useSearchParams();
    const [vendorPhone, setVendorPhone] = useState('');

    const [promoCode, setPromoCode] = useState('');
    const [promoValidating, setPromoValidating] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; type: string } | null>(null);

    const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || '';

    useEffect(() => {
        if (!companyId) return;
        getPublicCompanyInfo(companyId).then(info => {
            if (info.whatsappPhone) setVendorPhone(info.whatsappPhone);
        }).catch(() => { });
    }, [companyId]);

    const discountAmount = appliedPromo
        ? appliedPromo.type === 'PERCENTAGE'
            ? Math.round((total * appliedPromo.discount / 100) * 100) / 100
            : Math.min(appliedPromo.discount, total)
        : 0;

    const subtotalAfterDiscount = Math.max(0, total - discountAmount);
    const IVA_RATE = 0.16;
    const taxAmount = Math.round(subtotalAfterDiscount * IVA_RATE * 100) / 100;
    const finalTotal = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;

    const handleValidatePromo = async () => {
        if (!promoCode.trim() || !companyId) return;
        setPromoValidating(true);
        setFeedback(null);
        try {
            const res = await api.post('/promotions/validate', { code: promoCode.trim(), companyId });
            setAppliedPromo({ code: res.data.code, discount: res.data.discount, type: res.data.type });
            setFeedback({ message: `Código "${res.data.code}" aplicado — ${res.data.type === 'PERCENTAGE' ? `${res.data.discount}%` : formatMXN(res.data.discount)} de descuento`, type: 'success' });
        } catch {
            setAppliedPromo(null);
            setFeedback({ message: 'Código inválido o expirado.', type: 'error' });
        } finally {
            setPromoValidating(false);
        }
    };

    const handleRemovePromo = () => { setAppliedPromo(null); setPromoCode(''); setFeedback(null); };

    const handleWhatsAppCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (items.length === 0 || !lead.phone || !lead.name) {
            setFeedback({ message: 'Completa todos los campos y agrega productos.', type: 'warning' });
            return;
        }
        setIsSubmitting(true);
        try {
            if (companyId) {
                await api.post('/leads', { name: lead.name, phone: lead.phone, companyId });
            }

            const cartId = localStorage.getItem('saas_cart_id');

            await createOrder({
                customerId: undefined,
                items: items.map(item => ({ productId: item.productId, variantId: item.variantId, name: item.name, price: item.price, image: item.image, size: item.size, color: item.color, quantity: item.quantity, subtotal: item.subtotal })),
                notes: `Pedido desde carrito web. Lead: ${lead.name} (${lead.phone})`,
                promotionCode: appliedPromo?.code || undefined,
                cartId: cartId || undefined
            });

            let text = `Hola, soy ${lead.name}.\n\nQuiero confirmar el siguiente pedido:\n\n`;
            items.forEach((item, i) => {
                text += `${i + 1}. ${item.name} | ${item.color} | T${item.size} | ×${item.quantity} ${isB2BUnlocked ? `| ${formatMXN(item.subtotal)}` : ''}\n`;
            });
            if (isB2BUnlocked) {
                text += `\n*Subtotal:* ${formatMXN(subtotalAfterDiscount)}`;
                text += `\n*IVA (16%):* ${formatMXN(taxAmount)}`;
                text += `\n*TOTAL:* ${formatMXN(finalTotal)}\n`;
            }
            text += `\nPor favor, confírmeme existencia y tiempos de entrega.`;

            const waUrl = vendorPhone
                ? `https://wa.me/${vendorPhone}?text=${encodeURIComponent(text)}`
                : `https://wa.me/?text=${encodeURIComponent(text)}`;

            window.open(waUrl, '_blank');
            clearCart();
            localStorage.removeItem('saas_cart_id');
            setFeedback({ message: 'Pedido enviado y registrado correctamente.', type: 'success' });
            setTimeout(() => { window.location.href = '/'; }, 2000);
        } catch {
            setFeedback({ message: 'Error al procesar tu pedido. Intenta de nuevo.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPairs = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-white">
            {feedback && <Toast message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />}

            {/* ── Header ─────────────────────────────────────── */}
            <div className="border-b border-stone-100">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold">Tu selección</p>
                    <h1 className="text-xl sm:text-2xl font-semibold text-stone-900 mt-1">Pedido</h1>
                    {items.length > 0 && (
                        <p className="text-xs text-stone-400 mt-2">{totalPairs} {totalPairs === 1 ? 'par' : 'pares'} · {items.length} {items.length === 1 ? 'artículo' : 'artículos'}</p>
                    )}
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {items.length === 0 ? (
                    /* ── Empty State ─────────────────────────── */
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <svg className="w-12 h-12 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <div className="text-center">
                            <p className="text-xs tracking-[0.2em] uppercase text-stone-400 font-semibold">Tu pedido está vacío</p>
                            <p className="text-sm text-stone-400 mt-2">Explora el catálogo y selecciona los modelos que te interesen.</p>
                        </div>
                        <Link
                            to={companyId ? `/?companyId=${companyId}` : '/'}
                            className="text-[11px] tracking-widest uppercase border-b border-stone-400 text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-colors pb-0.5 font-medium"
                        >
                            Ver catálogo
                        </Link>
                    </div>
                ) : (
                    /* ── Cart Content ────────────────────────── */
                    <div className="lg:grid lg:grid-cols-5 lg:gap-16">
                        {/* Items */}
                        <section className="lg:col-span-3">
                            <div className="divide-y divide-stone-100">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 sm:gap-6 py-6 first:pt-0">
                                        {/* Image */}
                                        <div className="flex-shrink-0 w-24 h-28 sm:w-28 sm:h-36 bg-stone-100 overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-stone-900 truncate">{item.name}</h3>
                                                    <p className="text-xs text-stone-400 mt-0.5">
                                                        {item.color}{item.size ? ` · Talla ${item.size}` : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(idx)}
                                                    className="flex-shrink-0 text-stone-300 hover:text-stone-900 transition-colors p-1"
                                                    aria-label="Eliminar"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                {/* Quantity controls */}
                                                <div className="flex items-center border border-stone-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 text-sm transition-colors"
                                                    >−</button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => { const q = parseInt(e.target.value) || 1; if (q > 0) updateQuantity(idx, q); }}
                                                        className="w-10 text-center border-x border-stone-200 h-8 text-xs font-semibold text-stone-900 focus:ring-0 focus:outline-none bg-transparent"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 text-sm transition-colors"
                                                    >+</button>
                                                </div>

                                                {/* Price */}
                                                {isB2BUnlocked && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-stone-400">{formatMXN(item.price)} × {item.quantity}</p>
                                                        <p className="text-sm font-semibold text-stone-900">{formatMXN(item.subtotal)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Continue shopping */}
                            <div className="mt-8 pt-6 border-t border-stone-100">
                                <Link
                                    to={companyId ? `/?companyId=${companyId}` : '/'}
                                    className="text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors font-medium border-b border-stone-300 hover:border-stone-900 pb-0.5"
                                >
                                    ← Seguir comprando
                                </Link>
                            </div>
                        </section>

                        {/* ── Order Summary ──────────────────── */}
                        <section className="lg:col-span-2 mt-10 lg:mt-0">
                            <div className="lg:sticky lg:top-24 space-y-6">
                                <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold">Resumen del pedido</p>

                                <dl className="space-y-3 text-sm border-b border-stone-100 pb-6">
                                    <div className="flex justify-between">
                                        <dt className="text-stone-500">Pares</dt>
                                        <dd className="font-semibold text-stone-900">{totalPairs}</dd>
                                    </div>
                                    {isB2BUnlocked && (
                                        <div className="flex justify-between">
                                            <dt className="text-stone-500">Subtotal artículos</dt>
                                            <dd className="font-semibold text-stone-900">{formatMXN(total)}</dd>
                                        </div>
                                    )}
                                    {appliedPromo && discountAmount > 0 && (
                                        <div className="flex justify-between">
                                            <dt className="text-stone-500 flex items-center gap-2">
                                                Descuento ({appliedPromo.code})
                                                <button onClick={handleRemovePromo} className="text-[10px] text-stone-400 hover:text-stone-900 underline">Quitar</button>
                                            </dt>
                                            <dd className="font-semibold text-stone-500">-{formatMXN(discountAmount)}</dd>
                                        </div>
                                    )}
                                    {isB2BUnlocked && (
                                        <>
                                            <div className="flex justify-between pt-3 border-t border-stone-100">
                                                <dt className="text-stone-500">Subtotal</dt>
                                                <dd className="font-semibold text-stone-900">{formatMXN(subtotalAfterDiscount)}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-stone-500">IVA (16%)</dt>
                                                <dd className="font-semibold text-stone-900">{formatMXN(taxAmount)}</dd>
                                            </div>
                                        </>
                                    )}
                                </dl>

                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs tracking-widest uppercase text-stone-500 font-semibold">Total</span>
                                    <span className="text-xl font-semibold text-stone-900">
                                        {isB2BUnlocked ? formatMXN(finalTotal) : 'Por cotizar'}
                                    </span>
                                </div>

                                {/* Promo code */}
                                {isB2BUnlocked && !appliedPromo && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            placeholder="Código de descuento"
                                            className="flex-1 border border-stone-200 py-2.5 px-3 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleValidatePromo}
                                            disabled={promoValidating || !promoCode.trim()}
                                            className="px-5 py-2.5 text-[11px] tracking-widest uppercase font-semibold bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-100 disabled:text-stone-400 transition-all"
                                        >
                                            {promoValidating ? '...' : 'Aplicar'}
                                        </button>
                                    </div>
                                )}

                                {/* Checkout form */}
                                <form onSubmit={handleWhatsAppCheckout} className="space-y-4 pt-4 border-t border-stone-100">
                                    <div>
                                        <label htmlFor="name" className="block text-[10px] tracking-widest uppercase text-stone-400 font-semibold mb-2">Nombre / Empresa</label>
                                        <input
                                            type="text" id="name" required
                                            value={lead.name}
                                            onChange={(e) => setLead({ ...lead, name: e.target.value })}
                                            className="block w-full border border-stone-200 py-3 px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                                            placeholder="Tu nombre o razón social"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-[10px] tracking-widest uppercase text-stone-400 font-semibold mb-2">WhatsApp de contacto</label>
                                        <input
                                            type="tel" id="phone" required
                                            value={lead.phone}
                                            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                                            className="block w-full border border-stone-200 py-3 px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                                            placeholder="521 000 000 0000"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={items.length === 0 || isSubmitting}
                                        className="w-full flex items-center justify-center gap-2.5 py-4 text-[11px] tracking-[0.2em] uppercase font-semibold bg-[#25D366] text-white hover:bg-[#128C7E] disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSubmitting ? 'Enviando...' : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                                Enviar pedido por WhatsApp
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    )
}
