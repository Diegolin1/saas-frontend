import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'ShowRoom B2B';
const LOGO_DARK = import.meta.env.VITE_LOGO_DARK_URL || null;

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validate = (): string | null => {
        if (newPassword.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        if (!/[A-Z]/.test(newPassword)) return 'Debe incluir al menos una mayúscula.';
        if (!/[0-9]/.test(newPassword)) return 'Debe incluir al menos un número.';
        if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden.';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) { setError(validationError); return; }
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center space-y-4">
                    <p className="text-red-600 font-semibold">Enlace inválido.</p>
                    <Link to="/forgot-password" className="text-brand-500 hover:underline text-sm">Solicitar nuevo enlace</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        {LOGO_DARK ? (
                            <img src={LOGO_DARK} alt={APP_NAME} className="h-10 mx-auto" />
                        ) : (
                            <h1 className="text-2xl font-display font-bold text-brand-900">{APP_NAME}</h1>
                        )}
                    </div>

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">¡Contraseña restablecida!</h2>
                            <p className="text-slate-500 text-sm">
                                Tu contraseña ha sido actualizada. Serás redirigido al inicio de sesión en un momento…
                            </p>
                            <Link to="/login" className="inline-block mt-2 text-brand-500 hover:text-brand-600 font-semibold text-sm transition-colors">
                                Ir a iniciar sesión →
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-8">
                                <h2 className="text-2xl font-display font-bold text-slate-900">
                                    Nueva contraseña
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    Crea una contraseña segura con al menos 8 caracteres, una mayúscula y un número.
                                </p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
                                        <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Nueva contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            type={showPass ? 'text' : 'password'}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="block w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            tabIndex={-1}
                                            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPass ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Confirmar contraseña
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Guardando...
                                        </>
                                    ) : 'Restablecer contraseña'}
                                </button>
                            </form>
                        </>
                    )}

                    <p className="mt-8 text-center text-sm text-slate-500">
                        <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                            ← Volver a iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
