import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ShoppingBagIcon, CalendarIcon, IdentificationIcon, MapPinIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Customer } from '../services/customer.service';
import { getOrders, Order } from '../services/order.service';
import { formatMXN } from '../utils/format';
import { useToast } from '../context/ToastContext';

interface Props {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
}

const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    PRODUCTION: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    SHIPPED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    DELIVERED: 'bg-green-50 text-green-700 ring-green-600/20',
    CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function CustomerDetailDrawer({ customer, open, onClose }: Props) {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer && open) {
            fetchOrders();
        }
    }, [customer, open]);

    const fetchOrders = async () => {
        if (!customer) return;
        setLoading(true);
        try {
            const data = await getOrders({ customerId: customer.id, limit: 10 });
            setOrders(data.orders);
        } catch {
            showToast('Error al cargar historial de pedidos', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!customer) return null;

    const address = customer.shippingAddress as any;

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
                                        <div className="bg-brand-600 px-6 py-8">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                                                        <UserCircleIcon className="h-8 w-8 text-white" />
                                                    </div>
                                                    <div>
                                                        <Dialog.Title className="text-xl font-display font-bold text-white">
                                                            {customer.businessName}
                                                        </Dialog.Title>
                                                        <p className="text-brand-100 text-sm">{customer.code || 'Sin código'}</p>
                                                    </div>
                                                </div>
                                                <button onClick={onClose} className="rounded-lg p-1 text-white/60 hover:text-white transition-colors">
                                                    <XMarkIcon className="h-6 w-6" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                                            {/* Info Cards */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RFC</p>
                                                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                        <IdentificationIcon className="h-4 w-4 text-slate-400" />
                                                        {customer.taxId || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Límite Crédito</p>
                                                    <p className="text-sm font-semibold text-indigo-600">
                                                        {formatMXN(customer.creditLimit)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <MapPinIcon className="h-4 w-4" />
                                                    Dirección de Envío
                                                </h4>
                                                {address ? (
                                                    <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-200 leading-relaxed">
                                                        <p>{address.street} {address.extNumber}{address.intNumber ? `, Int ${address.intNumber}` : ''}</p>
                                                        <p>{address.neighborhood}, CP {address.zipCode}</p>
                                                        <p>{address.city}, {address.state}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400 italic">Sin dirección registrada.</p>
                                                )}
                                            </div>

                                            {/* Order History */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <ShoppingBagIcon className="h-4 w-4" />
                                                    Historial de Pedidos (Últimos 10)
                                                </h4>
                                                
                                                {loading ? (
                                                    <div className="space-y-3">
                                                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl" />)}
                                                    </div>
                                                ) : orders.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {orders.map(order => (
                                                            <div key={order.id} className="group relative flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all">
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">#{order.orderNumber}</p>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                            <CalendarIcon className="h-3 w-3" />
                                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusStyles[order.status] || 'bg-slate-100'}`}>
                                                                            {order.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-bold text-slate-900">{formatMXN(order.total)}</p>
                                                                    <p className="text-[10px] text-slate-400">{order.items.length} productos</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                        <ShoppingBagIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500 font-medium">No se encontraron pedidos</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="border-t border-slate-100 p-6 flex gap-3">
                                            <button
                                                onClick={() => window.location.href = `/admin/orders/new?customer=${customer.id}`}
                                                className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all active:scale-95"
                                            >
                                                Nuevo Pedido
                                            </button>
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
