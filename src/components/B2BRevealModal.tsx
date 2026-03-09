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
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white w-full sm:max-w-md p-8 sm:p-10 relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-stone-300 hover:text-stone-900 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-3">
                        <div className="w-10 h-10 border border-stone-200 flex items-center justify-center mx-auto sm:mx-0">
                            <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-lg font-semibold text-stone-900">Precios mayoristas</h2>
                            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                                Ingresa tus datos para desbloquear precios exclusivos y realizar pedidos directos.
                            </p>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-500 py-2 border-y border-red-100">{error}</p>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] tracking-widest uppercase text-stone-400 font-semibold mb-2">Nombre o empresa</label>
                            <input
                                type="text" required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-stone-200 px-3 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                                placeholder="Tu nombre o razón social"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] tracking-widest uppercase text-stone-400 font-semibold mb-2">WhatsApp</label>
                            <input
                                type="tel" required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full border border-stone-200 px-3 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                                placeholder="521 000 000 0000"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-semibold bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Desbloqueando...' : 'Ver precios mayoristas'}
                        </button>
                    </form>

                    <p className="text-[10px] text-stone-300 text-center leading-relaxed">
                        Tus datos son confidenciales. Solo se usarán para contactarte sobre tu pedido.
                    </p>
                </div>
            </div>
        </div>
    );
}
