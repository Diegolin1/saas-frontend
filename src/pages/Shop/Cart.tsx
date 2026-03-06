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

    // Fetch vendor WhatsApp from company settings
    useEffect(() => {
        if (!companyId) return;
        getPublicCompanyInfo(companyId).then(info => {
            if (info.whatsappPhone) setVendorPhone(info.whatsappPhone);
        }).catch(() => {});
    }, [companyId]);

    const discountAmount = appliedPromo
        ? appliedPromo.type === 'PERCENTAGE'
            ? Math.round((total * appliedPromo.discount / 100) * 100) / 100
            : Math.min(appliedPromo.discount, total)
        : 0;
    const finalTotal = Math.max(0, total - discountAmount);

    const handleValidatePromo = async () => {
        if (!promoCode.trim() || !companyId) return;
        setPromoValidating(true);
        setFeedback(null);
        try {
            const res = await api.post('/promotions/validate', { code: promoCode.trim(), companyId });
            setAppliedPromo({ code: res.data.code, discount: res.data.discount, type: res.data.type });
            setFeedback({ message: `¡Código "${res.data.code}" aplicado! Descuento: ${res.data.type === 'PERCENTAGE' ? `${res.data.discount}%` : formatMXN(res.data.discount)}`, type: 'success' });
        } catch {
            setAppliedPromo(null);
            setFeedback({ message: 'Código de promoción inválido o expirado.', type: 'error' });
        } finally {
            setPromoValidating(false);
        }
    };

    const handleRemovePromo = () => { setAppliedPromo(null); setPromoCode(''); setFeedback(null); };

    const handleWhatsAppCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (items.length === 0 || !lead.phone || !lead.name) {
            setFeedback({ message: 'Completa todos los campos y agrega productos al carrito.', type: 'warning' });
            return;
        }
        setIsSubmitting(true);
        try {
            if (companyId) {
                await api.post('/leads', { name: lead.name, phone: lead.phone, companyId });
            }
            await createOrder({
                customerId: undefined,
                items: items.map(item => ({ productId: item.productId, variantId: item.variantId, name: item.name, price: item.price, image: item.image, size: item.size, color: item.color, quantity: item.quantity, subtotal: item.subtotal })),
                notes: `Pedido desde carrito web. Lead: ${lead.name} (${lead.phone})`,
                promotionCode: appliedPromo?.code || undefined
            });

            let text = `¡Hola! Soy ${lead.name}.\n\nMe interesa levantar el siguiente pedido:\n\n`;
            items.forEach((item, i) => {
                text += `${i + 1}. ${item.name} | ${item.color} | T${item.size} | ×${item.quantity} ${isB2BUnlocked ? `| ${formatMXN(item.subtotal)}` : ''}\n`;
            });
            if (isB2BUnlocked) text += `\n*TOTAL:* ${formatMXN(finalTotal)}\n`;
            text += `\nPor favor, confírmeme existencia y tiempos de entrega.`;

            const waUrl = vendorPhone
                ? `https://wa.me/${vendorPhone}?text=${encodeURIComponent(text)}`
                : `https://wa.me/?text=${encodeURIComponent(text)}`;

            window.open(waUrl, '_blank');
            clearCart();
            setFeedback({ message: '¡Pedido enviado y registrado!', type: 'success' });
            setTimeout(() => { window.location.href = '/'; }, 2000);
        } catch {
            setFeedback({ message: 'Hubo un error al procesar tu pedido. Intenta de nuevo.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPairs = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-white py-10 lg:py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-display font-bold text-slate-900 sm:text-3xl">Tu Pedido</h1>

                {feedback && <Toast message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />}

                <div className="mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-10">
                    {/* Items list */}
                    <section className="lg:col-span-7">
                        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white mb-8 lg:mb-0">
                            {items.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">Tu carrito está vacío</p>
                                    <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:text-brand-600">Ver catálogo →</Link>
                                </div>
                            ) : items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 sm:p-5">
                                    <div className="flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="h-24 w-24 rounded-xl object-cover border border-slate-200 sm:h-28 sm:w-28" />
                                        ) : (
                                            <div className="h-24 w-24 rounded-xl bg-slate-100 sm:h-28 sm:w-28 flex items-center justify-center text-slate-400 text-xs">Sin foto</div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold text-slate-900 truncate">{item.name}</h3>
                                                <p className="text-sm text-slate-500 mt-0.5">{item.color}{item.size ? ` · Talla ${item.size}` : ''}</p>
                                            </div>
                                            <button type="button" onClick={() => removeFromCart(idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                                                <button type="button" onClick={() => updateQuantity(idx, item.quantity - 1)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 font-bold text-sm transition-colors">−</button>
                                                <input type="number" min="1" value={item.quantity} onChange={(e) => { const q = parseInt(e.target.value) || 1; if (q > 0) updateQuantity(idx, q); }}
                                                    className="w-12 text-center border-x border-slate-200 py-1.5 text-sm font-bold text-slate-900 focus:ring-0 focus:outline-none" />
                                                <button type="button" onClick={() => updateQuantity(idx, item.quantity + 1)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 font-bold text-sm transition-colors">+</button>
                                            </div>
                                            {isB2BUnlocked && (
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400">{formatMXN(item.price)} × {item.quantity}</p>
                                                    <p className="text-sm font-bold text-slate-900">{formatMXN(item.subtotal)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Summary + Checkout */}
                    <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="text-lg font-display font-bold text-slate-900 mb-5 pb-4 border-b border-slate-100">Resumen del Pedido</h2>

                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Total de pares</dt>
                                <dd className="font-bold text-slate-900">{totalPairs}</dd>
                            </div>
                            {isB2BUnlocked && (
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Subtotal</dt>
                                    <dd className="font-semibold text-slate-900">{formatMXN(total)}</dd>
                                </div>
                            )}
                            {appliedPromo && discountAmount > 0 && (
                                <div className="flex justify-between">
                                    <dt className="text-green-600 flex items-center gap-2">
                                        Descuento ({appliedPromo.code})
                                        <button onClick={handleRemovePromo} className="text-xs text-slate-400 hover:text-red-500 underline">Quitar</button>
                                    </dt>
                                    <dd className="font-semibold text-green-600">-{formatMXN(discountAmount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-slate-100">
                                <dt className="text-base font-bold text-slate-900">Total</dt>
                                <dd className="text-xl font-display font-bold text-brand-600">
                                    {isB2BUnlocked ? formatMXN(finalTotal) : 'Por cotizar'}
                                </dd>
                            </div>
                        </dl>

                        {/* Promo code */}
                        {isB2BUnlocked && !appliedPromo && (
                            <div className="mt-5 flex gap-2">
                                <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Código de descuento"
                                    className="flex-1 rounded-lg border-slate-200 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500" />
                                <button type="button" onClick={handleValidatePromo} disabled={promoValidating || !promoCode.trim()}
                                    className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors">
                                    {promoValidating ? '...' : 'Aplicar'}
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleWhatsAppCheckout} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Tu nombre / empresa</label>
                                <input type="text" id="name" required value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })}
                                    className="mt-1.5 block w-full rounded-lg border-slate-200 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500"
                                    placeholder="Ej. Mi Empresa S.A." />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">WhatsApp de contacto</label>
                                <input type="tel" id="phone" required value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                                    className="mt-1.5 block w-full rounded-lg border-slate-200 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-brand-500"
                                    placeholder="521 000 000 0000" />
                            </div>

                            <button type="submit" disabled={items.length === 0 || isSubmitting}
                                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#128C7E] transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Enviando...' : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        Enviar Pedido por WhatsApp
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-5 text-center">
                            <Link to="/" className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors">← Seguir viendo el catálogo</Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
