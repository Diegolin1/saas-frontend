import { useState, useEffect } from 'react';
import { SkeletonPage } from '../components/Skeleton';
import { getPromotions, createPromotion, updatePromotion, deletePromotion, Promotion } from '../services/promotion.service';
import { getErrorMessage } from '../services/api';
import { Dialog } from '@headlessui/react';
import { PlusIcon, TrashIcon, XMarkIcon, GiftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';
import { formatMXN } from '../utils/format';

export default function Promotions() {
    const { showToast } = useToast();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ code: '', discount: '', type: 'PERCENTAGE', expiresAt: '', usageLimit: '', minOrderAmount: '' });
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const data = await getPromotions();
            setPromotions(data);
        } catch (err) {
            showToast(getErrorMessage(err, 'Error al cargar las promociones'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const discountValue = parseFloat(formData.discount);
        if (isNaN(discountValue) || discountValue <= 0) {
            setError('El descuento debe ser mayor a 0.');
            return;
        }
        if (formData.type === 'PERCENTAGE' && discountValue > 100) {
            setError('El porcentaje de descuento no puede superar el 100%.');
            return;
        }

        try {
            await createPromotion({
                code: formData.code.trim().toUpperCase(),
                discount: discountValue,
                type: formData.type,
                expiresAt: formData.expiresAt || undefined,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null
            });
            setIsModalOpen(false);
            setFormData({ code: '', discount: '', type: 'PERCENTAGE', expiresAt: '', usageLimit: '', minOrderAmount: '' });
            loadData();
            showToast('Promoción creada correctamente', 'success');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al crear la promoción'));
        }
    };

    const handleToggle = async (promo: Promotion) => {
        try {
            await updatePromotion(promo.id, { isActive: !promo.isActive });
            setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p));
            showToast(promo.isActive ? 'Promoción desactivada' : 'Promoción activada', 'success');
        } catch (err: unknown) {
            showToast(getErrorMessage(err, 'Error al actualizar'), 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deletePromotion(id);
            loadData();
            showToast('Promoción eliminada', 'success');
        } catch (err: unknown) {
            showToast(getErrorMessage(err, 'Error al eliminar'), 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    if (loading) return <SkeletonPage />;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-display font-bold text-slate-900">Promociones y Cupones</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Crea códigos de descuento para tus clientes mayoristas.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nueva Promoción
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {promotions.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <GiftIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">No hay promociones creadas.</p>
                        <p className="text-slate-400 text-sm mt-1">Crea tu primer cupón de descuento.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:pl-6">Código</th>
                                    <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Descuento</th>
                                    <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Usos</th>
                                    <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Mín. Pedido</th>
                                    <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Expira</th>
                                    <th className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {promotions.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono font-bold text-slate-900 sm:pl-6">
                                            {promo.code}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-700">
                                            {promo.type === 'PERCENTAGE' ? `${promo.discount}%` : formatMXN(promo.discount, false)}
                                            <span className="ml-1 text-xs text-slate-400">({promo.type === 'PERCENTAGE' ? 'Porcentaje' : 'Fijo'})</span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                                            {promo.usageLimit ? (
                                                <span className={promo.usageCount >= promo.usageLimit ? 'text-red-600 font-semibold' : ''}>
                                                    {promo.usageCount}/{promo.usageLimit}
                                                </span>
                                            ) : (
                                                <span>{promo.usageCount} / <span className="text-slate-400">∞</span></span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                                            {promo.minOrderAmount ? formatMXN(promo.minOrderAmount, false) : <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                            {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('es-MX') : <span className="text-slate-400">Sin expiración</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <button
                                                onClick={() => handleToggle(promo)}
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-colors ring-1 ring-inset ${promo.isActive ? 'bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100' : 'bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100'}`}
                                            >
                                                {promo.isActive ? 'Activa' : 'Inactiva'}
                                            </button>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button
                                                onClick={() => setConfirmDelete(promo.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white p-6 w-full shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-display font-bold text-slate-900">Nueva Promoción</Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Código</label>
                                <input type="text" required placeholder="Ej. VERANO2026"
                                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 shadow-sm uppercase text-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Descuento</label>
                                    <input type="number" step="0.01" required min="0.01"
                                        max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                                        className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 shadow-sm text-sm focus:border-brand-500 focus:ring-brand-500"
                                        value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Tipo</label>
                                    <select className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 shadow-sm text-sm focus:border-brand-500 focus:ring-brand-500"
                                        value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="PERCENTAGE">Porcentaje (%)</option>
                                        <option value="FIXED">Monto Fijo ($)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Límite de usos <span className="text-slate-400">(opc.)</span></label>
                                    <input type="number" min="1" step="1" placeholder="Ilimitado"
                                        className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 shadow-sm text-sm focus:border-brand-500 focus:ring-brand-500"
                                        value={formData.usageLimit} onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Pedido mínimo <span className="text-slate-400">(opc.)</span></label>
                                    <input type="number" min="0" step="0.01" placeholder="$0.00"
                                        className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 shadow-sm text-sm focus:border-brand-500 focus:ring-brand-500"
                                        value={formData.minOrderAmount} onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Fecha de Expiración <span className="text-slate-400">(opcional)</span></label>
                                <input type="date"
                                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 shadow-sm text-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={formData.expiresAt} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Crear</button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Confirm Delete Modal */}
            <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6 w-full shadow-xl">
                        <Dialog.Title className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                            Eliminar Promoción
                        </Dialog.Title>
                        <p className="mt-2 text-sm text-slate-600">
                            ¿Estás seguro de eliminar esta promoción? Ya no podrá ser utilizada por los clientes.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => confirmDelete && handleDelete(confirmDelete)}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
}

