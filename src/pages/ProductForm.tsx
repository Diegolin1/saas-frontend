import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../services/product.service';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProductForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category: 'Botas',
        price: '',
        images: [''] // Start with one empty image field
    });
    const [error, setError] = useState<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        // Validación: precio mayor a 0
        if (parseFloat(formData.price) <= 0 || isNaN(parseFloat(formData.price))) {
            setError('El precio debe ser mayor a 0.');
            return;
        }
        // Validación: variantes duplicadas
        const seen = new Set();
        for (const v of variants) {
            const key = `${v.size}-${v.color}`.toLowerCase();
            if (seen.has(key)) {
                setError('No puede haber variantes duplicadas (misma talla y color).');
                return;
            }
            seen.add(key);
        }
        setLoading(true);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                images: formData.images.filter(url => url.trim() !== ''),
                variants: variants.map(v => ({
                    ...v,
                    stock: parseInt(v.stock.toString())
                }))
            };
            await createProduct(payload);
            navigate('/products');
        } catch (error) {
            console.error('Error creating product:', error);
            setError('Error al crear producto. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-display font-bold mb-6 text-brand-900 drop-shadow-glow">Nuevo Producto</h1>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gold-400 glass p-8 shadow-glass-dark rounded-3xl border border-gold-500/20">
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-100 text-red-700 font-bold border border-red-300 animate-pulse text-center">
                        {error}
                    </div>
                )}
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
                        <button type="button" onClick={() => navigate('/products')} className="rounded-full border-2 border-gold-400 bg-white py-2 px-6 text-base font-bold text-gold-500 shadow-glow hover:bg-gold-50 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="inline-flex justify-center rounded-full border border-transparent bg-gold-500 py-2 px-8 text-base font-bold text-brand-950 shadow-glow hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 transition-all animate-pulse">
                            {loading ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
