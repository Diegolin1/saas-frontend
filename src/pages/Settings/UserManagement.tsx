import { useState, useEffect } from 'react';
import { SkeletonPage } from '../../components/Skeleton';
import { getUsers, createUser, updateUser, deleteUser, User, PaginationInfo } from '../../services/user.service';
import { getErrorMessage } from '../../services/api';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';

const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    SELLER: 'Vendedor',
    BUYER: 'Comprador',
};

const ROLE_COLORS: Record<string, string> = {
    OWNER: 'bg-stone-900 text-white',
    ADMIN: 'bg-stone-700 text-white',
    SUPERVISOR: 'bg-amber-100 text-amber-800',
    SELLER: 'bg-emerald-50 text-emerald-700',
    BUYER: 'bg-slate-100 text-slate-600',
};

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'SELLER' as 'OWNER' | 'ADMIN' | 'SUPERVISOR' | 'SELLER' | 'BUYER' });
    const [error, setError] = useState('');
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const canEditRole = currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsers({ page });
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createUser(formData);
            setIsModalOpen(false);
            setFormData({ fullName: '', email: '', password: '', role: 'SELLER' as const });
            fetchUsers();
            showToast('Usuario creado correctamente', 'success');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al crear el usuario.'));
        }
    };

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        setUpdatingRole(userId);
        try {
            await updateUser(userId, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast('Rol actualizado correctamente', 'success');
        } catch (err: unknown) {
            showToast(getErrorMessage(err, 'Error al cambiar el rol.'), 'error');
        } finally {
            setUpdatingRole(null);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteUser(id);
            fetchUsers();
            showToast('Usuario eliminado correctamente', 'success');
        } catch (err: unknown) {
            showToast(getErrorMessage(err, 'Error al eliminar el usuario.'), 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    if (loading) return <SkeletonPage />;

    return (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200">
            <div className="px-6 py-5 flex justify-between items-center border-b border-slate-200">
                <div>
                    <h3 className="text-lg font-display font-bold text-stone-900">Gestión de Usuarios</h3>
                    <p className="text-sm text-stone-500 mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} en tu empresa</p>
                </div>
                {canEditRole && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg shadow-sm text-white bg-stone-900 hover:bg-stone-800 transition-colors"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Nuevo Usuario
                    </button>
                )}
            </div>

            <ul className="divide-y divide-slate-100">
                {users.map((user) => (
                    <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                        <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 font-bold text-sm">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4 min-w-0">
                                <div className="text-sm font-semibold text-stone-900 truncate">{user.fullName}</div>
                                <div className="text-xs text-stone-400 truncate">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {canEditRole && user.role !== 'OWNER' ? (
                                <div className="relative">
                                    <select
                                        value={user.role}
                                        disabled={updatingRole === user.id}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                                        className="text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-stone-400 cursor-pointer disabled:opacity-50 transition-colors"
                                    >
                                        <option value="ADMIN">Administrador</option>
                                        <option value="SUPERVISOR">Supervisor</option>
                                        <option value="SELLER">Vendedor</option>
                                        <option value="BUYER">Comprador</option>
                                    </select>
                                    {updatingRole === user.id && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs animate-spin">⟳</span>
                                    )}
                                </div>
                            ) : (
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700'}`}>
                                    {ROLE_LABELS[user.role] || user.role}
                                </span>
                            )}
                            {user.role !== 'OWNER' && user.id !== currentUser?.id && canEditRole && (
                                <button onClick={() => setConfirmDelete(user.id)} className="text-stone-300 hover:text-red-500 transition-colors" title="Eliminar usuario">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {pagination && (
                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={setPage}
                />
            )}

            {/* Create User Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6 w-full shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-lg font-display font-bold text-stone-900">Nuevo Usuario</Dialog.Title>
                            <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="h-6 w-6 text-stone-400 hover:text-stone-600" /></button>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Nombre Completo</label>
                                <input type="text" required className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-stone-400 focus:ring-stone-400 sm:text-sm border p-2.5"
                                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Email</label>
                                <input type="email" required className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-stone-400 focus:ring-stone-400 sm:text-sm border p-2.5"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Contraseña <span className="text-stone-400 font-normal">(mín. 6 caracteres)</span></label>
                                <input type="password" required minLength={6} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-stone-400 focus:ring-stone-400 sm:text-sm border p-2.5"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Rol</label>
                                <select className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-stone-400 focus:ring-stone-400 sm:text-sm border p-2.5"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as User['role'] })}>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                    <option value="SELLER">Vendedor</option>
                                    <option value="BUYER">Comprador</option>
                                </select>
                            </div>
                            <div className="mt-5 sm:mt-6">
                                <button type="submit" className="inline-flex w-full justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors">
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Confirm Delete Modal */}
            <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6 w-full shadow-xl">
                        <Dialog.Title className="text-lg font-display font-bold text-stone-900 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                            Eliminar Usuario
                        </Dialog.Title>
                        <p className="mt-2 text-sm text-stone-600">
                            ¿Estás seguro de eliminar este usuario? Pierden su acceso inmediatamente.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm font-semibold text-stone-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
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
};

export default UserManagement;
