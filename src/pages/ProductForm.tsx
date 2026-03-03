import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, getProduct, updateProduct } from '../services/product.service';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Toast } from '../components/Toast';

const ProductForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category: 'Botas',
        price: '',
        images: [''] // Start with one empty image field
    });
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

    const [variants, setVariants] = useState([
        { size: '25', color: 'Negro', stock: 10 }
    ]);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (index: number, value: string) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData({ ...formData, images: newImages });
    };

    const addImageField = () => {
        setFormData({ ...formData, images: [...formData.images, ''] });
    };

    const handleVariantChange = (index: number, field: string, value: any) => {
        const newVariants = [...variants];
        // @ts-ignore
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const addVariant = () => {
        setVariants([...variants, { size: '', color: '', stock: 0 }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return;
            try {
                const existing = await getProduct(id);
                setFormData({
                    name: existing.name || '',
                    sku: existing.sku || '',
                    description: existing.description || '',
                    category: existing.category || 'Botas',
                    price: existing.price !== undefined && existing.price !== null ? String(existing.price) : '',
                    images: (existing.images || []).map((img: any) => img.url) || ['']
                });
                setVariants(
                    existing.variants && existing.variants.length > 0
                        ? existing.variants.map((v: any) => ({ size: v.size || '', color: v.color || '', stock: v.stock ?? 0 }))
                        : [{ size: '25', color: 'Negro', stock: 10 }]
                );
            } catch (error: any) {
                console.error('Error cargando producto:', error);
                setFeedback({ message: 'No se pudo cargar el producto para editar.', type: 'error' });
            }
        };
        loadProduct();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        if (!formData.name.trim()) {
            setFeedback({ message: 'El nombre del producto es requerido.', type: 'warning' });
            return;
        }
        if (!formData.sku.trim()) {
            setFeedback({ message: 'El SKU es requerido.', type: 'warning' });
            return;
        }
        if (!formData.price) {
            setFeedback({ message: 'El precio es requerido.', type: 'warning' });
            return;
        }

        if (parseFloat(formData.price) <= 0 || isNaN(parseFloat(formData.price))) {
            setFeedback({ message: 'El precio debe ser mayor a 0.', type: 'error' });
            return;
        }

        if (variants.length === 0) {
            setFeedback({ message: 'Debes agregar al menos una variante (talla/color).', type: 'warning' });
            return;
        }

        const seen = new Set();
        for (const v of variants) {
            if (!v.size.trim() || !v.color.trim()) {
                setFeedback({ message: 'Todas las variantes deben tener talla y color.', type: 'warning' });
                return;
            }
            if (v.stock < 0) {
                setFeedback({ message: 'El stock no puede ser negativo.', type: 'warning' });
                return;
            }
            const key = `${v.size}-${v.color}`.toLowerCase();
            if (seen.has(key)) {
                setFeedback({ message: 'No puede haber variantes duplicadas.', type: 'error' });
                return;
            }
            seen.add(key);
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                sku: formData.sku.trim(),
                description: formData.description.trim(),
                category: formData.category,
                price: parseFloat(formData.price),
                images: formData.images.filter(url => url.trim() !== ''),
                variants: variants.map(v => ({
                    size: v.size.trim(),
                    color: v.color.trim(),
                    stock: parseInt(v.stock.toString()) || 0
                }))
            };
            if (isEdit && id) {
                await updateProduct(id, payload);
                setFeedback({ message: '¡Producto actualizado exitosamente! Redirigiendo...', type: 'success' });
            } else {
                await createProduct(payload);
                setFeedback({ message: '¡Producto guardado exitosamente! Redirigiendo...', type: 'success' });
            }
            setTimeout(() => {
                navigate('/admin/products');
            }, 2000);
        } catch (error: any) {
            console.error('Error creating product:', error);
            const errorMessage = error.response?.data?.error || 'Error al crear producto. Intenta de nuevo.';
            setFeedback({ message: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {feedback && (
                <Toast
                    message={feedback.message}
                    type={feedback.type}
                    onClose={() => setFeedback(null)}
                    duration={feedback.type === 'success' ? 2000 : 4000}
                />
            )}

            <h1 className="text-3xl font-display font-bold mb-6 text-brand-900 drop-shadow-glow">
                {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gold-400 glass p-8 shadow-glass-dark rounded-3xl border border-gold-500/20">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-display font-bold leading-6 text-gold-500">Información General</h3>
                        <p className="mt-1 text-sm text-brand-400">Detalles básicos del producto visible para los clientes.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label className="block text-sm font-medium text-brand-900">Nombre del Producto</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange}
                                className="mt-1 block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-brand-900">SKU</label>
                            <input type="text" name="sku" required value={formData.sku} onChange={handleChange}
                                className="mt-1 block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" />
                        </div>

                        <div className="sm:col-span-6">
                            <label className="block text-sm font-medium text-brand-900">Descripción</label>
                            <textarea name="description" rows={3} value={formData.description} onChange={handleChange}
                                className="mt-1 block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" />
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-brand-900">Categoría</label>
                            <select name="category" value={formData.category} onChange={handleChange}
                                className="mt-1 block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70">
                                <option>Botas</option>
                                <option>Tenis</option>
                                <option>Sandalias</option>
                                <option>Zapatos Formales</option>
                                <option>Accesorios</option>
                            </select>
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-brand-900">Precio Base (MXN)</label>
                            <div className="relative mt-1 rounded-xl shadow-glow">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gold-500 sm:text-base">$</span>
                                </div>
                                <input type="number" name="price" required value={formData.price} onChange={handleChange} placeholder="0.00"
                                    className="block w-full rounded-xl border-gold-400 pl-7 focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 space-y-6">
                    <div>
                        <h3 className="text-xl font-display font-bold leading-6 text-gold-500">Imágenes</h3>
                        <p className="mt-1 text-sm text-brand-400">URLs de las imágenes del producto.</p>
                    </div>

                    <div className="space-y-3">
                        {formData.images.map((url, index) => (
                            <div key={index} className="flex gap-2">
                                <input type="text" placeholder="https://..." value={url} onChange={(e) => handleImageChange(index, e.target.value)}
                                    className="block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" />
                                {index > 0 && (
                                    <button type="button" onClick={() => {
                                        const newImages = formData.images.filter((_, i) => i !== index);
                                        setFormData({ ...formData, images: newImages });
                                    }} className="text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addImageField} className="text-sm text-gold-500 font-bold hover:text-gold-400 flex items-center">
                            <PlusIcon className="h-4 w-4 mr-1" /> Agregar otra imagen
                        </button>
                    </div>
                </div>

                <div className="pt-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-display font-bold leading-6 text-gold-500">Variantes e Inventario</h3>
                            <p className="mt-1 text-sm text-brand-400">Define las combinaciones de Talla/Color y su stock inicial.</p>
                        </div>
                        <button type="button" onClick={addVariant} className="inline-flex items-center rounded-full border border-gold-400 bg-white px-4 py-2 text-base font-bold leading-4 text-gold-500 shadow-glow hover:bg-gold-50 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 transition-all">
                            <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                            Agregar Variante
                        </button>
                    </div>

                    <div className="bg-brand-50/70 p-4 rounded-xl border border-gold-100">
                        {variants.map((variant, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-brand-900">Talla</label>
                                    <input type="text" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                        className="mt-1 block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" placeholder="Ej. 27" />
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-xs font-bold text-brand-900">Color</label>
                                    <input type="text" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                        className="mt-1 block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" placeholder="Ej. Negro" />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-brand-900">Stock Inicial</label>
                                    <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                        className="mt-1 block w-full rounded-xl border-gold-400 shadow-glow focus:border-gold-500 focus:ring-gold-400 sm:text-base border p-3 bg-white/70" />
                                </div>
                                <div className="col-span-2">
                                    {variants.length > 1 && (
                                        <button type="button" onClick={() => removeVariant(index)} className="w-full text-red-600 hover:text-red-900 flex justify-center pb-2">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-5">
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => navigate('/admin/products')} className="rounded-full border-2 border-gold-400 bg-white py-2 px-6 text-base font-bold text-gold-500 shadow-glow hover:bg-gold-50 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 transition-all">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-full border border-transparent bg-gold-500 py-2 px-8 text-base font-bold text-brand-950 shadow-glow hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 transition-all"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Producto'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
