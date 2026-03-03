import { useEffect, useState } from 'react';
import { DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getOrders, updateOrderStatus } from '../services/order.service';
import { useAuth } from '../context/AuthContext';

const ORDER_STATUSES = ['PENDING', 'PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PRODUCTION: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    PRODUCTION: 'En Producción',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
};

export default function Orders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const { user } = useAuth();
    const canChangeStatus = user && ['OWNER', 'ADMIN', 'SUPERVISOR'].includes(user.role);

    const fetchOrders = () => {
        setLoading(true);
        getOrders()
            .then(data => {
                const formatted = data.map((o: any) => ({
                    ...o,
                    date: new Date(o.createdAt).toLocaleDateString('es-MX'),
                    customerName: o.customer?.businessName || 'N/A'
                }));
                setOrders(formatted);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            alert('Error al actualizar el estado del pedido');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleInvoice = (orderId: string) => {
        alert(`Generando factura para Orden #${orderId} vía Facturapi...`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoiced: true } : o));
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Pedidos & Facturas</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Gestiona tus pedidos y genera facturas fiscales (CFDI).
                    </p>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        {orders.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <DocumentTextIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No hay pedidos aún.</p>
                                <p className="text-gray-400 text-sm mt-1">Los pedidos de tus clientes aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                Pedido #
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Cliente
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Fecha
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Estado
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Total
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span className="sr-only">Acciones</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    #{order.orderNumber}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{order.customerName}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{order.date}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {canChangeStatus ? (
                                                        <div className="relative inline-block">
                                                            <select
                                                                value={order.status}
                                                                disabled={updatingId === order.id}
                                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                                className={`appearance-none pr-8 pl-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${statusStyles[order.status] || 'bg-gray-100 text-gray-800'}`}
                                                            >
                                                                {ORDER_STATUSES.map(s => (
                                                                    <option key={s} value={s}>{statusLabels[s]}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDownIcon className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                                        </div>
                                                    ) : (
                                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusStyles[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                            {statusLabels[order.status] || order.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">
                                                    ${Number(order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {order.invoiced ? (
                                                        <span className="text-green-600 flex items-center justify-end gap-1">
                                                            <DocumentTextIcon className="h-4 w-4" />
                                                            Facturado
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleInvoice(order.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                        >
                                                            Facturar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
