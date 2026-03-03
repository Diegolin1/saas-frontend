import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, User } from '../../services/user.service';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    SELLER: 'Vendedor',
    BUYER: 'Comprador',
};

const ROLE_COLORS: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    SUPERVISOR: 'bg-indigo-100 text-indigo-800',
    SELLER: 'bg-green-100 text-green-800',
    BUYER: 'bg-gray-100 text-gray-700',
};

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'SELLER' });
    const [error, setError] = useState('');
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    const canEditRole = currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';

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
            setError(err.response?.data?.error || 'Error al crear el usuario.');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingRole(userId);
        try {
            await updateUser(userId, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al cambiar el rol.');
        } finally {
            setUpdatingRole(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await deleteUser(id);
                fetchUsers();
            } catch (err: any) {
                alert(err.response?.data?.error || 'Error al eliminar el usuario.');
            }
        }
    };

    if (loading) return <div className="p-6 text-sm text-gray-500">Cargando usuarios...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Gestión de Usuarios</h3>
                    <p className="text-sm text-gray-500 mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} en tu empresa</p>
                </div>
                {canEditRole && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Nuevo Usuario
                    </button>
                )}
            </div>

            <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                    <li key={user.id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 gap-4">
                        <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{user.fullName}</div>
                                <div className="text-sm text-gray-500 truncate">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Role: editable select for OWNER/ADMIN, badge otherwise */}
                            {canEditRole && user.role !== 'OWNER' ? (
                                <div className="relative">
                                    <select
                                        value={user.role}
                                        disabled={updatingRole === user.id}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 px-3 py-1 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="ADMIN">Administrador</option>
                                        <option value="SUPERVISOR">Supervisor</option>
                                        <option value="SELLER">Vendedor</option>
                                        <option value="BUYER">Comprador</option>
                                    </select>
                                    {updatingRole === user.id && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-spin">⟳</span>
                                    )}
                                </div>
                            ) : (
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}`}>
                                    {ROLE_LABELS[user.role] || user.role}
                                </span>
                            )}
                            {/* Delete — not for OWNER, not yourself */}
                            {user.role !== 'OWNER' && user.id !== currentUser?.id && canEditRole && (
                                <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-600" title="Eliminar usuario">
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

                        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}

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
                                <label className="block text-sm font-medium text-gray-700">Contraseña <span className="text-gray-400 font-normal">(mín. 6 caracteres)</span></label>
                                <input type="password" required minLength={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rol</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                    <option value="SELLER">Vendedor</option>
                                    <option value="BUYER">Comprador</option>
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
