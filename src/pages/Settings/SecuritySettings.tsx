import { useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function SecuritySettings() {
    const { showToast } = useToast();
    const { logout } = useAuth();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, newPw: false, confirm: false });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.currentPassword) e.currentPassword = 'La contraseña actual es requerida.';
        if (!form.newPassword) e.newPassword = 'La nueva contraseña es requerida.';
        else if (form.newPassword.length < 8) e.newPassword = 'Mínimo 8 caracteres.';
        else if (!/[A-Z]/.test(form.newPassword)) e.newPassword = 'Debe incluir al menos una mayúscula.';
        else if (!/[0-9]/.test(form.newPassword)) e.newPassword = 'Debe incluir al menos un número.';
        if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await api.put('/auth/password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });
            showToast('Contraseña actualizada. Inicia sesión de nuevo.', 'success');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            // Logout after 1.5s so the user sees the success message
            setTimeout(() => logout(), 1500);
        } catch (err) {
            showToast(getErrorMessage(err, 'Error al cambiar la contraseña.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const PasswordInput = ({
        id, label, value, fieldKey, showKey
    }: {
        id: string;
        label: string;
        value: string;
        fieldKey: 'currentPassword' | 'newPassword' | 'confirmPassword';
        showKey: 'current' | 'newPw' | 'confirm';
    }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="relative mt-1">
                <input
                    id={id}
                    type={showPasswords[showKey] ? 'text' : 'password'}
                    value={value}
                    onChange={e => { setForm({ ...form, [fieldKey]: e.target.value }); setErrors({ ...errors, [fieldKey]: '' }); }}
                    className={`block w-full rounded-lg border pr-10 p-2.5 shadow-sm text-sm focus:ring-brand-500 focus:border-brand-500 ${
                        errors[fieldKey] ? 'border-red-400' : 'border-gray-300'
                    }`}
                    autoComplete={fieldKey === 'currentPassword' ? 'current-password' : 'new-password'}
                />
                <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                >
                    {showPasswords[showKey] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
            </div>
            {errors[fieldKey] && <p className="mt-1 text-xs text-red-600">{errors[fieldKey]}</p>}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <LockClosedIcon className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">Cambiar Contraseña</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Mínimo 8 caracteres, al menos una mayúscula y un número. Al guardar se cerrará la sesión.
                    </p>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-4 max-w-md">
                    <PasswordInput id="currentPw" label="Contraseña actual" value={form.currentPassword} fieldKey="currentPassword" showKey="current" />
                    <PasswordInput id="newPw" label="Nueva contraseña" value={form.newPassword} fieldKey="newPassword" showKey="newPw" />
                    <PasswordInput id="confirmPw" label="Confirmar nueva contraseña" value={form.confirmPassword} fieldKey="confirmPassword" showKey="confirm" />
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
            </div>
        </form>
    );
}
