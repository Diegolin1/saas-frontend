import { useEffect, useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface CustomerProfile {
    id: string;
    businessName: string;
    email: string | null;
    taxId: string | null;
    taxSystem: string | null;
    taxZipCode: string | null;
    shippingAddress: {
        street?: string;
        extNumber?: string;
        intNumber?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    } | null;
    creditLimit: number | null;
    priceList?: { name: string; currency: string } | null;
    seller?: { fullName: string; email: string } | null;
}

const TAX_SYSTEMS: Record<string, string> = {
    '601': '601 — General de Ley Personas Morales',
    '603': '603 — Personas Morales con Fines No Lucrativos',
    '605': '605 — Sueldos y Salarios',
    '606': '606 — Arrendamiento',
    '608': '608 — Demás Ingresos',
    '610': '610 — Residentes en el Extranjero',
    '612': '612 — Personas Físicas con Actividades Empresariales',
    '616': '616 — Sin Obligaciones Fiscales',
    '620': '620 — Sociedades Cooperativas de Producción',
    '621': '621 — Incorporación Fiscal',
    '622': '622 — Actividades Agrícolas',
    '625': '625 — Régimen de las Actividades Empresariales (Plataformas)',
    '626': '626 — Régimen Simplificado de Confianza (RESICO)',
};

export default function BuyerProfile() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customers/my-profile')
            .then(({ data }) => setProfile(data))
            .catch(() => showToast('No se pudo cargar tu perfil.', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <svg className="animate-spin h-6 w-6 text-slate-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                <UserCircleIcon className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-800">Perfil no encontrado</p>
                <p className="mt-1 text-xs text-slate-500">Contacta a tu proveedor para que te registre como cliente.</p>
            </div>
        );
    }

    const addr = profile.shippingAddress;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">Mi Perfil</h1>
                <p className="mt-1 text-sm text-slate-500">Tu información fiscal y de envío registrada con tu proveedor.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Datos de la cuenta */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500">
                        <UserCircleIcon className="h-4 w-4" />
                        Datos de Cuenta
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-slate-500">Email de acceso</dt>
                            <dd className="font-semibold text-slate-800">{user?.email}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">Razón Social</dt>
                            <dd className="font-semibold text-slate-800">{profile.businessName}</dd>
                        </div>
                        {profile.seller && (
                            <div>
                                <dt className="text-xs text-slate-500">Vendedor Asignado</dt>
                                <dd className="font-semibold text-slate-800">{profile.seller.fullName}</dd>
                                <dd className="text-xs text-slate-500">{profile.seller.email}</dd>
                            </div>
                        )}
                        {profile.priceList && (
                            <div>
                                <dt className="text-xs text-slate-500">Lista de Precios</dt>
                                <dd className="font-semibold text-slate-800">{profile.priceList.name} ({profile.priceList.currency})</dd>
                            </div>
                        )}
                        {profile.creditLimit != null && (
                            <div>
                                <dt className="text-xs text-slate-500">Límite de Crédito</dt>
                                <dd className="font-semibold text-slate-800">${Number(profile.creditLimit).toLocaleString('es-MX')}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Datos Fiscales */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-bold uppercase text-slate-500">Datos Fiscales</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-slate-500">RFC</dt>
                            <dd className="font-semibold text-slate-800">{profile.taxId || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">Régimen Fiscal</dt>
                            <dd className="font-semibold text-slate-800">
                                {profile.taxSystem ? (TAX_SYSTEMS[profile.taxSystem] || profile.taxSystem) : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">CP Fiscal</dt>
                            <dd className="font-semibold text-slate-800">{profile.taxZipCode || '—'}</dd>
                        </div>
                    </dl>
                </div>

                {/* Dirección de Envío */}
                {addr && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                        <h2 className="text-sm font-bold uppercase text-slate-500">Dirección de Envío</h2>
                        <p className="mt-3 text-sm text-slate-800">
                            {[addr.street, addr.extNumber && `#${addr.extNumber}`, addr.intNumber && `Int. ${addr.intNumber}`]
                                .filter(Boolean)
                                .join(' ')}
                            {addr.neighborhood && <>, Col. {addr.neighborhood}</>}
                            <br />
                            {[addr.city, addr.state, addr.zipCode && `C.P. ${addr.zipCode}`].filter(Boolean).join(', ')}
                        </p>
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                    <strong>¿Necesitas actualizar tu información?</strong> Contacta a tu vendedor asignado para solicitar cambios en tus datos fiscales o de envío.
                </p>
            </div>
        </div>
    );
}
