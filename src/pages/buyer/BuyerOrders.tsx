import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { formatMXN } from '../../utils/format';

interface OrderItem {
    id: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: { name: string };
}

interface Order {
    id: string;
    orderNumber: number;
    status: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    notes?: string;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
    CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
    PRODUCTION: { label: 'En Producción', color: 'bg-purple-100 text-purple-700' },
    SHIPPED: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-700' },
    DELIVERED: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function BuyerOrders() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const limit = 10;

    useEffect(() => {
        setLoading(true);
        const params: Record<string, string | number> = { page, limit };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;

        api.get('/orders', { params })
            .then(({ data }) => {
                setOrders(data.orders || data || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotal(data.pagination?.total || 0);
            })
            .catch(() => showToast('No se pudieron cargar tus pedidos.', 'error'))
            .finally(() => setLoading(false));
    }, [page, search, statusFilter, showToast]);

    const handleReorder = async (order: Order) => {
        try {
            // Add items to the public cart via localStorage
            const existingRaw = localStorage.getItem('saas_cart_items');
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            for (const item of order.items) {
                existing.push({
                    productId: (item as any).productId || item.id,
                    variantId: (item as any).variantId || null,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    name: item.product?.name || 'Producto',
                });
            }
            localStorage.setItem('saas_cart_items', JSON.stringify(existing));
            showToast(`Se agregaron ${order.items.length} artículos al carrito.`, 'success');
        } catch {
            showToast('No se pudo reordenar.', 'error');
        }
    };

    const statusBadge = (status: string) => {
        const s = STATUS_MAP[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>
                {s.label}
            </span>
        );
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">Mis Pedidos</h1>
                <p className="mt-1 text-sm text-slate-500">Consulta el estado de tus pedidos y reordena fácilmente.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por # de pedido..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                </div>
                <div className="relative">
                    <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_MAP).map(([key, s]) => (
                            <option key={key} value={key}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <svg className="animate-spin h-6 w-6 text-slate-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            )}

            {/* Empty state */}
            {!loading && orders.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                    <ShoppingBagIcon className="h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">Aún no tienes pedidos</p>
                    <p className="mt-1 text-xs text-slate-500">Explora el catálogo y crea tu primer pedido.</p>
                    <Link to="/buyer/catalog" className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                        Ir al catálogo
                    </Link>
                </div>
            )}

            {/* Orders Table */}
            {!loading && orders.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500"># Pedido</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Artículos</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => (
                                <>
                                    <tr
                                        key={order.id}
                                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                    >
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">#{order.orderNumber}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{order.items?.length || 0} art.</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatMXN(Number(order.total))}</td>
                                        <td className="px-4 py-3">{statusBadge(order.status)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                                                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                Reordenar
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Expanded detail row */}
                                    {expandedId === order.id && (
                                        <tr key={`${order.id}-detail`}>
                                            <td colSpan={6} className="bg-slate-50/50 px-6 py-4">
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-bold uppercase text-slate-500">Detalle del Pedido</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full text-sm">
                                                            <thead>
                                                                <tr className="text-left text-xs font-semibold text-slate-500">
                                                                    <th className="pb-2">Producto</th>
                                                                    <th className="pb-2">Talla</th>
                                                                    <th className="pb-2">Color</th>
                                                                    <th className="pb-2 text-center">Cant.</th>
                                                                    <th className="pb-2 text-right">Precio U.</th>
                                                                    <th className="pb-2 text-right">Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {order.items.map((item) => (
                                                                    <tr key={item.id}>
                                                                        <td className="py-1.5 font-medium text-slate-800">{item.product?.name}</td>
                                                                        <td className="py-1.5 text-slate-600">{item.size}</td>
                                                                        <td className="py-1.5 text-slate-600">{item.color}</td>
                                                                        <td className="py-1.5 text-center text-slate-700">{item.quantity}</td>
                                                                        <td className="py-1.5 text-right text-slate-600">{formatMXN(Number(item.unitPrice))}</td>
                                                                        <td className="py-1.5 text-right font-semibold text-slate-800">{formatMXN(Number(item.subtotal))}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="flex justify-end gap-6 border-t border-slate-200 pt-3 text-sm">
                                                        <div className="text-slate-500">Subtotal: <span className="font-semibold text-slate-700">{formatMXN(Number(order.subtotal))}</span></div>
                                                        {Number(order.discountAmount) > 0 && (
                                                            <div className="text-emerald-600">Desc: -<span className="font-semibold">{formatMXN(Number(order.discountAmount))}</span></div>
                                                        )}
                                                        <div className="text-slate-500">IVA: <span className="font-semibold text-slate-700">{formatMXN(Number(order.taxAmount))}</span></div>
                                                        <div className="text-slate-900 font-bold">Total: {formatMXN(Number(order.total))}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
            )}
        </div>
    );
}
