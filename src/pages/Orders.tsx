import { useEffect, useState } from 'react';
import { SkeletonPage } from '../components/Skeleton';
import { DocumentTextIcon, ChevronDownIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportToCSV } from '../utils/export';
import { formatMXN } from '../utils/format';
import { getOrders, updateOrderStatus, PaginationInfo, Order } from '../services/order.service';
import { createCheckoutSession } from '../services/payment.service';
import { createInvoice, downloadInvoicePdf, downloadInvoiceXml, Invoice } from '../services/invoice.service';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import OrderDetailDrawer from '../components/OrderDetailDrawer';

const ORDER_STATUSES = ['PENDING', 'PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    PRODUCTION: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    SHIPPED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    DELIVERED: 'bg-green-50 text-green-700 ring-green-600/20',
    CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
};

const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    PRODUCTION: 'En Producción',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
};

export default function Orders() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<(Order & { date: string; customerName: string; invoiced?: boolean; invoiceData?: Invoice })[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const { user } = useAuth();
    const canChangeStatus = user && ['OWNER', 'ADMIN', 'SUPERVISOR'].includes(user.role);

    // Invoice Modal State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [invoiceForm, setInvoiceForm] = useState({ paymentForm: '01', paymentMethod: 'PUE', cfdiUse: 'G03' });
    const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<(Order & { date: string; customerName: string; invoiced?: boolean; invoiceData?: Invoice }) | null>(null);

    const fetchOrders = (p = page) => {
        setLoading(true);
        getOrders({ page: p, status: statusFilter || undefined })
            .then(data => {
                const formatted = data.orders.map((o: any) => ({
                    ...o,
                    date: new Date(o.createdAt).toLocaleDateString('es-MX'),
                    customerName: o.customer?.businessName || 'N/A',
                    invoiced: o.invoices && o.invoices.length > 0 && o.invoices[0].status !== 'CANCELED',
                    invoiceData: o.invoices && o.invoices.length > 0 ? o.invoices[0] : undefined
                }));
                setOrders(formatted);
                setPagination(data.pagination);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders(1);
        setPage(1);
    }, [statusFilter]);

    useEffect(() => {
        fetchOrders(page);
    }, [page]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            showToast('Estado actualizado correctamente', 'success');
        } catch (error) {
            showToast('Error al actualizar el estado del pedido', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleInvoiceClick = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!(order?.customer as any)?.taxId) {
            showToast('El cliente no tiene RFC configurado. Por favor, actualiza sus datos antes de facturar.', 'warning');
            return;
        }
        setSelectedOrderId(orderId);
        setIsInvoiceModalOpen(true);
    };

    const submitInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderId) return;
        setIsSubmittingInvoice(true);
        try {
            const invoice = await createInvoice({ orderId: selectedOrderId, ...invoiceForm });
            showToast('Factura generada exitosamente.', 'success');
            setIsInvoiceModalOpen(false);
            // Refresh logic - update the specific order locally
            setOrders(prev => prev.map(o => o.id === selectedOrderId ? { ...o, invoiced: true, invoiceData: invoice } : o));
        } catch (error: any) {
            showToast(error.message || 'Error al generar la factura', 'error');
        } finally {
            setIsSubmittingInvoice(false);
        }
    };

    const handleCheckout = async (orderId: string) => {
        try {
            const data = await createCheckoutSession(orderId);
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            showToast(error.message || 'Error al conectar con la pasarela de pago.', 'error');
        }
    };

    const handleDownload = async (invoiceId: string, type: 'pdf' | 'xml', uuid?: string) => {
        try {
            if (type === 'pdf') {
                await downloadInvoicePdf(invoiceId, uuid);
            } else {
                await downloadInvoiceXml(invoiceId, uuid);
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    if (loading) return <SkeletonPage />;

    return (
        <div className="px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Pedidos & Facturas</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Gestiona tus pedidos y genera facturas fiscales (CFDI).
                    </p>
                </div>
                {orders.length > 0 && (
                    <button
                        onClick={() => {
                            const dataToExport = orders.map(o => ({
                                'Pedido #': o.orderNumber,
                                'Cliente': o.customerName,
                                'Fecha': o.date,
                                'Estado': statusLabels[o.status] || o.status,
                                'Subtotal': Number(o.subtotal).toFixed(2),
                                'IVA': Number((o as any).taxAmount || 0).toFixed(2),
                                'Total': Number(o.total).toFixed(2),
                                'Descuento': Number(o.discountAmount || 0).toFixed(2),
                                'Código Promo': o.promotionCode || ''
                            }));
                            exportToCSV(dataToExport, 'pedidos');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Exportar CSV
                    </button>
                )}
            </div>

            {/* Filter bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <FunnelIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <button onClick={() => setStatusFilter('')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${!statusFilter ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Todos
                    </button>
                    {ORDER_STATUSES.map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ring-1 ring-inset ${statusFilter === s ? 'bg-brand-500 text-white ring-brand-500' : `${statusStyles[s]} `
                                }`}>
                            {statusLabels[s]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                                <div className="p-3 bg-slate-50 rounded-xl mb-4">
                                    <DocumentTextIcon className="h-10 w-10 text-slate-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-900">Sin pedidos aún</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">Los pedidos de tus clientes aparecerán aquí cuando realicen compras en tu catálogo.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:pl-6">
                                                Pedido #
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Cliente
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Fecha
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Estado
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Subtotal
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                IVA (16%)
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Total
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Descuento
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span className="sr-only">Acciones</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => setSelectedOrder(order)}>
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
                                                                className={`appearance-none pr-8 pl-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ring-1 ring-inset focus:ring-2 focus:ring-brand-500 ${statusStyles[order.status] || 'bg-slate-100 text-slate-800'}`}
                                                            >
                                                                {ORDER_STATUSES.map(s => (
                                                                    <option key={s} value={s}>{statusLabels[s]}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDownIcon className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                                        </div>
                                                    ) : (
                                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-5 ring-1 ring-inset ${statusStyles[order.status] || 'bg-slate-100 text-slate-800'}`}>
                                                            {statusLabels[order.status] || order.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                                    {formatMXN(order.subtotal)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {formatMXN((order as any).taxAmount || 0)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-gray-900">
                                                    {formatMXN(order.total)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {order.discountAmount > 0 ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                                {order.promotionCode}
                                                            </span>
                                                            <span className="text-green-600 font-medium">
                                                                -{formatMXN(order.discountAmount)}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {order.invoiced && order.invoiceData ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-green-600 flex items-center justify-end gap-1 text-xs font-semibold">
                                                                <DocumentTextIcon className="h-4 w-4" />
                                                                Facturado
                                                            </span>
                                                            <div className="flex gap-2 text-xs">
                                                                <button onClick={() => handleDownload(order.invoiceData!.id, 'pdf', order.invoiceData!.uuid)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 rounded px-2 py-0.5 bg-indigo-50">PDF</button>
                                                                <button onClick={() => handleDownload(order.invoiceData!.id, 'xml', order.invoiceData!.uuid)} className="text-blue-600 hover:text-blue-900 border border-blue-200 rounded px-2 py-0.5 bg-blue-50">XML</button>
                                                            </div>
                                                            {!canChangeStatus && order.status === 'PENDING' && (
                                                                <button onClick={() => handleCheckout(order.id)} className="w-full text-center bg-slate-900 text-white rounded px-2 py-1 mt-1 text-[10px] font-bold hover:bg-slate-800 transition-colors">
                                                                    Pagar en Línea
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : canChangeStatus ? (
                                                        <button
                                                            onClick={() => handleInvoiceClick(order.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                        >
                                                            Timbrar Factura
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-col flex-wrap justify-end gap-2 items-end">
                                                            <button
                                                                onClick={() => showToast('Se ha notificado a tu proveedor para enviar la factura correspondiente.', 'success')}
                                                                className="text-slate-500 hover:text-slate-800 font-medium text-xs border border-slate-300 rounded px-2 py-1 bg-white hover:bg-slate-50 transition-colors"
                                                            >
                                                                Solicitar Factura
                                                            </button>
                                                            {order.status === 'PENDING' && (
                                                                <button onClick={() => handleCheckout(order.id)} className="bg-slate-900 text-white rounded px-3 py-1.5 text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm w-full">
                                                                    Pagar en Línea
                                                                </button>
                                                            )}
                                                        </div>
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
            {pagination && (
                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={setPage}
                />
            )}

            {/* Invoice Generation Modal */}
            <Dialog open={isInvoiceModalOpen} onClose={() => !isSubmittingInvoice && setIsInvoiceModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6 w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                            <Dialog.Title className="text-lg font-semibold text-slate-800">Generar Factura (CFDI)</Dialog.Title>
                            <button disabled={isSubmittingInvoice} onClick={() => setIsInvoiceModalOpen(false)}>
                                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={submitInvoice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pago</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={invoiceForm.paymentForm}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentForm: e.target.value })}
                                >
                                    <option value="01">01 - Efectivo</option>
                                    <option value="02">02 - Cheque nominativo</option>
                                    <option value="03">03 - Transferencia electrónica</option>
                                    <option value="04">04 - Tarjeta de crédito</option>
                                    <option value="28">28 - Tarjeta de débito</option>
                                    <option value="99">99 - Por definir</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={invoiceForm.paymentMethod}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value })}
                                >
                                    <option value="PUE">PUE - Pago en una sola exhibición</option>
                                    <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Uso de CFDI</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={invoiceForm.cfdiUse}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, cfdiUse: e.target.value })}
                                >
                                    <option value="G01">G01 - Adquisición de mercancías</option>
                                    <option value="G03">G03 - Gastos en general</option>
                                    <option value="P01">P01 - Por definir</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button type="button" disabled={isSubmittingInvoice} onClick={() => setIsInvoiceModalOpen(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmittingInvoice}
                                    className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600 transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                                    {isSubmittingInvoice ? 'Timbrando...' : 'Timbrar'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
            <OrderDetailDrawer
                order={selectedOrder}
                open={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    );
}
