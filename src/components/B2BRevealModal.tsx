import { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';

interface B2BRevealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (lead: { id: string; name: string; phone: string }) => void;
    companyId: string;
}

export default function B2BRevealModal({ isOpen, onClose, onSuccess, companyId }: B2BRevealModalProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const res = await axios.post(`${API_URL}/leads`, { name, phone, companyId });

            const leadData = {
                id: res.data.leadId,
                name,
                phone
            };

            // Save to localStorage
            localStorage.setItem('b2b_lead', JSON.stringify(leadData));

            onSuccess(leadData);
        } catch (err) {
            setError('Error al conectar. Intenta nuevamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.3),transparent_50%)]" />

                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-white z-10 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative z-10 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 mb-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Precios Exclusivos para Mayoristas</h2>
                        <p className="text-stone-300 text-sm">
                            Ingresa tus datos para desbloquear el catálogo con precios de fábrica y realizar compras directas.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/30 rounded-xl">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-1">Tu Nombre o Empresa</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                                placeholder="Ej. Zapaterías Gto"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-1">WhatsApp de Contacto</label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                                placeholder="Ej. 477 123 4567"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Desbloqueando...' : 'Ver Precios Mayoristas'}
                        </button>
                    </form>
                    <p className="text-xs text-center text-stone-500 mt-4">
                        Tus datos son seguros. Solo se usarán para contactarte sobre tu pedido.
                    </p>
                </div>
            </div>
        </div>
    );
}
