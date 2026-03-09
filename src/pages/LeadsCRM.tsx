import { useState, useEffect } from 'react';
import { SkeletonPage } from '../components/Skeleton';
import { getLeads, updateLead, Lead, LeadStatus, PaginationInfo } from '../services/lead.service';
import { getUsers, User } from '../services/user.service';
import { ShoppingCartIcon, ChatBubbleLeftEllipsisIcon, PhoneIcon, FunnelIcon, MagnifyingGlassIcon, UserCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportToCSV } from '../utils/export';
import { Tooltip } from '../components/Tooltip';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { formatMXN, formatDate } from '../utils/format';
import LeadDetailDrawer from '../components/LeadDetailDrawer';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
    NEW: { label: 'Nuevo', color: 'text-blue-700', bg: 'bg-blue-50 ring-blue-600/20' },
    CONTACTED: { label: 'Contactado', color: 'text-amber-700', bg: 'bg-amber-50 ring-amber-600/20' },
    QUALIFIED: { label: 'Calificado', color: 'text-purple-700', bg: 'bg-purple-50 ring-purple-600/20' },
    CONVERTED: { label: 'Convertido', color: 'text-green-700', bg: 'bg-green-50 ring-green-600/20' },
    LOST: { label: 'Perdido', color: 'text-red-700', bg: 'bg-red-50 ring-red-600/20' },
};

const ALL_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

