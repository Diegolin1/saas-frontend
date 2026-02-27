import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, Product } from '../services/product.service';
import { PlusIcon, PencilSquareIcon, TrashIcon, StarIcon, ExclamationTriangleIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                await deleteProduct(id);
                fetchProducts();
            } catch (error) {
                alert('Error al eliminar producto');
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-brand-400">Cargando inventario...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-display font-bold text-brand-900">Catálogo de Productos</h1>
                    <p className="mt-2 text-brand-500">Exhibe tus modelos como una galería premium.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <Link
                        to="/products/new"
                        className="block rounded-full bg-gold-500 px-5 py-3 text-center text-base font-bold text-brand-950 shadow-glow hover:bg-gold-400 transition-all hover:scale-105"
                    >
                        <PlusIcon className="h-5 w-5 inline-block -mt-1 mr-1" />
                        Nuevo Producto
                    </Link>
                </div>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.length === 0 ? (
                    <div className="col-span-full text-center text-brand-400 text-lg font-semibold py-16 glass-dark rounded-2xl shadow-glass-dark">
                        No hay productos aún. ¡Sube tu primer modelo estrella!
                    </div>
                ) : (
                    products.map((product) => {
                        const stock = product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
                        const isBestSeller = product.tags?.includes('best-seller');
                        const isOutOfStock = stock === 0;
                        return (
                            <div key={product.id} className="relative glass p-5 rounded-2xl shadow-glow border border-gold-500/10 flex flex-col items-center group transition-all hover:shadow-glass-dark">
                                {/* Imagen del producto */}
                                {product.images && product.images.length > 0 ? (
                                    <img src={product.images[0].url} alt={product.name} className="h-40 w-40 object-cover rounded-xl mb-4 shadow-glass-dark border-2 border-brand-100 group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="h-40 w-40 flex items-center justify-center rounded-xl bg-brand-100 text-brand-400 mb-4 font-bold text-2xl">No img</div>
                                )}

                                {/* Insignias */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    {isBestSeller && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-brand-950 font-bold text-xs shadow-glow animate-pulse">
                                            <StarIcon className="h-4 w-4 mr-1" /> Más Vendido
                                        </span>
                                    )}
                                    {isOutOfStock && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-brand-400 to-brand-700 text-white font-bold text-xs shadow-glow animate-pulse">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" /> Sin Stock
                                        </span>
                                    )}
                                </div>

                                {/* Info principal */}
                                <h2 className="font-display text-lg font-bold text-brand-900 text-center mb-1">{product.name}</h2>
                                <div className="text-brand-500 text-sm mb-2">SKU: {product.sku}</div>
                                <div className="text-brand-400 text-xs mb-4">{product.category}</div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-brand-900 font-bold text-base">Stock:</span>
                                    <span className={isOutOfStock ? 'text-red-500 font-bold' : 'text-gold-500 font-bold'}>{stock}</span>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-3 mt-auto">
                                    <button
                                        className="flex items-center gap-1 px-4 py-2 rounded-full bg-brand-900 text-gold-400 font-bold shadow-glow hover:bg-brand-800 hover:text-gold-500 transition-all text-sm"
                                        onClick={() => navigator.share ? navigator.share({ title: product.name, url: window.location.origin + '/shop/' + product.id }) : navigator.clipboard.writeText(window.location.origin + '/shop/' + product.id)}
                                    >
                                        <ShareIcon className="h-4 w-4" /> Compartir
                                    </button>
                                    <Link to={`/products/${product.id}/edit`} className="flex items-center gap-1 px-4 py-2 rounded-full bg-gold-500 text-brand-950 font-bold shadow-glow hover:bg-gold-400 transition-all text-sm">
                                        <PencilSquareIcon className="h-4 w-4" /> Editar
                                    </Link>
                                    <button onClick={() => handleDelete(product.id)} className="flex items-center gap-1 px-4 py-2 rounded-full bg-red-100 text-red-600 font-bold shadow hover:bg-red-200 transition-all text-sm">
                                        <TrashIcon className="h-4 w-4" /> Eliminar
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
