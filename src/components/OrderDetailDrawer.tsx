import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ShoppingBagIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { Order } from '../services/order.service';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
    CONFIRMED: { label: 'Confirmado', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
    SHIPPED: { label: 'Enviado', color: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
    DELIVERED: { label: 'Entregado', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-50 text-red-700 ring-red-600/20' },
};

function formatMXN(n: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

interface Props {
    order: (Order & { date: string; customerName: string }) | null;
    open: boolean;
    onClose: () => void;
}

export default function OrderDetailDrawer({ order, open, onClose }: Props) {
    if (!order) return null;

    const st = STATUS_MAP[order.status] || STATUS_MAP.PENDING;

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                                <Dialog.Panel className="w-screen max-w-lg">
                                    <div className="flex h-full flex-col bg-white shadow-xl">
                                        {/* Header */}
                                        <div className="bg-stone-900 px-6 py-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Dialog.Title className="text-lg font-display font-bold text-white">
                                                        Pedido #{order.orderNumber}
                                                    </Dialog.Title>
                                                    <p className="text-sm text-stone-300 mt-1">{order.customerName}</p>
                                                </div>
                                                <button onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:text-white transition-colors">
                                                    <XMarkIcon className="h-6 w-6" />
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center gap-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${st.color}`}>
                                                    {st.label}
                                                </span>
                                                <span className="text-xs text-stone-400">
                                                    {new Date(order.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                            {/* Items */}
                                            <div>
                                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                                                    Productos ({order.items.length})
                                                </p>
                                                <div className="space-y-3">
                                                    {order.items.map((item) => {
                                                        const imgUrl = item.product?.images?.[0]?.url;
                                                        return (
                                                            <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                                                                {/* Product image */}
                                                                <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-slate-200 overflow-hidden">
                                                                    {imgUrl ? (
                                                                        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center">
                                                                            <ShoppingBagIcon className="h-6 w-6 text-slate-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-stone-900 truncate">
                                                                        {item.product?.name || 'Producto'}
                                                                    </p>
                                                                    <p className="text-xs text-stone-400">
                                                                        Talla {item.size} · {item.color} · {item.quantity} pza{item.quantity > 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                                {/* Price */}
                                                                <div className="text-right flex-shrink-0">
                                                                    <p className="text-sm font-semibold text-stone-900">{formatMXN(item.subtotal)}</p>
                                                                    <p className="text-xs text-stone-400">{formatMXN(item.unitPrice)} c/u</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Promotion */}
                                            {order.promotion && (
                                                <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
                                                    <ReceiptPercentIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-amber-800">Cupón: {order.promotion.code}</p>
                                                        <p className="text-xs text-amber-600">
                                                            {order.promotion.type === 'PERCENTAGE'
                                                                ? `${order.promotion.discount}% de descuento`
                                                                : `${formatMXN(order.promotion.discount)} de descuento`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Totals */}
                                            <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                                                <div className="px-4 py-3 flex justify-between text-sm">
                                                    <span className="text-stone-500">Subtotal</span>
                                                    <span className="text-stone-700 font-medium">{formatMXN(order.subtotal)}</span>
                                                </div>
                                                {order.discountAmount > 0 && (
                                                    <div className="px-4 py-3 flex justify-between text-sm border-t border-stone-200">
                                                        <span className="text-stone-500">Descuento</span>
                                                        <span className="text-red-600 font-medium">-{formatMXN(order.discountAmount)}</span>
                                                    </div>
                                                )}
                                                <div className="px-4 py-3 flex justify-between text-base border-t border-stone-200 bg-stone-100">
                                                    <span className="font-semibold text-stone-900">Total</span>
                                                    <span className="font-bold text-stone-900">{formatMXN(order.total)}</span>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {order.notes && (
                                                <div>
                                                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Notas</p>
                                                    <p className="text-sm text-stone-600 bg-slate-50 rounded-xl p-4 border border-slate-200">{order.notes}</p>
                                                </div>
                                            )}

                                            {/* Customer */}
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Cliente</p>
                                                <p className="text-sm font-semibold text-stone-900">{order.customerName}</p>
                                                {order.customer?.email && (
                                                    <p className="text-xs text-stone-400 mt-0.5">{order.customer.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
