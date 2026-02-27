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
            alert('Error al crear producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Nuevo Producto</h1>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white p-6 shadow rounded-lg">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Información General</h3>
                        <p className="mt-1 text-sm text-gray-500">Detalles básicos del producto visible para los clientes.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">SKU</label>
                            <input type="text" name="sku" required value={formData.sku} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>

                        <div className="sm:col-span-6">
                            <label className="block text-sm font-medium text-gray-700">Descripción</label>
                            <textarea name="description" rows={3} value={formData.description} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Categoría</label>
                            <select name="category" value={formData.category} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                                <option>Botas</option>
                                <option>Tenis</option>
                                <option>Sandalias</option>
                                <option>Zapatos Formales</option>
                                <option>Accesorios</option>
                            </select>
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Precio Base (MXN)</label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input type="number" name="price" required value={formData.price} onChange={handleChange} placeholder="0.00"
                                    className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Imágenes</h3>
                        <p className="mt-1 text-sm text-gray-500">URLs de las imágenes del producto.</p>
                    </div>

                    <div className="space-y-3">
                        {formData.images.map((url, index) => (
                            <div key={index} className="flex gap-2">
                                <input type="text" placeholder="https://..." value={url} onChange={(e) => handleImageChange(index, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                                {index > 0 && (
                                    <button type="button" onClick={() => {
                                        const newImages = formData.images.filter((_, i) => i !== index);
                                        setFormData({ ...formData, images: newImages });
                                    }} className="text-red-500"><TrashIcon className="h-5 w-5" /></button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addImageField} className="text-sm text-indigo-600 font-medium hover:text-indigo-500 flex items-center">
                            <PlusIcon className="h-4 w-4 mr-1" /> Agregar otra imagen
                        </button>
                    </div>
                </div>

                <div className="pt-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Variantes e Inventario</h3>
                            <p className="mt-1 text-sm text-gray-500">Define las combinaciones de Talla/Color y su stock inicial.</p>
                        </div>
                        <button type="button" onClick={addVariant} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                            Agregar Variante
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                        {variants.map((variant, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                                <div className="col-span-3">
                                    <label className="block text-xs font-medium text-gray-500">Talla</label>
                                    <input type="text" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Ej. 27" />
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-xs font-medium text-gray-500">Color</label>
                                    <input type="text" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Ej. Negro" />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-medium text-gray-500">Stock Inicial</label>
                                    <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
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
                    <div className="flex justify-end">
                        <button type="button" onClick={() => navigate('/products')} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            {loading ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
