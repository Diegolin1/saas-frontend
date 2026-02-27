import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import axios from 'axios';

export default function Cart() {
    const { items, removeFromCart, total, clearCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lead, setLead] = useState({ name: '', phone: '' });

    const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');

    const handleWhatsAppCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !lead.phone || !lead.name) return;

        setIsSubmitting(true);
        try {
            // Optional: Register Lead in Backend
            await axios.post(`${API_URL}/leads`, {
                name: lead.name,
                phone: lead.phone,
                companyId: 'default' // Or extract from subdomain
            });

            // Generate WhatsApp Link
            const vendorPhone = '5214770000000'; // Target phone in Leon MX
            let text = `¡Hola! Soy ${lead.name}.\n\nMe interesa levantar el siguiente pedido de su catálogo:\n\n`;

            items.forEach((item, index) => {
                text += `${index + 1}. ${item.name} | Color: ${item.color} | Talla: ${item.size} | Cantidad: ${item.quantity} pares | Sub: $${item.subtotal.toLocaleString()}\n`;
            });
            text += `\n*TOTAL ESTIMADO:* $${total.toLocaleString()}\n\nPor favor, confírmeme existencia y tiempos de entrega.`;

            const encodedText = encodeURIComponent(text);
            const waUrl = `https://wa.me/${vendorPhone}?text=${encodedText}`;

            // Open WhatsApp
            window.open(waUrl, '_blank');

            clearCart();
            // Redirect or show success msg?
            window.location.href = '/';
        } catch (error) {
            console.error('Error in checkout:', error);
            alert('Hubo un error al procesar tu solicitud.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Tu Pedido Express</h1>

                <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
                    <section aria-labelledby="cart-heading" className="lg:col-span-7">
                        <ul role="list" className="divide-y divide-slate-200 border-y border-slate-200 bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-8 lg:mb-0">
                            {items.length === 0 ? (
                                <li className="py-12 text-center text-slate-500">No has agregado nada a tu carrito.</li>
                            ) : items.map((item, productIdx) => (
                                <li key={productIdx} className="flex py-6">
                                    <div className="flex-shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-24 w-24 rounded-xl object-cover object-center sm:h-32 sm:w-32 border border-slate-100 shadow-sm"
                                            />
                                        ) : (
                                            <div className="h-24 w-24 rounded-xl bg-slate-100 sm:h-32 sm:w-32 flex items-center justify-center text-slate-400">Sin foto</div>
                                        )}
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                                        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                                                <div className="mt-1 flex text-sm text-slate-500">
                                                    <p>{item.color}</p>
                                                    {item.size && <p className="ml-4 border-l border-slate-200 pl-4">{item.size}</p>}
                                                </div>
                                                <p className="mt-1 flex space-x-2 text-sm text-slate-700">
                                                    <span>${item.price?.toLocaleString() || 'Consultar'} x {item.quantity}</span>
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-indigo-600">Subtotal: ${item.subtotal.toLocaleString()}</p>
                                            </div>

                                            <div className="mt-4 sm:mt-0 sm:pr-9 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(productIdx)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
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
                    <section className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Resumen de Inversión</h2>

                        <dl className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <dt className="text-base text-slate-600">Total de Pares</dt>
                                <dd className="text-base font-medium text-slate-900">{items.reduce((acc, item) => acc + item.quantity, 0)}</dd>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <dt className="text-xl font-bold text-slate-900">Monto Total</dt>
                                <dd className="text-xl font-black text-indigo-600">${total.toLocaleString()}</dd>
                            </div>
                        </dl>

                        <form onSubmit={handleWhatsAppCheckout} className="mt-8 space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Tu Nombre / Empresa</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={lead.name}
                                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                                    className="mt-2 block w-full rounded-xl border-slate-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50"
                                    placeholder="Ej. Zapaterías León"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">WhatsApp (Para seguimiento rápido)</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    value={lead.phone}
                                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                                    className="mt-2 block w-full rounded-xl border-slate-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50"
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
                            <Link to="/" className="font-bold text-indigo-600 hover:text-indigo-500">
                                ← Seguir viendo el catálogo
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
