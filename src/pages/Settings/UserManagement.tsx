import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, User } from '../../services/user.service';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'SELLER' });
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createUser(formData);
            setIsModalOpen(false);
            setFormData({ fullName: '', email: '', password: '', role: 'SELLER' });
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error creating user');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await deleteUser(id);
                fetchUsers();
            } catch (err) {
                alert('Error deleting user');
            }
        }
    };

    if (loading) return <div>Cargando usuarios...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Gestión de Usuarios</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Nuevo Usuario
                </button>
            </div>

            <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                    <li key={user.id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {user.fullName.charAt(0)}
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-indigo-600">{user.fullName}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${user.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'}`}>
                                {user.role}
                            </span>
                            {/* Don't allow deleting Owners for now for safety in this UI */}
                            {user.role !== 'OWNER' && (
                                <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-600">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {/* Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 w-full shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-medium">Nuevo Usuario</Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
                        </div>

                        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                                <input type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rol</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="SELLER">Vendedor</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                </select>
                            </div>
                            <div className="mt-5 sm:mt-6">
                                <button type="submit" className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none sm:text-sm">
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default UserManagement;
