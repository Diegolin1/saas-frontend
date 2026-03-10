import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'ShowRoom B2B';
const LOGO_DARK = import.meta.env.VITE_LOGO_DARK_URL || null;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al enviar el correo. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        {LOGO_DARK ? (
                            <img src={LOGO_DARK} alt={APP_NAME} className="h-10 mx-auto" />
                        ) : (
                            <h1 className="text-2xl font-display font-bold text-brand-900">{APP_NAME}</h1>
                        )}
                    </div>

                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Revisa tu correo</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
                            </p>
                            <p className="text-xs text-slate-400">Revisa también tu carpeta de spam.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-8">
                                <h2 className="text-2xl font-display font-bold text-slate-900">
                                    ¿Olvidaste tu contraseña?
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    Ingresa tu correo y te enviaremos un enlace para restablecerla.
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
                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Correo electrónico
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@empresa.com"
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
                                            Enviando...
                                        </>
                                    ) : 'Enviar enlace'}
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

export default ForgotPassword;
