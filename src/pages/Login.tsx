import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data.token, data.user, data.refreshToken);
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Error al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left — Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 items-center justify-center p-12 overflow-hidden">
                {/* Subtle texture overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />

                <div className="relative z-10 max-w-sm space-y-10 text-center">
                    {/* Logo */}
                    <img src="/assets/logo-light.png" alt="Cuero Firme" className="h-20 w-auto mx-auto" />

                    <div className="space-y-4">
                        <h1 className="text-2xl font-semibold text-white leading-tight tracking-wide">
                            Panel de Administración
                        </h1>
                        <p className="text-sm text-stone-400 leading-relaxed">
                            Gestiona tu catálogo, clientes mayoristas, pedidos y facturación desde un solo lugar.
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-8 pt-4">
                        <div className="text-center">
                            <p className="text-lg font-semibold text-white">100%</p>
                            <p className="text-[10px] tracking-widest uppercase text-stone-500">Digital</p>
                        </div>
                        <div className="w-px h-8 bg-stone-700"></div>
                        <div className="text-center">
                            <p className="text-lg font-semibold text-white">IVA</p>
                            <p className="text-[10px] tracking-widest uppercase text-stone-500">Incluido</p>
                        </div>
                        <div className="w-px h-8 bg-stone-700"></div>
                        <div className="text-center">
                            <p className="text-lg font-semibold text-white">B2B</p>
                            <p className="text-[10px] tracking-widest uppercase text-stone-500">Mayoreo</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — Login Form */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-white">
                <div className="w-full max-w-md mx-auto">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-10 text-center">
                        <img src="/assets/logo-dark.png" alt="Cuero Firme" className="h-12 w-auto mx-auto" />
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-2xl font-semibold text-stone-900">
                            Bienvenido de vuelta
                        </h2>
                        <p className="text-sm text-stone-400">
                            Ingresa a tu panel de administración.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center gap-3 border border-red-200 text-red-600 px-4 py-3 text-xs" role="alert">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-[10px] tracking-widest uppercase text-stone-400 font-semibold mb-2">
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
                                className="block w-full px-3 py-3 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-[10px] tracking-widest uppercase text-stone-400 font-semibold">
                                    Contraseña
                                </label>
                                <Link to="/forgot-password" className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-900 font-medium transition-colors">
                                    ¿Olvidaste?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="block w-full px-3 py-3 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-semibold bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Ingresando...
                                </>
                            ) : 'Iniciar sesión'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-stone-400">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-stone-900 hover:underline font-semibold transition-colors">
                            Regístrate gratis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
