import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        adminName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', {
                companyName: formData.companyName,
                adminName: formData.adminName,
                email: formData.email,
                password: formData.password
            });
            login(data.token, data.user);
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Error al registrar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left — Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(0,82,255,0.25),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.15),transparent_50%)]" />
                <div className="relative z-10 max-w-md space-y-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                        <svg className="w-10 h-10 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-white leading-tight">
                        Crea tu Showroom<br /><span className="text-gold-400">en minutos</span>
                    </h1>
                    <p className="text-lg text-brand-200 leading-relaxed">
                        Digitaliza tu catálogo, recibe pedidos 24/7 y haz crecer tu negocio mayorista con la plataforma líder para fabricantes.
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <p className="text-xl font-bold text-gold-400">Gratis</p>
                            <p className="text-xs text-brand-300 mt-1">Para empezar</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <p className="text-xl font-bold text-white">MXN</p>
                            <p className="text-xs text-brand-300 mt-1">Pesos + IVA</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <p className="text-xl font-bold text-white">24/7</p>
                            <p className="text-xs text-brand-300 mt-1">Pedidos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — Register Form */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-white">
                <div className="w-full max-w-md mx-auto">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-6 text-center">
                        <h2 className="text-2xl font-display font-bold text-brand-900">
                            Show<span className="text-gold-500">Room</span>
                        </h2>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-3xl font-display font-bold text-slate-900">
                            Crea tu cuenta
                        </h2>
                        <p className="text-slate-500">
                            Configura tu showroom en menos de 2 minutos.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
                                <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre de la Empresa</label>
                            <input name="companyName" type="text" required value={formData.companyName} onChange={handleChange} placeholder="Ej. Calzado León SA de CV" className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tu Nombre Completo</label>
                            <input name="adminName" type="text" required value={formData.adminName} onChange={handleChange} placeholder="Ej. Juan Pérez" className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo Electrónico</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="tu@empresa.com" className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña</label>
                                <input name="password" type="password" required minLength={8} value={formData.password} onChange={handleChange} placeholder="Mín. 8 caracteres" className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar</label>
                                <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} placeholder="Repite contraseña" className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-slate-50/50" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Creando cuenta...
                                </>
                            ) : 'Crear Cuenta Gratis'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
