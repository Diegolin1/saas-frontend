import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, Customer, PaginationInfo } from '../services/customer.service';
import { getPriceLists, PriceList } from '../services/priceList.service';
import { getUsers, User } from '../services/user.service';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { formatMXN } from '../utils/format';

const MEXICAN_STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

// RFC validation: 3-4 letters + 6 digits (date) + 3 alphanumerics (homoclave)
function isValidRFC(rfc: string): boolean {
    if (!rfc) return true; // Optional field
    const pattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    return pattern.test(rfc.toUpperCase());
}

interface AddressForm {
    street: string;
    extNumber: string;
    intNumber: string;
    neighborhood: string;
    zipCode: string;
    city: string;
    state: string;
}

export default function Customers() {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [users, setUsers] = useState<User[]>([]); // State for users
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [formData, setFormData] = useState<Partial<Customer>>({
        businessName: '',
        taxId: '',
        code: '',
        creditLimit: 0,
        priceListId: '',
        sellerId: ''
    });
    const [addressForm, setAddressForm] = useState<AddressForm>({
        street: '', extNumber: '', intNumber: '', neighborhood: '', zipCode: '', city: '', state: ''
    });
    const [rfcError, setRfcError] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [customersRes, priceListsData, usersRes] = await Promise.all([
                getCustomers({ page, search: searchDebounce || undefined }),
                getPriceLists(),
                getUsers({ limit: 100 })
            ]);
            setCustomers(customersRes.customers);
            setPagination(customersRes.pagination);
            setPriceLists(priceListsData);
            setUsers(usersRes.users);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, searchDebounce]);

    const openModal = (customer?: Customer) => {
        setRfcError('');
        if (customer) {
            setCurrentCustomer(customer);
            setFormData({
                businessName: customer.businessName,
                taxId: customer.taxId || '',
                code: customer.code || '',
                creditLimit: customer.creditLimit,
                priceListId: customer.priceListId || '',
                sellerId: customer.sellerId || ''
            });
            const addr = (customer.shippingAddress || {}) as Record<string, string>;
            setAddressForm({
                street: addr.street || '',
                extNumber: addr.extNumber || '',
                intNumber: addr.intNumber || '',
                neighborhood: addr.neighborhood || '',
                zipCode: addr.zipCode || '',
                city: addr.city || '',
                state: addr.state || ''
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
            setAddressForm({ street: '', extNumber: '', intNumber: '', neighborhood: '', zipCode: '', city: '', state: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRfcError('');

        // Validate RFC if provided
        if (formData.taxId && !isValidRFC(formData.taxId)) {
            setRfcError('RFC inválido. Formato: 3-4 letras + 6 dígitos + 3 caracteres (Ej. XAXX010101000)');
            return;
        }

        // Build shippingAddress from structured fields
        const hasAddress = Object.values(addressForm).some(v => v.trim() !== '');
        const shippingAddress = hasAddress ? { ...addressForm } : undefined;

        try {
            const payload = {
                ...formData,
                taxId: formData.taxId ? formData.taxId.toUpperCase().trim() : '',
                shippingAddress
            };
            if (currentCustomer?.id) {
                await updateCustomer(currentCustomer.id, payload);
                showToast('Cliente actualizado correctamente', 'success');
            } else {
                await createCustomer(payload);
                showToast('Cliente creado correctamente', 'success');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            showToast(getErrorMessage(error, 'Error al guardar el cliente'), 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            try {
                await deleteCustomer(id);
                showToast('Cliente eliminado correctamente', 'success');
                loadData();
            } catch (error) {
                showToast('Error al eliminar el cliente', 'error');
            }
        }
    };

    // Filter potential sellers (Owner, Admin, Supervisor, Seller)
    const potentialSellers = users.filter(u => ['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER'].includes(u.role));

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;

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
            {/* Búsqueda */}
            <div className="mt-4">
                <input
                    type="text"
                    placeholder="Buscar por razón social, email o código..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
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
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatMXN(customer.creditLimit, false)}</td>
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
            {pagination && (
                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={setPage}
                />
            )}

            {/* Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                    <Dialog.Panel className="mx-auto max-w-2xl rounded-xl bg-white p-6 w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <Dialog.Title className="text-lg font-display font-bold text-slate-900">
                                {currentCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)}>
                                <XMarkIcon className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Basic info */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Razón Social *</label>
                                <input
                                    type="text" required
                                    className="mt-1 block w-full rounded-lg border-slate-200 border p-2.5 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                    value={formData.businessName}
                                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Código</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-lg border-slate-200 border p-2.5 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Ej. C-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">RFC</label>
                                    <input
                                        type="text" maxLength={13}
                                        className={`mt-1 block w-full rounded-lg border p-2.5 shadow-sm focus:ring-brand-500 sm:text-sm uppercase ${rfcError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500'}`}
                                        value={formData.taxId}
                                        onChange={e => { setFormData({ ...formData, taxId: e.target.value.toUpperCase() }); setRfcError(''); }}
                                        placeholder="XAXX010101000"
                                    />
                                    {rfcError && <p className="mt-1 text-xs text-red-600">{rfcError}</p>}
                                </div>
                            </div>

                            {/* Seller + Price List */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Vendedor Asignado</label>
                                    <select
                                        className="mt-1 block w-full rounded-lg border-slate-200 border p-2.5 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                        value={formData.sellerId}
                                        onChange={e => setFormData({ ...formData, sellerId: e.target.value })}
                                    >
                                        <option value="">— Sin Asignar —</option>
                                        {potentialSellers.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Lista de Precios</label>
                                    <select
                                        className="mt-1 block w-full rounded-lg border-slate-200 border p-2.5 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
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

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Límite de Crédito (MXN)</label>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-400 text-sm">$</span></div>
                                    <input
                                        type="number" min="0"
                                        className="block w-full rounded-lg border-slate-200 border pl-7 p-2.5 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                        value={formData.creditLimit}
                                        onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Structured Mexican Address */}
                            <div className="border-t border-slate-200 pt-5">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Dirección de Envío</h4>
                                <div className="grid grid-cols-6 gap-3">
                                    <div className="col-span-4">
                                        <label className="block text-xs font-medium text-slate-600">Calle</label>
                                        <input type="text" className="mt-1 block w-full rounded-lg border-slate-200 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                            value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-medium text-slate-600">No. Ext</label>
                                        <input type="text" className="mt-1 block w-full rounded-lg border-slate-200 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                            value={addressForm.extNumber} onChange={e => setAddressForm({ ...addressForm, extNumber: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-medium text-slate-600">No. Int</label>
                                        <input type="text" className="mt-1 block w-full rounded-lg border-slate-200 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                            value={addressForm.intNumber} onChange={e => setAddressForm({ ...addressForm, intNumber: e.target.value })} />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-slate-600">Colonia</label>
                                        <input type="text" className="mt-1 block w-full rounded-lg border-slate-200 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                            value={addressForm.neighborhood} onChange={e => setAddressForm({ ...addressForm, neighborhood: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-medium text-slate-600">C.P.</label>
                                        <input type="text" maxLength={5} className="mt-1 block w-full rounded-lg border-slate-200 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                            value={addressForm.zipCode} onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-600">Ciudad / Municipio</label>
                                        <input type="text" className="mt-1 block w-full rounded-lg border-slate-200 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                            value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-slate-600">Estado</label>
                                        <select className="mt-1 block w-full rounded-lg border-slate-200 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                            value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}>
                                            <option value="">Seleccionar estado...</option>
                                            {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        {/* Spacer for alignment */}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                                    Cancelar
                                </button>
                                <button type="submit"
                                    className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600 transition-all">
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
