import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        rfc: '',
        companyName: '',
        adminName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rfcLoading, setRfcLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRfcLookup = async () => {
        if (!formData.rfc || formData.rfc.length < 12) {
            setError('Ingresa un RFC válido para buscar.');
            return;
        }
        setError('');
        setRfcLoading(true);
        try {
            const { data } = await api.get(`/onboarding/rfc/${formData.rfc}`);
            if (data && data.legal_name) {
                setFormData(prev => ({ ...prev, companyName: data.legal_name }));
            }
        } catch (err: any) {
            setError('RFC no encontrado. Ingresa el nombre de tu empresa manualmente.');
        } finally {
            setRfcLoading(false);
        }
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
            login(data.token, data.user, data.refreshToken);
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Error al registrar.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "block w-full px-3 py-3 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent";
    const labelClass = "block text-[10px] tracking-widest uppercase text-stone-400 font-semibold mb-2";

    return (
        <div className="min-h-screen flex">
            {/* Left — Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
                <div className="relative z-10 max-w-sm space-y-10 text-center">
                    <img src="/assets/logo-light.png" alt="Cuero Firme" className="h-20 w-auto mx-auto" />

                    <div className="space-y-4">
                        <h1 className="text-2xl font-semibold text-white leading-tight tracking-wide">
                            Crea tu catálogo<br />en minutos
                        </h1>
                        <p className="text-sm text-stone-400 leading-relaxed">
                            Digitaliza tu catálogo, recibe pedidos 24/7 y haz crecer tu negocio mayorista.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="border border-stone-700 p-4">
                            <p className="text-lg font-semibold text-white">Gratis</p>
                            <p className="text-[10px] tracking-widest uppercase text-stone-500 mt-1">Para empezar</p>
                        </div>
                        <div className="border border-stone-700 p-4">
                            <p className="text-lg font-semibold text-white">MXN</p>
                            <p className="text-[10px] tracking-widest uppercase text-stone-500 mt-1">Pesos + IVA</p>
                        </div>
                        <div className="border border-stone-700 p-4">
                            <p className="text-lg font-semibold text-white">24/7</p>
                            <p className="text-[10px] tracking-widest uppercase text-stone-500 mt-1">Pedidos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — Register Form */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-white">
                <div className="w-full max-w-md mx-auto">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-10 text-center">
                        <img src="/assets/logo-dark.png" alt="Cuero Firme" className="h-12 w-auto mx-auto" />
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-2xl font-semibold text-stone-900">
                            Crea tu cuenta
                        </h2>
                        <p className="text-sm text-stone-400">
                            Configura tu cuenta en menos de 2 minutos.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center gap-3 border border-red-200 text-red-600 px-4 py-3 text-xs" role="alert">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className={labelClass}>RFC (Opcional)</label>
                            <div className="flex gap-2">
                                <input name="rfc" type="text" value={formData.rfc} onChange={handleChange} placeholder="Ej. ABC120304XYZ" className={`${inputClass} uppercase`} />
                                <button type="button" onClick={handleRfcLookup} disabled={rfcLoading || !formData.rfc}
                                    className="px-5 py-3 text-[11px] tracking-widest uppercase font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50 transition-colors whitespace-nowrap border border-stone-200">
                                    {rfcLoading ? '...' : 'Buscar'}
                                </button>
                            </div>
                            <p className="mt-1.5 text-[10px] text-stone-400">Ingresa tu RFC para auto-llenar los datos de tu empresa.</p>
                        </div>

                        <div>
                            <label className={labelClass}>Nombre de la empresa</label>
                            <input name="companyName" type="text" required value={formData.companyName} onChange={handleChange} placeholder="Ej. Calzado León SA de CV" className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Tu nombre completo</label>
                            <input name="adminName" type="text" required value={formData.adminName} onChange={handleChange} placeholder="Ej. Juan Pérez" className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Correo electrónico</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="tu@empresa.com" className={inputClass} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Contraseña</label>
                                <input name="password" type="password" required minLength={8} value={formData.password} onChange={handleChange} placeholder="Mín. 8 caracteres" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Confirmar</label>
                                <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} placeholder="Repite contraseña" className={inputClass} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-semibold bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-all mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Creando cuenta...
                                </>
                            ) : 'Crear cuenta gratis'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-stone-400">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-stone-900 hover:underline font-semibold transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
