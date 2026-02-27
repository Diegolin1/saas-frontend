import { useEffect, useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { getOrders } from '../services/order.service';

export default function Orders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getOrders()
            .then(data => {
                // Ensure date is formatted
                const formatted = data.map((o: any) => ({
                    ...o,
                    date: new Date(o.createdAt).toLocaleDateString(),
                    customer: o.customer?.businessName || 'N/A' // Handle customer name if populated
                }));
                setOrders(formatted);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleInvoice = (orderId: string) => {
        // Simulate Facturapi call
        alert(`Generando factura para Orden #${orderId} vía Facturapi...`)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoiced: true } : o))
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Orders & Invoices</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage your orders and generate tax invoices (CFDI).
                    </p>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Order #
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Customer
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Date
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Total
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                #{order.orderNumber}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{order.customer}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{order.date}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${order.total.toLocaleString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                {order.invoiced ? (
                                                    <span className="text-green-600 flex items-center justify-end gap-1">
                                                        <DocumentTextIcon className="h-4 w-4" />
                                                        Facturado
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleInvoice(order.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
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
                    </div>
                </div>
            </div>
        </div>
    )
}
