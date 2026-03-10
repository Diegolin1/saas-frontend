import { useState, useEffect, useRef } from 'react';
import { getSettings, updateSettings, updateSlug, CompanySettings } from '../../services/settings.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { BuildingOffice2Icon, PhoneIcon, MapPinIcon, TagIcon, PhotoIcon, LinkIcon } from '@heroicons/react/24/outline';
import { uploadLogo } from '../../services/upload.service';

const MEXICAN_STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

export default function CompanySettingsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [whatsappPhone, setWhatsappPhone] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [currency, setCurrency] = useState('MXN');
    const [categoriesText, setCategoriesText] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [slugName, setSlugName] = useState('');
    const [savingSlug, setSavingSlug] = useState(false);

    // Address fields
    const [street, setStreet] = useState('');
    const [extNumber, setExtNumber] = useState('');
    const [intNumber, setIntNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [zipCode, setZipCode] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data: CompanySettings = await getSettings();
            setCompanyName(data.name || '');
            setTaxId(data.taxId || '');

            const s = data.settings || {};
            setWhatsappPhone(s.whatsappPhone || '');
            setCity(s.city || '');
            setState(s.state || '');
            setCurrency(s.currency || 'MXN');
            setCategoriesText((s.categories || []).join(', '));
            setLogoUrl(s.logoUrl || '');
            setSlugName(data.slugName || '');

            const addr = data.address || {};
            setStreet(addr.street || '');
            setExtNumber(addr.extNumber || '');
            setIntNumber(addr.intNumber || '');
            setNeighborhood(addr.neighborhood || '');
            setZipCode(addr.zipCode || '');
        } catch (err) {
            showToast(getErrorMessage(err, 'Error al cargar configuración.'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSlugSave = async () => {
        setSavingSlug(true);
        try {
            const result = await updateSlug(slugName.trim());
            setSlugName(result.slugName || '');
            showToast('URL del catálogo actualizada.', 'success');
        } catch (err) {
            showToast(getErrorMessage(err, 'Error al guardar el slug.'), 'error');
        } finally {
            setSavingSlug(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const categories = categoriesText
                .split(',')
                .map(c => c.trim())
                .filter(Boolean);

            await updateSettings({
                name: companyName.trim(),
                taxId: taxId.trim() || null,
                address: {
                    street: street.trim(),
                    extNumber: extNumber.trim(),
                    intNumber: intNumber.trim(),
                    neighborhood: neighborhood.trim(),
                    zipCode: zipCode.trim(),
                    city: city.trim(),
                    state,
                },
                settings: {
                    whatsappPhone: whatsappPhone.trim(),
                    logoUrl: logoUrl || undefined,
                    city: city.trim(),
                    state,
                    currency,
                    categories,
                },
            });

            showToast('Configuración guardada correctamente.', 'success');
        } catch (err) {
            showToast(getErrorMessage(err, 'Error al guardar la configuración.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white shadow rounded-lg p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-brand-500"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <PhotoIcon className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">Logo de la Empresa</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Aparece en el catálogo público y las notificaciones.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center gap-6">
                        {/* Preview */}
                        <div className="flex-shrink-0 h-24 w-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                            ) : (
                                <PhotoIcon className="h-10 w-10 text-gray-300" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <button
                                type="button"
                                disabled={uploadingLogo}
                                onClick={() => logoInputRef.current?.click()}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                {uploadingLogo ? (
                                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />Subiendo...</>
                                ) : (
                                    <><PhotoIcon className="h-4 w-4" />Cambiar logo</>
                                )}
                            </button>
                            {logoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setLogoUrl('')}
                                    className="block text-xs text-red-500 hover:text-red-700"
                                >
                                    Quitar logo
                                </button>
                            )}
                            <p className="text-xs text-gray-400">JPG, PNG o WEBP · Máx. 5 MB</p>
                        </div>
                    </div>
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingLogo(true);
                            try {
                                const url = await uploadLogo(file);
                                setLogoUrl(url);
                                showToast('Logo actualizado. Guarda la configuración para aplicar cambios.', 'success');
                            } catch (err) {
                                showToast(getErrorMessage(err, 'Error al subir el logo.'), 'error');
                            } finally {
                                setUploadingLogo(false);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>
            {/* Company Info */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <BuildingOffice2Icon className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">Datos de la Empresa</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Información general de tu negocio.</p>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa *</label>
                            <input
                                type="text"
                                required
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5"
                                placeholder="Mi Empresa S.A. de C.V."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">RFC</label>
                            <input
                                type="text"
                                value={taxId}
                                onChange={e => setTaxId(e.target.value.toUpperCase())}
                                maxLength={13}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5 uppercase"
                                placeholder="XAXX010101000"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Moneda</label>
                        <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="mt-1 block w-full sm:w-48 rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5"
                        >
                            <option value="MXN">MXN — Peso Mexicano</option>
                            <option value="USD">USD — Dólar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Contact */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <PhoneIcon className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">Contacto y WhatsApp</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Número de WhatsApp para pedidos de clientes.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">WhatsApp para Pedidos</label>
                        <input
                            type="tel"
                            value={whatsappPhone}
                            onChange={e => setWhatsappPhone(e.target.value)}
                            className="mt-1 block w-full sm:w-80 rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5"
                            placeholder="521 477 123 4567"
                        />
                        <p className="mt-1 text-xs text-gray-400">Formato: código de país + número (ej. 5214771234567)</p>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <MapPinIcon className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">Dirección</h3>
                    </div>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Calle</label>
                            <input type="text" value={street} onChange={e => setStreet(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5" placeholder="Av. Principal" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Num. Ext.</label>
                                <input type="text" value={extNumber} onChange={e => setExtNumber(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5" placeholder="123" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Num. Int.</label>
                                <input type="text" value={intNumber} onChange={e => setIntNumber(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5" placeholder="A" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Colonia</label>
                            <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5" placeholder="Centro" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">C.P.</label>
                            <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} maxLength={5}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5" placeholder="37000" />
                        </div>
                        <div>
                            {/* city will be duplicated from settings for convenience */}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ciudad / Municipio</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5" placeholder="León" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estado</label>
                            <select value={state} onChange={e => setState(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5">
                                <option value="">Seleccionar...</option>
                                {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <TagIcon className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">Categorías de Productos</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Las categorías disponibles para clasificar tus productos.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categorías (separadas por coma)</label>
                        <input
                            type="text"
                            value={categoriesText}
                            onChange={e => setCategoriesText(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5"
                            placeholder="Calzado, Accesorios, Bolsos, Cinturones"
                        />
                        <p className="mt-1 text-xs text-gray-400">Ej: Calzado Dama, Calzado Caballero, Bolsos, Accesorios</p>
                    </div>
                </div>
            </div>

            {/* Catalog URL (Slug) */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">URL de tu Catálogo Público</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Define una dirección personalizada para compartir tu catálogo.</p>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Slug (solo letras, números y guiones)</label>
                        <div className="mt-1 flex rounded-lg shadow-sm">
                            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 select-none">
                                {window.location.origin}/?slug=
                            </span>
                            <input
                                type="text"
                                value={slugName}
                                onChange={e => setSlugName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                                maxLength={60}
                                className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border-gray-300 focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2.5"
                                placeholder="mi-empresa"
                            />
                        </div>
                        {slugName && (
                            <p className="mt-1 text-xs text-brand-600 font-mono">
                                {window.location.origin}/?slug={slugName}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            disabled={savingSlug}
                            onClick={handleSlugSave}
                            className="inline-flex justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50 transition-colors"
                        >
                            {savingSlug ? 'Guardando...' : 'Guardar URL'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </form>
    );
}
