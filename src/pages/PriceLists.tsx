import { useState, useEffect } from 'react';
import { SkeletonPage } from '../components/Skeleton';
import { getPriceLists, createPriceList, deletePriceList, getPriceListItems, upsertProductPrice, removeProductPrice, PriceList } from '../services/priceList.service';
import { getErrorMessage } from '../services/api';
import { Dialog } from '@headlessui/react';
import { PlusIcon, EyeIcon, XMarkIcon, TrashIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getProducts } from '../services/product.service';
import { useToast } from '../context/ToastContext';

const formatMXN = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export default function PriceLists() {
    const { showToast } = useToast();
    const [lists, setLists] = useState<PriceList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
    const [currentList, setCurrentList] = useState<PriceList | null>(null);
    const [listItems, setListItems] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<PriceList | null>(null);

    // Forms
    const [newListData, setNewListData] = useState({ name: '', currency: 'MXN' });
    const [newItemData, setNewItemData] = useState({ productId: '', price: '' });
    const [priceError, setPriceError] = useState('');
    const [productSearch, setProductSearch] = useState('');

    const loadLists = async () => {
        try {
            const data = await getPriceLists();
            setLists(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        if (products.length === 0) {
            try {
                const data = await getProducts();
                setProducts(data.products ?? []);
            } catch (e) { console.error(e); }
        }
    }

    useEffect(() => {
        loadLists();
    }, []);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPriceList(newListData);
            setIsCreateModalOpen(false);
            setNewListData({ name: '', currency: 'MXN' });
            loadLists();
            showToast('Lista de precios creada correctamente', 'success');
        } catch (error) {
            showToast(getErrorMessage(error, 'Error al crear la lista'), 'error');
        }
    };

    const openItemsModal = async (list: PriceList) => {
        setCurrentList(list);
        setIsItemsModalOpen(true);
        loadProducts();
        try {
            const items = await getPriceListItems(list.id);
            setListItems(items);
        } catch (error) {
            showToast('Error al cargar los precios', 'error');
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setPriceError('');
        if (!currentList || !newItemData.productId) return;
        const priceNum = parseFloat(newItemData.price);
        if (!newItemData.price || isNaN(priceNum) || priceNum <= 0) {
            setPriceError('El precio debe ser mayor a $0');
            return;
        }
        if (priceNum > 99_999_999) {
            setPriceError('El precio excede el límite permitido');
            return;
        }

        try {
            await upsertProductPrice(currentList.id, newItemData.productId, priceNum);
            const items = await getPriceListItems(currentList.id);
            setListItems(items);
            setNewItemData({ productId: '', price: '' });
            showToast('Precio actualizado correctamente', 'success');
        } catch (error) {
            showToast(getErrorMessage(error, 'Error al actualizar el precio'), 'error');
        }
    };

    const handleRemoveItem = async (productId: string) => {
        if (!currentList) return;
        try {
            await removeProductPrice(currentList.id, productId);
            const items = await getPriceListItems(currentList.id);
            setListItems(items);
            showToast('Precio eliminado', 'success');
        } catch (error) {
            showToast(getErrorMessage(error, 'Error al eliminar el precio'), 'error');
        }
    };

    const handleDeleteList = async (list: PriceList) => {
        if (list.isDefault) {
            showToast('No se puede eliminar la lista predeterminada.', 'warning');
            setConfirmDelete(null);
            return;
        }
        try {
            await deletePriceList(list.id);
            loadLists();
            showToast('Lista eliminada correctamente', 'success');
        } catch (err: unknown) {
            showToast(getErrorMessage(err, 'Error al eliminar la lista.'), 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    if (loading) return <SkeletonPage />;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-display font-bold text-stone-900">Listas de Precios</h1>
                    <p className="mt-1 text-sm text-stone-500">Gestiona tus listas de precios mayoristas.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-stone-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nueva Lista
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {lists.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-stone-600 font-medium">No hay listas de precios aún.</p>
                        <p className="text-stone-400 text-sm mt-1">Crea tu primera lista para asignar precios especiales a tus productos.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5">
                        {lists.map((list) => (
                            <li key={list.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {list.name}
                                        {list.isDefault && (
                                            <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                Predeterminada
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">Moneda: {list.currency}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openItemsModal(list)}
                                        className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                        Ver Precios
                                    </button>
                                    {!list.isDefault && (
                                        <button
                                            onClick={() => setConfirmDelete(list)}
                                            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50"
                                            title="Eliminar lista"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Create List Modal */}
            <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 w-full shadow-xl">
                        <Dialog.Title className="text-lg font-medium mb-4">Nueva Lista de Precios</Dialog.Title>
                        <form onSubmit={handleCreateList} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input type="text" required className="mt-1 block w-full rounded border-gray-300 border p-2 shadow-sm"
                                    value={newListData.name} onChange={e => setNewListData({ ...newListData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Moneda</label>
                                <select className="mt-1 block w-full rounded border-gray-300 border p-2 shadow-sm"
                                    value={newListData.currency} onChange={e => setNewListData({ ...newListData, currency: e.target.value })}>
                                    <option value="MXN">MXN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-stone-700 hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 transition-colors">Crear</button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Manage Items Modal */}
            <Dialog open={isItemsModalOpen} onClose={() => { setIsItemsModalOpen(false); setProductSearch(''); setPriceError(''); }} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl rounded-xl bg-white p-6 w-full shadow-xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-semibold text-gray-900">Precios: {currentList?.name}</Dialog.Title>
                            <button onClick={() => { setIsItemsModalOpen(false); setProductSearch(''); setPriceError(''); }} className="rounded-md p-1 hover:bg-gray-100">
                                <XMarkIcon className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Add Item Form */}
                        <form onSubmit={handleAddItem} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agregar / actualizar precio</p>
                            {/* Product search filter */}
                            <div className="relative">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    className="block w-full rounded border border-gray-300 py-2 pl-8 pr-3 text-sm"
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                                    <select
                                        required
                                        className="block w-full rounded border-gray-300 border p-2 text-sm"
                                        value={newItemData.productId}
                                        onChange={e => setNewItemData({ ...newItemData, productId: e.target.value })}
                                    >
                                        <option value="">Selecciona un producto...</option>
                                        {products
                                            .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="w-full sm:w-36">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Precio ({currentList?.currency})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0.00"
                                        className={`block w-full rounded border p-2 text-sm ${priceError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300'
                                            }`}
                                        value={newItemData.price}
                                        onChange={e => { setNewItemData({ ...newItemData, price: e.target.value }); setPriceError(''); }}
                                    />
                                    {priceError && <p className="mt-1 text-xs text-red-600">{priceError}</p>}
                                </div>
                                <button type="submit" className="flex items-center gap-1 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 text-sm font-medium whitespace-nowrap">
                                    <PlusIcon className="h-4 w-4" />
                                    Guardar
                                </button>
                            </div>
                        </form>

                        {/* Items List */}
                        <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
                            {listItems.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">No hay precios configurados aún.</div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                                            <th className="relative px-4 py-3"><span className="sr-only">Eliminar</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {listItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{item.product.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.product.sku}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatMXN(Number(item.price))}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Eliminar precio">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
                            Eliminar Lista de Precios
                        </Dialog.Title>
                        <p className="mt-2 text-sm text-slate-600">
                            ¿Eliminar la lista "{confirmDelete?.name}" y todos sus precios asociados? Esta acción es irreversible.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => confirmDelete && handleDeleteList(confirmDelete)}
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
