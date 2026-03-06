import { useState, useEffect } from 'react';
import { getLeads, Lead, PaginationInfo } from '../services/lead.service';
import { ShoppingCartIcon, ChatBubbleLeftEllipsisIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '../components/Tooltip';
import Pagination from '../components/Pagination';

export default function LeadsCRM() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getLeads({ page });
            setLeads(data.leads);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error loading leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page]);

    const handleWhatsAppRecovery = (lead: Lead) => {
        const activeCart = lead.carts?.[0];
        let total = 0;
        let pairs = 0;

        if (activeCart && activeCart.items) {
            total = activeCart.items.reduce((sum, item) => sum + item.subtotal, 0);
            pairs = activeCart.items.reduce((sum, item) => sum + item.quantity, 0);
        }

        const vendorMsg = `Hola ${lead.name || ''}, vi que apartaste ${pairs} pares con un valor de $${total.toLocaleString()} en nuestro catálogo pero no completaste tu pedido. ¿Tuviste alguna duda con los modelos?`;

        const encodedText = encodeURIComponent(vendorMsg);
        // Ensure phone number has country code if not present (simplified for Mexico)
        const cleanPhone = lead.phone.replace(/\D/g, '');
        const phoneWithCode = cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone;

        const waUrl = `https://wa.me/${phoneWithCode}?text=${encodedText}`;
        window.open(waUrl, '_blank');
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
    );

    return (
        <div className="px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-display font-bold text-gray-900">Prospectos (Leads)</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Historial de usuarios que intentaron acceder a precios mayoristas y sus carritos abandonados.
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
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Prospecto</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">WhatsApp</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Capturado El</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Carrito Abandonado</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {leads.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <ChatBubbleLeftEllipsisIcon className="h-10 w-10 text-gray-300 mb-3" />
                                                    <p className="text-sm font-medium">Aún no hay leads capturados.</p>
                                                    <p className="text-xs mt-1">Comparte tu enlace de catálogo para empezar.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : leads.map((lead) => {
                                        const dateCaptured = new Date(lead.createdAt).toLocaleDateString();
                                        const activeCart = lead.carts?.[0]; // Assuming most recent cart
                                        let cartValue = 0;
                                        let pairCount = 0;
                                        if (activeCart && activeCart.items) {
                                            cartValue = activeCart.items.reduce((sum, item) => sum + item.subtotal, 0);
                                            pairCount = activeCart.items.reduce((sum, item) => sum + item.quantity, 0);
                                        }

                                        return (
                                            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {lead.name || 'Sin Nombre'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <PhoneIcon className="h-4 w-4 text-green-500" />
                                                        {lead.phone}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {dateCaptured}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {cartValue > 0 ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                            <ShoppingCartIcon className="h-3.5 w-3.5" />
                                                            ${cartValue.toLocaleString()} ({pairCount} pares)
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Catálogo vacío</span>
                                                    )}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <Tooltip content="Mandar mensaje de recuperación automatizado por WhatsApp">
                                                        <button
                                                            onClick={() => handleWhatsAppRecovery(lead)}
                                                            disabled={cartValue === 0}
                                                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${cartValue > 0 ? 'bg-[#25D366] hover:bg-[#128C7E] hover:scale-105' : 'bg-gray-300 cursor-not-allowed'}`}
                                                        >
                                                            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                                            Recuperar
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
        </div>
    );
}
