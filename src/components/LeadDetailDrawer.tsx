import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, PhoneIcon, ChatBubbleLeftEllipsisIcon, ShoppingCartIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Lead, LeadStatus } from '../services/lead.service';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
    NEW: { label: 'Nuevo', color: 'text-blue-700', bg: 'bg-blue-50 ring-blue-600/20' },
    CONTACTED: { label: 'Contactado', color: 'text-amber-700', bg: 'bg-amber-50 ring-amber-600/20' },
    QUALIFIED: { label: 'Calificado', color: 'text-purple-700', bg: 'bg-purple-50 ring-purple-600/20' },
    CONVERTED: { label: 'Convertido', color: 'text-emerald-700', bg: 'bg-emerald-50 ring-emerald-600/20' },
    LOST: { label: 'Perdido', color: 'text-red-700', bg: 'bg-red-50 ring-red-600/20' },
};

function formatMXN(n: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
}

interface Props {
    lead: Lead | null;
    open: boolean;
    onClose: () => void;
    onWhatsApp?: (lead: Lead) => void;
}

export default function LeadDetailDrawer({ lead, open, onClose, onWhatsApp }: Props) {
    if (!lead) return null;

    const st = STATUS_CONFIG[lead.status];
    const activeCart = lead.carts?.[0];
    const cartTotal = activeCart?.items?.reduce((s, i) => s + i.subtotal, 0) || 0;
    const cartPairs = activeCart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;

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
                                <Dialog.Panel className="w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-white shadow-xl">
                                        {/* Header */}
                                        <div className="bg-stone-900 px-6 py-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Dialog.Title className="text-lg font-display font-bold text-white">
                                                        {lead.name || 'Sin nombre'}
                                                    </Dialog.Title>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <PhoneIcon className="h-3.5 w-3.5 text-stone-400" />
                                                        <span className="text-sm text-stone-300">{lead.phone}</span>
                                                    </div>
                                                </div>
                                                <button onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:text-white transition-colors">
                                                    <XMarkIcon className="h-6 w-6" />
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${st.bg} ${st.color}`}>
                                                    {st.label}
                                                </span>
                                                <span className="text-xs text-stone-400">
                                                    Registrado {timeAgo(lead.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                            {/* Quick actions */}
                                            {onWhatsApp && (
                                                <button
                                                    onClick={() => onWhatsApp(lead)}
                                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                                                >
                                                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                                                    Recuperar por WhatsApp
                                                </button>
                                            )}

                                            {/* Assigned seller */}
                                            {lead.assignedTo && (
                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Vendedor Asignado</p>
                                                    <p className="text-sm font-semibold text-stone-900">{lead.assignedTo.fullName}</p>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {lead.notes && (
                                                <div>
                                                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Notas</p>
                                                    <p className="text-sm text-stone-600 bg-slate-50 rounded-xl p-4 border border-slate-200">{lead.notes}</p>
                                                </div>
                                            )}

                                            {/* Cart info */}
                                            <div>
                                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Carrito Abandonado</p>
                                                {activeCart ? (
                                                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                                        <div className="p-4 flex items-center gap-3 border-b border-slate-200">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                                                                <ShoppingCartIcon className="h-5 w-5 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-stone-900">{cartPairs} par{cartPairs !== 1 ? 'es' : ''}</p>
                                                                <p className="text-xs text-stone-400">Valor: {formatMXN(cartTotal)}</p>
                                                            </div>
                                                        </div>
                                                        {activeCart.items.map((item, i) => (
                                                            <div key={i} className="px-4 py-3 flex items-center justify-between border-b border-slate-100 last:border-0">
                                                                <span className="text-sm text-stone-600">{item.quantity}x producto</span>
                                                                <span className="text-sm font-semibold text-stone-900">{formatMXN(item.subtotal)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-stone-400 italic">Sin carrito activo.</p>
                                                )}
                                            </div>

                                            {/* Timeline */}
                                            <div>
                                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Timeline</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                                                            <ClockIcon className="h-3.5 w-3.5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-stone-900">Lead registrado</p>
                                                            <p className="text-xs text-stone-400">{new Date(lead.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                    {lead.status !== 'NEW' && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                                                                <ClockIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-stone-900">Último movimiento</p>
                                                                <p className="text-xs text-stone-400">{new Date(lead.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Source */}
                                            {lead.source && (
                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Fuente</p>
                                                    <p className="text-sm text-stone-700 capitalize">{lead.source}</p>
                                                </div>
                                            )}
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
