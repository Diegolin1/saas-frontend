import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, Customer } from '../services/customer.service';
import { getPriceLists, PriceList } from '../services/priceList.service';
import { getUsers, User } from '../services/user.service'; // Import user service
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'; // Added UserIcon

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [users, setUsers] = useState<User[]>([]); // State for users
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);
    const [formData, setFormData] = useState<Partial<Customer>>({
        businessName: '',
        taxId: '',
        code: '',
        creditLimit: 0,
        priceListId: '',
        sellerId: '' // Added sellerId
    });

    const loadData = async () => {
        try {
            const [customersData, priceListsData, usersData] = await Promise.all([
                getCustomers(),
                getPriceLists(),
                getUsers()
            ]);
            setCustomers(customersData);
            setPriceLists(priceListsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openModal = (customer?: Customer) => {
        if (customer) {
            setCurrentCustomer(customer);
            setFormData({
                businessName: customer.businessName,
                taxId: customer.taxId || '',
                code: customer.code || '',
                creditLimit: customer.creditLimit,
                priceListId: customer.priceListId || '',
                sellerId: customer.sellerId || '' // Populating sellerId
            });
        } else {
            setCurrentCustomer(null);
            setFormData({
                businessName: '',
                taxId: '',
                code: '',
                creditLimit: 0,
                priceListId: '',
                sellerId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentCustomer?.id) {
                await updateCustomer(currentCustomer.id, formData);
            } else {
                await createCustomer(formData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            alert('Error saving customer');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            try {
                await deleteCustomer(id);
                loadData();
            } catch (error) {
                alert('Error deleting customer');
            }
        }
    };

    // Filter potential sellers (Owner, Admin, Supervisor, Seller)
    const potentialSellers = users.filter(u => ['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER'].includes(u.role));

    if (loading) return <div>Loading...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Lista de clientes registrados, sus listas de precios y límites de crédito.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        <PlusIcon className="h-5 w-5 inline-block -mt-1 mr-1" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Razón Social</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">RFC</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vendedor</th> {/* Added Seller Column */}
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Lista Precio</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Crédito</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4 text-gray-500">No hay clientes registrados.</td>
                                        </tr>
                                    ) : customers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {customer.businessName}
                                                <div className="text-gray-500 font-normal text-xs">{customer.code}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{customer.taxId || '-'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {/* Display Seller Name */}
                                                {(customer as any).seller?.fullName ? (
                                                    <div className="flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3 text-gray-400" />
                                                        {(customer as any).seller.fullName}
                                                    </div>
                                                ) : <span className="text-gray-400 italic">Sin asignar</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    {customer.priceList?.name || 'Base'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${customer.creditLimit?.toLocaleString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button onClick={() => openModal(customer)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-lg rounded bg-white p-6 w-full shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-medium">
                                {currentCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)}>
                                <XMarkIcon className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Código</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Ej. C-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RFC</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={formData.taxId}
                                        onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Razón Social</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={formData.businessName}
                                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                />
                            </div>

                            {/* Seller Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vendedor Asignado</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={formData.sellerId}
                                    onChange={e => setFormData({ ...formData, sellerId: e.target.value })}
                                >
                                    <option value="">-- Sin Asignar --</option>
                                    {potentialSellers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.fullName} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Límite de Crédito</label>
                                    <input
                                        type="number"
                                        className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={formData.creditLimit}
                                        onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lista de Precios</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={formData.priceListId}
                                        onChange={e => setFormData({ ...formData, priceListId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {priceLists.map(pl => (
                                            <option key={pl.id} value={pl.id}>{pl.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
}
