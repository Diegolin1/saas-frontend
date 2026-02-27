import { useState, useEffect } from 'react';
import { getPriceLists, createPriceList, getPriceListItems, upsertProductPrice, removeProductPrice, PriceList } from '../services/priceList.service';
import { Dialog } from '@headlessui/react';
import { PlusIcon, EyeIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getProducts } from '../services/product.service'; // Needed to select products

export default function PriceLists() {
    const [lists, setLists] = useState<PriceList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
    const [currentList, setCurrentList] = useState<PriceList | null>(null);
    const [listItems, setListItems] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Forms
    const [newListData, setNewListData] = useState({ name: '', currency: 'MXN' });
    const [newItemData, setNewItemData] = useState({ productId: '', price: '' });

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
                setProducts(data);
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
        } catch (error) {
            alert('Error creating list');
        }
    };

    const openItemsModal = async (list: PriceList) => {
        setCurrentList(list);
        setIsItemsModalOpen(true);
        loadProducts(); // Load all products for the dropdown
        try {
            const items = await getPriceListItems(list.id);
            setListItems(items);
        } catch (error) {
            alert('Error loading items');
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentList || !newItemData.productId || !newItemData.price) return;

        try {
            await upsertProductPrice(currentList.id, newItemData.productId, parseFloat(newItemData.price));
            // Refresh items
            const items = await getPriceListItems(currentList.id);
            setListItems(items);
            setNewItemData({ productId: '', price: '' });
        } catch (error) {
            alert('Error updating price');
        }
    };

    const handleRemoveItem = async (productId: string) => {
        if (!currentList) return;
        try {
            await removeProductPrice(currentList.id, productId);
            const items = await getPriceListItems(currentList.id);
            setListItems(items);
        } catch (error) {
            alert('Error removing price');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Listas de Precios</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Gestiona listas de precios alternativas para clientes mayoristas o especiales.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        <PlusIcon className="h-5 w-5 inline-block -mt-1 mr-1" />
                        Nueva Lista
                    </button>
                </div>
            </div>

            <div className="mt-8 flow-root">
                <ul className="divide-y divide-gray-200 bg-white shadow rounded-lg">
                    {lists.map((list) => (
                        <li key={list.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{list.name}</h3>
                                <p className="text-sm text-gray-500">{list.currency} {list.isDefault ? '(Predeterminada)' : ''}</p>
                            </div>
                            <button
                                onClick={() => openItemsModal(list)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-sm font-medium"
                            >
                                <EyeIcon className="h-4 w-4" /> Ver Precios
                            </button>
                        </li>
                    ))}
                </ul>
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
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Crear</button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Manage Items Modal */}
            <Dialog open={isItemsModalOpen} onClose={() => setIsItemsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl rounded bg-white p-6 w-full shadow-xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-medium">Precios: {currentList?.name}</Dialog.Title>
                            <button onClick={() => setIsItemsModalOpen(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
                        </div>

                        {/* Add Item Form */}
                        <form onSubmit={handleAddItem} className="mb-6 p-4 bg-gray-50 rounded-lg flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                                <select className="block w-full rounded border-gray-300 border p-2 sm:text-sm"
                                    value={newItemData.productId} onChange={e => setNewItemData({ ...newItemData, productId: e.target.value })}>
                                    <option value="">Selecciona un producto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Precio</label>
                                <input type="number" step="0.01" className="block w-full rounded border-gray-300 border p-2 sm:text-sm"
                                    value={newItemData.price} onChange={e => setNewItemData({ ...newItemData, price: e.target.value })} />
                            </div>
                            <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        </form>

                        {/* Items List */}
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                        <th className="relative px-6 py-3"><span className="sr-only">Delete</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {listItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(item.price).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleRemoveItem(item.productId)} className="text-red-600 hover:text-red-900">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
}
