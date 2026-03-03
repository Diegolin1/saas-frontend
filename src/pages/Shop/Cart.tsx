import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import axios from 'axios';
import { createOrder } from '../../services/order.service';
import { Toast } from '../../components/Toast';

export default function Cart() {
    const { items, removeFromCart, updateQuantity, total, clearCart, isB2BUnlocked, b2bLead } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lead, setLead] = useState({
        name: b2bLead?.name || '',
        phone: b2bLead?.phone || ''
    });
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
    const [searchParams] = useSearchParams();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || '';

    const handleWhatsAppCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (items.length === 0 || !lead.phone || !lead.name) {
            setFeedback({ message: 'Completa todos los campos y agrega productos al carrito.', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Registrar Lead en Backend (si hay companyId disponible)
            if (companyId) {
                await axios.post(`${API_URL}/leads`, {
                    name: lead.name,
                    phone: lead.phone,
                    companyId
                });
            }

            // 2. Crear Orden en Backend
            const orderPayload = {
                customerId: undefined, // Si hay login, usar el ID real
                items: items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    subtotal: item.subtotal
                })),
                notes: `Pedido desde carrito web. Lead: ${lead.name} (${lead.phone})`
            };
            await createOrder(orderPayload);

            // 3. Generar mensaje WhatsApp
            const vendorPhone = '5214776633068';
            let text = `¡Hola! Soy ${lead.name}.\n\nMe interesa levantar el siguiente pedido de su catálogo:\n\n`;
            items.forEach((item, index) => {
                text += `${index + 1}. ${item.name} | Color: ${item.color} | Talla: ${item.size} | Cantidad: ${item.quantity} pares ${isB2BUnlocked ? `| Sub: $${item.subtotal.toLocaleString()}` : ''}\n`;
            });
            if (isB2BUnlocked) {
                text += `\n*TOTAL ESTIMADO:* $${total.toLocaleString()}\n\n`;
            }
            text += `Por favor, confírmeme existencia y tiempos de entrega.`;
            const encodedText = encodeURIComponent(text);
            const waUrl = `https://wa.me/${vendorPhone}?text=${encodedText}`;

            // 4. Abrir WhatsApp y limpiar carrito
            window.open(waUrl, '_blank');
            clearCart();
            setFeedback({ message: '¡Pedido enviado y registrado! Redirigiendo...', type: 'success' });
            setTimeout(() => { window.location.href = '/'; }, 2000);
        } catch (error) {
            console.error('Error en checkout:', error);
            setFeedback({ message: 'Hubo un error al procesar tu pedido. Intenta de nuevo.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950 text-white py-12">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl text-center lg:text-left">Tu Pedido Express</h1>

                {feedback && (
                    <Toast
                        message={feedback.message}
                        type={feedback.type}
                        onClose={() => setFeedback(null)}
                    />
                )}

                <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
                    <section aria-labelledby="cart-heading" className="lg:col-span-7">
                        <ul role="list" className="divide-y divide-amber-500/20 border-y border-amber-500/20 bg-stone-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 mb-8 lg:mb-0">
                            {items.length === 0 ? (
                                <li className="py-12 text-center text-stone-300 font-semibold">No has agregado nada a tu carrito.</li>
                            ) : items.map((item, productIdx) => (
                                <li key={productIdx} className="flex py-6">
                                    <div className="flex-shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-24 w-24 rounded-2xl object-cover object-center sm:h-32 sm:w-32 border border-amber-500/30 shadow-lg"
                                            />
                                        ) : (
                                            <div className="h-24 w-24 rounded-2xl bg-stone-800 sm:h-32 sm:w-32 flex items-center justify-center text-stone-500 border border-amber-500/20">Sin foto</div>
                                        )}
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                                        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                                            <div>
                                                <h3 className="text-xl font-display font-bold text-white drop-shadow-md">{item.name}</h3>
                                                <div className="mt-1 flex text-sm text-amber-200/80 font-medium">
                                                    <p>{item.color}</p>
                                                    {item.size && <p className="ml-4 border-l border-amber-500/30 pl-4">Talla {item.size}</p>}
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <label className="text-sm text-stone-300 font-medium">Pares:</label>
                                                    <div className="flex items-center gap-2 border border-amber-500/40 bg-stone-950/70 rounded-xl overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(productIdx, item.quantity - 1)}
                                                            className="px-3 py-1.5 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors font-bold"
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const newQty = parseInt(e.target.value) || 1;
                                                                if (newQty > 0) updateQuantity(productIdx, newQty);
                                                            }}
                                                            className="w-16 text-center border-0 focus:ring-0 py-1.5 font-bold text-white bg-transparent"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(productIdx, item.quantity + 1)}
                                                            className="px-3 py-1.5 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-sm text-stone-400 font-semibold">
                                                    {isB2BUnlocked
                                                        ? `$${item.price?.toLocaleString() || '0'} × ${item.quantity} pares`
                                                        : 'Precio especial por volumen'
                                                    }
                                                </p>
                                                {isB2BUnlocked && (
                                                    <p className="mt-1 text-lg font-black text-amber-400">Subtotal: ${item.subtotal.toLocaleString()}</p>
                                                )}
                                            </div>

                                            <div className="mt-4 sm:mt-0 sm:pr-9 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(productIdx)}
                                                    className="text-stone-500 hover:text-red-400 transition-colors p-2 bg-stone-800/50 hover:bg-red-900/30 rounded-full"
                                                >
                                                    <span className="sr-only">Quitar</span>
                                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Envío a WhatsApp */}
                    <section className="lg:col-span-5 bg-stone-900/60 backdrop-blur-xl rounded-3xl border border-amber-500/30 shadow-2xl p-6 sm:p-8">
                        <h2 className="text-xl font-display font-bold text-white mb-6 border-b border-amber-500/20 pb-4">Resumen de Inversión</h2>

                        <dl className="space-y-4">
                            <div className="flex items-center justify-between border-b border-amber-500/10 pb-4">
                                <dt className="text-base text-stone-300">Total de Pares</dt>
                                <dd className="text-lg font-bold text-white">{items.reduce((acc, item) => acc + item.quantity, 0)}</dd>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <dt className="text-2xl font-bold text-white">Monto Total</dt>
                                <dd className="text-3xl font-black text-amber-500 drop-shadow-md">
                                    {isB2BUnlocked ? `$${total.toLocaleString()}` : 'Por Cotizar'}
                                </dd>
                            </div>
                        </dl>

                        <form onSubmit={handleWhatsAppCheckout} className="mt-8 space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-stone-300">Tu Nombre / Empresa</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={lead.name}
                                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                                    className="mt-2 block w-full rounded-xl border-amber-500/30 py-3 px-4 shadow-inner focus:border-amber-500 focus:ring-amber-500 bg-stone-950 text-white placeholder-stone-500 transition-colors"
                                    placeholder="Ej. Zapaterías León"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-stone-300">WhatsApp (Para seguimiento rápido)</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    value={lead.phone}
                                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                                    className="mt-2 block w-full rounded-xl border-amber-500/30 py-3 px-4 shadow-inner focus:border-amber-500 focus:ring-amber-500 bg-stone-950 text-white placeholder-stone-500 transition-colors"
                                    placeholder="477 000 0000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={items.length === 0 || isSubmitting}
                                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#25D366] px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-500/30 hover:bg-[#128C7E] focus:outline-none transition-all disabled:opacity-50 hover:-translate-y-1"
                            >
                                {isSubmitting ? 'Abriendo WhatsApp...' : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        Enviar Pedido por WhatsApp
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <Link to="/" className="font-bold text-amber-500 hover:text-amber-400 transition-colors">
                                ← Seguir viendo el catálogo
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
