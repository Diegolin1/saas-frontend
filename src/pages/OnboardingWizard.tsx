import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSettings, getSettings } from '../services/settings.service';
import { createProduct } from '../services/product.service';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { uploadProductImage } from '../services/upload.service';
import api from '../services/api';

export default function OnboardingWizard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { loadTheme } = useTheme();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Step 1: Branding
    const [companyName, setCompanyName] = useState('');
    const [brandColor, setBrandColor] = useState('#0B0F19');

    // Step 2: Fiscal & Address
    const [taxId, setTaxId] = useState('');
    const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '' });

    // Step 3: First Product
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('0');
    const [productImage, setProductImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        // Popyulate current name if any
        getSettings().then(res => {
            if (res.name) setCompanyName(res.name);
            if (res.settings?.brandColor) setBrandColor(res.settings.brandColor);
        }).catch(() => { });
    }, []);

    const lookupRfc = async () => {
        if (taxId.length < 12) return;
        try {
            const res = await api.get(`/onboarding/lookup/${taxId}`);
            if (res.data?.address) {
                setAddress(prev => ({
                    ...prev,
                    zipCode: res.data.address.zip || prev.zipCode
                }));
                showToast('Datos fiscales verificados.', 'info');
            }
        } catch (error) {
            // It's just a helper, ignore errors silently or inform user
        }
    };

    const handleSaveBranding = async () => {
        if (companyName.length < 2) return showToast('El nombre es muy corto.', 'warning');
        setSubmitting(true);
        try {
            await updateSettings({
                name: companyName,
                settings: { brandColor }
            });
            await loadTheme(); // update ui immediately
            setStep(2);
        } catch (e) {
            showToast('Error guardando configuración.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveFiscal = async () => {
        setSubmitting(true);
        try {
            await updateSettings({
                taxId: taxId || undefined,
                address
            });
            setStep(3);
        } catch (e) {
            showToast('Error guardando dirección.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinish = async () => {
        if (!productName || !productPrice) return showToast('Completa los datos del producto', 'warning');
        setSubmitting(true);
        try {
            let imageUrl = '';
            if (productImage) {
                const url = await uploadProductImage(productImage);
                if (url) imageUrl = url;
            }

            await createProduct({
                name: productName,
                description: 'Mi primer producto en ShowRoom B2B',
                category: 'General',
                isActive: true,
                images: imageUrl ? [{ url: imageUrl, isPrimary: true }] : [],
                prices: [{ priceListId: 'DEFAULT', price: parseFloat(productPrice) }] // Backend should handle creating default list if none exists, or use a base price logic
            } as any);

            showToast('¡Catálogo configurado con éxito!', 'success');
            navigate('/admin');
        } catch (e) {
            showToast('Error creando producto.', 'error');
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-stone-50">
            {/* Left side: Form */}
            <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-stone-900">
                            Bienvenido a ShowRoom
                        </h2>
                        <p className="mt-2 text-sm text-stone-600">
                            Configuremos tu plataforma en 3 pasos rápidos.
                        </p>
                    </div>

                    <div className="mt-8">
                        {/* Progress */}
                        <div className="flex items-center gap-2 mb-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${step >= i ? 'bg-brand-500' : 'bg-stone-200'}`} />
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h3 className="text-lg font-medium">Identidad de la Empresa</h3>
                                    <p className="text-sm text-stone-500 mb-4">¿Cómo se llama tu negocio y de qué color es tu marca?</p>
                                    
                                    <label className="block text-sm font-medium text-stone-700">Nombre</label>
                                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} 
                                        className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Color Institucional</label>
                                    <div className="flex items-center gap-4">
                                        <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} 
                                            className="h-10 w-full cursor-pointer rounded-md border border-stone-300 p-1" 
                                        />
                                    </div>
                                </div>
                                <button onClick={handleSaveBranding} disabled={submitting || !companyName}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none disabled:opacity-50 transition-colors">
                                    Siguiente paso
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h3 className="text-lg font-medium">Datos Fiscales (Opcional)</h3>
                                    <p className="text-sm text-stone-500 mb-4">Necesario si planeas usar facturación 4.0 automatizada.</p>
                                    
                                    <label className="block text-sm font-medium text-stone-700">RFC</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={taxId} onChange={e => setTaxId(e.target.value.toUpperCase())} maxLength={13}
                                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" 
                                            placeholder="XAXX010101000"
                                        />
                                        <button onClick={lookupRfc} className="mt-1 px-4 py-2 border rounded-md bg-stone-100 font-medium text-sm text-stone-600 hover:bg-stone-200">Verificar</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-stone-700">Calle y Número</label>
                                        <input type="text" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} 
                                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700">Código Postal</label>
                                        <input type="text" value={address.zipCode} onChange={e => setAddress({...address, zipCode: e.target.value})} 
                                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" 
                                            placeholder="37000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700">Ciudad</label>
                                        <input type="text" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} 
                                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" 
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep(1)} type="button" className="w-1/3 flex justify-center py-3 px-4 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 bg-white hover:bg-stone-50">
                                        Volver
                                    </button>
                                    <button onClick={handleSaveFiscal} disabled={submitting} type="button" className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50">
                                        Continuar
                                    </button>
                                </div>
                                <div className="text-center">
                                    <button onClick={() => setStep(3)} className="text-xs text-stone-500 hover:text-stone-700">Saltar este paso</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <h3 className="text-lg font-medium">Tu Primer Producto</h3>
                                    <p className="text-sm text-stone-500 mb-4">Añade algo para que tu catálogo cobre vida.</p>
                                    
                                    <label className="block text-sm font-medium text-stone-700">Nombre del producto</label>
                                    <input type="text" value={productName} onChange={e => setProductName(e.target.value)} 
                                        className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" 
                                        placeholder="Ej. Bota Industrial Piel"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Precio Básico (MXN)</label>
                                    <input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} 
                                        className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Imagen</label>
                                    <div className="mt-1 flex items-center justify-center w-full">
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 ${imagePreview ? 'border-brand-500 border-solid' : 'border-stone-300 border-dashed'} rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 overflow-hidden relative`}>
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 mb-4 text-stone-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                                    </svg>
                                                    <p className="text-sm text-stone-500"><span className="font-semibold">Click para subir</span></p>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setProductImage(file);
                                                    setImagePreview(URL.createObjectURL(file));
                                                }
                                            }} />
                                        </label>
                                    </div>
                                </div>
                                <button onClick={handleFinish} disabled={submitting || !productName}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none disabled:opacity-50 transition-colors">
                                    {submitting ? 'Finalizando...' : 'Comenzar a vender'}
                                </button>
                                <div className="text-center">
                                    <button onClick={() => navigate('/admin')} className="text-xs text-stone-500 hover:text-stone-700">Ir al dashboard directo</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right side: Preview */}
            <div className="hidden lg:block relative w-full h-full bg-stone-900 border-l border-stone-800">
                <div className="absolute inset-0 p-12 flex flex-col items-center justify-center">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden aspect-[4/3] flex flex-col ring-1 ring-white/10 relative transform transition-all hover:scale-105 duration-500">
                        {/* Fake browser top */}
                        <div className="h-10 border-b border-stone-100 flex items-center px-4 gap-2 bg-stone-50">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <div className="flex-1 mx-4 h-5 bg-white rounded flex items-center px-3 shadow-sm border border-stone-100 text-[10px] text-stone-400 font-mono overflow-hidden whitespace-nowrap">
                                https://app.showroom.com/{companyName.toLowerCase().replace(/ /g, '-')}
                            </div>
                        </div>
                        {/* Fake app content */}
                        <div className="flex-1 overflow-hidden relative" style={{ '--color-brand-500': brandColor } as any}>
                            <div className="h-14 border-b border-stone-100 flex items-center justify-between px-6">
                                <span className="font-bold text-lg" style={{ color: brandColor }}>{companyName || 'Tu Logo'}</span>
                                <div className="flex gap-4">
                                    <div className="w-16 h-2 bg-stone-200 rounded"></div>
                                    <div className="w-16 h-2 bg-stone-200 rounded"></div>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="w-1/2 h-8 rounded mb-6 opacity-20" style={{ backgroundColor: brandColor }}></div>
                                <div className="w-3/4 h-3 bg-stone-100 rounded mb-3"></div>
                                <div className="w-2/3 h-3 bg-stone-100 rounded mb-8"></div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="bg-stone-50 rounded-lg p-3">
                                            <div className="w-full aspect-square bg-stone-200 rounded mb-3 relative overflow-hidden">
                                                {step === 3 && i === 1 && imagePreview && (
                                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Product" />
                                                )}
                                            </div>
                                            <div className="w-full h-3 bg-stone-200 rounded mb-2"></div>
                                            <div className="w-1/2 h-3 rounded opacity-80" style={{ backgroundColor: brandColor }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-white/60 text-sm mt-8 font-medium">Vista previa en tiempo real de tu tienda profesional.</p>
                </div>
            </div>
        </div>
    );
}