export default function LeadsCRM() {
    const { showToast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sellers, setSellers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => { setSearchDebounce(search); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadsRes, usersRes] = await Promise.all([
                getLeads({
                    page,
                    status: statusFilter || undefined,
                    search: searchDebounce || undefined
                }),
                sellers.length === 0 ? getUsers({ limit: 100 }) : Promise.resolve(null)
            ]);
            setLeads(leadsRes.leads);
            setPagination(leadsRes.pagination);
            if (usersRes) {
                setSellers(usersRes.users.filter((u: User) => ['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER'].includes(u.role)));
            }
        } catch {
            showToast('Error al cargar los prospectos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, statusFilter, searchDebounce]);

    const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
        try {
            await updateLead(leadId, { status: newStatus });
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            showToast(`Estado actualizado a "${STATUS_CONFIG[newStatus].label}"`, 'success');
        } catch {
            showToast('Error al actualizar el estado.', 'error');
        }
    };

    const handleAssign = async (leadId: string, sellerId: string) => {
        try {
            const updated = await updateLead(leadId, { assignedToId: sellerId || null });
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedToId: updated.assignedToId, assignedTo: updated.assignedTo } : l));
            showToast(sellerId ? 'Vendedor asignado correctamente.' : 'Vendedor desasignado.', 'success');
        } catch {
            showToast('Error al asignar vendedor.', 'error');
        }
    };

    const handleWhatsAppRecovery = (lead: Lead) => {
        const activeCart = lead.carts?.[0];
        let total = 0;
        let pairs = 0;
        if (activeCart && activeCart.items) {
            total = activeCart.items.reduce((sum, item) => sum + item.subtotal, 0);
            pairs = activeCart.items.reduce((sum, item) => sum + item.quantity, 0);
        }

        const vendorMsg = `Hola ${lead.name || ''}, vi que apartaste ${pairs} pares con un valor de ${formatMXN(total)} en nuestro catálogo pero no completaste tu pedido. ¿Tuviste alguna duda con los modelos?`;
        const cleanPhone = lead.phone.replace(/\D/g, '');
        const phoneWithCode = cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone;
        window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(vendorMsg)}`, '_blank');
    };

    if (loading && leads.length === 0) return <SkeletonPage />;

    return (
        <div className="px-4 sm:px-6 lg:px-8 animate-fade-in">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Pipeline de Prospectos</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Gestiona tus leads B2B: cambia estado, asigna vendedor y recupera carritos abandonados.
                    </p>
                </div>
                {leads.length > 0 && (
                    <button
                        onClick={() => {
                            const dataToExport = leads.map(l => ({
                                'Prospecto': l.name || 'Sin Nombre',
                                'Teléfono': l.phone,
                                'Estado': STATUS_CONFIG[l.status]?.label || l.status,
                                'Vendedor Asignado': l.assignedTo ? l.assignedTo.fullName : 'Sin Asignar',
                                'Pares en Carrito': l.carts?.[0]?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
                                'Total Abandonado': l.carts?.[0]?.items?.reduce((span, item) => span + item.subtotal, 0) || 0,
                                'Fecha Captura': formatDate(l.createdAt)
                            }));
                            exportToCSV(dataToExport, 'prospectos-crm');
                        }}
                        className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Exportar CSV
                    </button>
                )}
            </div>

            {/* Filters bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Buscar por nombre o teléfono..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500" />
                </div>

                {/* Status pills */}
                <div className="flex items-center gap-2 overflow-x-auto">
                    <FunnelIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <button onClick={() => { setStatusFilter(''); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${!statusFilter ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Todos {pagination ? `(${pagination.total})` : ''}
                    </button>
                    {ALL_STATUSES.map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-brand-500 text-white' : `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ring-1 ring-inset`}`}>
                            {STATUS_CONFIG[s].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:pl-6">Prospecto</th>
                                        <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                                        <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Vendedor</th>
                                        <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Carrito</th>
                                        <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Fecha</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {leads.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16 text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <ChatBubbleLeftEllipsisIcon className="h-10 w-10 text-slate-300 mb-3" />
                                                    <p className="text-sm font-medium">Aún no hay leads capturados.</p>
                                                    <p className="text-xs mt-1 text-slate-400">Comparte tu enlace de catálogo para empezar a capturar prospectos.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : leads.map((lead) => {
                                        const activeCart = lead.carts?.[0];
                                        let cartValue = 0;
                                        let pairCount = 0;
                                        if (activeCart?.items) {
                                            cartValue = activeCart.items.reduce((sum, item) => sum + item.subtotal, 0);
                                            pairCount = activeCart.items.reduce((sum, item) => sum + item.quantity, 0);
                                        }

                                        return (
                                            <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Name + Phone */}
                                                <td className="py-4 pl-4 pr-3 sm:pl-6 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                                    <div className="font-medium text-sm text-slate-900 hover:text-brand-600 transition-colors">{lead.name || 'Sin Nombre'}</div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                        <PhoneIcon className="h-3 w-3 text-green-500" />
                                                        {lead.phone}
                                                    </div>
                                                </td>

                                                {/* Status dropdown */}
                                                <td className="px-3 py-4">
                                                    <select value={lead.status}
                                                        onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset border-0 cursor-pointer ${STATUS_CONFIG[lead.status]?.bg || ''} ${STATUS_CONFIG[lead.status]?.color || ''}`}>
                                                        {ALL_STATUSES.map(s => (
                                                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Assigned seller */}
                                                <td className="px-3 py-4">
                                                    <select value={lead.assignedToId || ''}
                                                        onChange={e => handleAssign(lead.id, e.target.value)}
                                                        className="rounded-lg border-slate-200 text-xs py-1.5 pr-8 focus:border-brand-500 focus:ring-brand-500">
                                                        <option value="">Sin asignar</option>
                                                        {sellers.map(s => (
                                                            <option key={s.id} value={s.id}>{s.fullName}</option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Cart value */}
                                                <td className="px-3 py-4 text-sm">
                                                    {cartValue > 0 ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                            <ShoppingCartIcon className="h-3.5 w-3.5" />
                                                            {formatMXN(cartValue, false)} ({pairCount} pares)
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">Sin carrito</span>
                                                    )}
                                                </td>

                                                {/* Date */}
                                                <td className="px-3 py-4 text-xs text-slate-500">{formatDate(lead.createdAt)}</td>

                                                {/* Actions */}
                                                <td className="relative py-4 pl-3 pr-4 text-right text-sm sm:pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Tooltip content="Enviar mensaje de recuperación por WhatsApp">
                                                            <button onClick={() => handleWhatsAppRecovery(lead)} disabled={cartValue === 0}
                                                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all ${cartValue > 0 ? 'bg-[#25D366] hover:bg-[#128C7E]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                                                <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                                                Recuperar
                                                            </button>
                                                        </Tooltip>
                                                        {lead.status !== 'CONVERTED' && (
                                                            <Tooltip content="Convertir a cliente registrado">
                                                                <a href={`/admin/customers?convert=${lead.name || ''}&phone=${lead.phone}`}
                                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all">
                                                                    <UserCircleIcon className="h-4 w-4" />
                                                                    Convertir
                                                                </a>
                                                            </Tooltip>
                                                        )}
                                                    </div>
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
            <LeadDetailDrawer
                lead={selectedLead}
                open={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                onWhatsApp={handleWhatsAppRecovery}
            />
        </div>
    );
}
