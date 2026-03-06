import { useState, FormEvent, useEffect } from 'react';
import api from '../services/api';

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
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await api.post('/leads', { name, phone, companyId });
            const leadData = { id: res.data.leadId, name, phone };
            localStorage.setItem('b2b_lead', JSON.stringify(leadData));
            onSuccess(leadData);
        } catch {
            setError('Error al conectar. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="space-y-5">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-500 mb-1">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-display font-bold text-slate-900">Precios Exclusivos Mayoristas</h2>
                        <p className="text-sm text-slate-500">
                            Ingresa tus datos para desbloquear precios de mayoreo y realizar compras directas.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tu nombre o empresa</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                placeholder="Ej. Mi Empresa S.A." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp de contacto</label>
                            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                placeholder="521 000 000 0000" />
                        </div>
                        <button type="submit" disabled={isLoading}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
                            {isLoading ? 'Desbloqueando...' : 'Ver Precios Mayoristas'}
                        </button>
                    </form>
                    <p className="text-xs text-center text-slate-400">
                        Tus datos son seguros. Solo se usarán para contactarte sobre tu pedido.
                    </p>
                </div>
            </div>
        </div>
    );
}
