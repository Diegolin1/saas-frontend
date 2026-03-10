import { useEffect, useState } from 'react';
import { SkeletonPage } from '../components/Skeleton';
import { getInvoices, downloadInvoicePdf, downloadInvoiceXml, type Invoice, type InvoicePagination } from '../services/invoice.service';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatMXN, formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Pagination from '../components/Pagination';

const statusMap: Record<string, { label: string; style: string }> = {
    valid: { label: 'Vigente', style: 'bg-green-50 text-green-700 border-green-200' },
    canceled: { label: 'Cancelada', style: 'bg-red-50 text-red-700 border-red-200' },
    pending: { label: 'Pendiente', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

export default function Invoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [pagination, setPagination] = useState<InvoicePagination | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        setPage(1);
    }, [search, status, dateFrom, dateTo]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getInvoices({
                    page,
                    search,
                    status,
                    dateFrom,
                    dateTo,
                });
                setInvoices(data.invoices);
                setPagination(data.pagination);
            } catch (err: any) {
                showToast(getErrorMessage(err, 'Error al cargar facturas.'), 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page, search, status, dateFrom, dateTo]);

    if (loading) return <SkeletonPage />;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Facturación</h1>
                    <p className="mt-1 text-sm text-slate-500">Consulta y descarga tus comprobantes fiscales digitales (CFDI).</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Buscar</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="UUID, ID Facturapi, cliente o email"
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Todos</option>
                            <option value="valid">Vigente</option>
                            <option value="pending">Pendiente</option>
                            <option value="canceled">Cancelada</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setStatus('');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className="w-full h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>
            </div>

            {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="p-3 bg-slate-50 rounded-xl mb-4">
                        <DocumentTextIcon className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Sin facturas aún</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
                        Las facturas se generan desde la sección de Pedidos al confirmar una orden con datos fiscales.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">UUID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Uso CFDI</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Descargar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map((inv) => {
                                    const st = statusMap[inv.status?.toLowerCase()] || statusMap.pending;
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-700 truncate max-w-[200px]">
                                                {inv.uuid || inv.facturapiId?.slice(0, 12) || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                {formatDate(inv.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                {formatMXN(inv.total)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {inv.cfdiUse}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.style}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => downloadInvoicePdf(inv.id, inv.uuid)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                                                    >
                                                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                                        PDF
                                                    </button>
                                                    <button
                                                        onClick={() => downloadInvoiceXml(inv.id, inv.uuid)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                                    >
                                                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                                        XML
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {pagination && pagination.totalPages > 1 && (
                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
