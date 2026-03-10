import { useEffect, useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import { downloadInvoicePdf, downloadInvoiceXml, getInvoices, Invoice, InvoicePagination } from '../../services/invoice.service';
import { formatMXN } from '../../utils/format';

export default function BuyerInvoices() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [pagination, setPagination] = useState<InvoicePagination | null>(null);

    useEffect(() => {
        setLoading(true);
        getInvoices({ page, limit: 10 })
            .then((data) => {
                setInvoices(data.invoices || []);
                setPagination(data.pagination || null);
            })
            .catch(() => showToast('No se pudieron cargar tus facturas.', 'error'))
            .finally(() => setLoading(false));
    }, [page, showToast]);

    const handleDownload = async (invoiceId: string, type: 'pdf' | 'xml', uuid?: string) => {
        try {
            if (type === 'pdf') await downloadInvoicePdf(invoiceId, uuid);
            else await downloadInvoiceXml(invoiceId, uuid);
        } catch {
            showToast('No se pudo descargar el archivo.', 'error');
        }
    };

    if (loading) {
        return <div className="text-sm text-slate-500">Cargando facturas...</div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">Mis Facturas</h1>
                <p className="mt-1 text-sm text-slate-500">Consulta y descarga los CFDI de tus pedidos.</p>
            </div>

            {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-12">
                    <DocumentTextIcon className="h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">Aún no tienes facturas</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">UUID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Estatus</th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Descargas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="px-4 py-3 text-xs text-slate-700">{invoice.uuid || invoice.id}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(invoice.createdAt).toLocaleDateString('es-MX')}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatMXN(Number(invoice.total || 0))}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{invoice.status}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-2">
                                            <button onClick={() => handleDownload(invoice.id, 'pdf', invoice.uuid)} className="rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">PDF</button>
                                            <button onClick={() => handleDownload(invoice.id, 'xml', invoice.uuid)} className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">XML</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
