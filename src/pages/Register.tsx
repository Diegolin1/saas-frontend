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
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Crea tu cuenta
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-400">
                        Inicia sesión
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Nombre de la Empresa</label>
                            <div className="mt-1">
                                <input name="companyName" type="text" required value={formData.companyName} onChange={handleChange} placeholder="Ej. Calzado León SA" className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Tu Nombre Completo</label>
                            <div className="mt-1">
                                <input name="adminName" type="text" required value={formData.adminName} onChange={handleChange} placeholder="Ej. Juan Pérez" className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
                            <div className="mt-1">
                                <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="tu@empresa.com" className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Contraseña <span className="text-gray-500">(mín. 8 caracteres)</span></label>
                            <div className="mt-1">
                                <input name="password" type="password" required minLength={8} value={formData.password} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Confirmar Contraseña</label>
                            <div className="mt-1">
                                <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white" />
                            </div>
                        </div>

                        <div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
