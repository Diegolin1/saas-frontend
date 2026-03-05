import { useState, useEffect } from 'react';
import { getPromotions, createPromotion, updatePromotion, deletePromotion, Promotion } from '../services/promotion.service';
import { getErrorMessage } from '../services/api';
import { Dialog } from '@headlessui/react';
import { PlusIcon, TrashIcon, XMarkIcon, GiftIcon } from '@heroicons/react/24/outline';

export default function Promotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ code: '', discount: '', type: 'PERCENTAGE', expiresAt: '' });
    const [error, setError] = useState('');

    const loadData = async () => {
        try {
            const data = await getPromotions();
            setPromotions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createPromotion({
                code: formData.code,
                discount: parseFloat(formData.discount),
                type: formData.type,
                expiresAt: formData.expiresAt || undefined
            });
            setIsModalOpen(false);
            setFormData({ code: '', discount: '', type: 'PERCENTAGE', expiresAt: '' });
            loadData();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al crear la promoción'));
        }
    };

    const handleToggle = async (promo: Promotion) => {
        try {
            await updatePromotion(promo.id, { isActive: !promo.isActive });
            setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p));
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Error al actualizar'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar esta promoción?')) return;
        try {
            await deletePromotion(id);
            loadData();
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Error al eliminar'));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando promociones...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Promociones y Cupones</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Crea códigos de descuento para tus clientes mayoristas.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nueva Promoción
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {promotions.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <GiftIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No hay promociones creadas.</p>
                        <p className="text-gray-400 text-sm mt-1">Crea tu primer cupón de descuento.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Código</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descuento</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expira</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {promotions.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono font-bold text-gray-900 sm:pl-6">
                                            {promo.code}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 font-semibold">
                                            {promo.type === 'PERCENTAGE' ? `${promo.discount}%` : `$${Number(promo.discount).toLocaleString('es-MX')}`}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {promo.type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto Fijo'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('es-MX') : 'Sin expiración'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <button
                                                onClick={() => handleToggle(promo)}
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-colors ${promo.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                            >
                                                {promo.isActive ? 'Activa' : 'Inactiva'}
                                            </button>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button
                                                onClick={() => handleDelete(promo.id)}
                                                className="text-red-400 hover:text-red-600"
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
                    <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 w-full shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-medium">Nueva Promoción</Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Código</label>
                                <input type="text" required placeholder="Ej. VERANO2026"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm uppercase text-sm"
                                    value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Descuento</label>
                                    <input type="number" step="0.01" required min="0.01"
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm"
                                        value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                    <select className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm"
                                        value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="PERCENTAGE">Porcentaje (%)</option>
                                        <option value="FIXED">Monto Fijo ($)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha de Expiración <span className="text-gray-400">(opcional)</span></label>
                                <input type="date"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm"
                                    value={formData.expiresAt} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium">Crear</button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
}
