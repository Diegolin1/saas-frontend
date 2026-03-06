import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, Product, PaginationInfo } from '../services/product.service';
import { PlusIcon, PencilSquareIcon, TrashIcon, StarIcon, ExclamationTriangleIcon, ShareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';

export default function Products() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts({ page, search: searchDebounce || undefined });
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, searchDebounce]);

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                await deleteProduct(id);
                showToast('Producto eliminado correctamente', 'success');
                fetchProducts();
            } catch (error) {
                showToast('Error al eliminar el producto', 'error');
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-brand-400">Cargando inventario...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-brand-50 via-white to-gold-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="sm:flex sm:items-center sm:justify-between mb-12">
                    <div className="sm:flex-auto">
                        <h1 className="text-4xl font-display font-bold text-brand-900 drop-shadow-glow">Catálogo de Productos</h1>
                        <p className="mt-3 text-lg text-brand-500 font-medium">Exhibe tus modelos como una galería premium.</p>
                    </div>
                    <div className="mt-6 sm:mt-0">
                        <Link
                            to="/admin/products/new"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-3 text-base font-bold text-brand-950 shadow-glow hover:shadow-glass-dark transition-all hover:scale-105 duration-300 animate-pulse"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Nuevo Producto
                        </Link>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o categoría..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full max-w-md rounded-full border border-brand-200 bg-white/80 px-5 py-2.5 text-sm text-brand-900 placeholder:text-brand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-300 shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center py-20 glass-dark rounded-3xl shadow-glass-dark border border-gold-500/20">
                            <div className="inline-block p-4 bg-gold-500/10 rounded-2xl mb-4">
                                <ExclamationTriangleIcon className="h-12 w-12 text-gold-400" />
                            </div>
                            <p className="text-brand-200 text-lg font-semibold">No hay productos aún</p>
                            <p className="text-brand-400 text-sm mt-2">¡Sube tu primer modelo estrella para comenzar!</p>
                        </div>
                    ) : (
                        products.map((product) => {
                            const stock = product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
                            const isBestSeller = product.tags?.includes('best-seller');
                            const isOutOfStock = stock === 0;
                            return (
                                <div
                                    key={product.id}
                                    className="relative glass rounded-3xl shadow-glow border border-gold-500/20 overflow-hidden group transition-all hover:shadow-glass-dark hover:-translate-y-2 duration-300 animate-fade-in flex flex-col h-full hover:border-gold-500/40"
                                >
                                    {/* Container de imagen */}
                                    <div className="relative h-64 bg-gradient-to-br from-brand-100 to-brand-50 overflow-hidden flex items-center justify-center">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0].url}
                                                alt={product.name}
                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-brand-300 gap-2">
                                                <div className="w-20 h-20 bg-brand-200 rounded-2xl"></div>
                                                <span className="text-xs font-semibold">Sin imagen</span>
                                            </div>
                                        )}

                                        {/* Insignias */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            {isBestSeller && (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-brand-950 font-bold text-xs shadow-glow animate-pulse border border-gold-300">
                                                    <StarIcon className="h-3.5 w-3.5 mr-1.5" /> Más Vendido
                                                </span>
                                            )}
                                            {isOutOfStock && (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-500/90 text-white font-bold text-xs shadow-glow animate-pulse border border-red-300">
                                                    <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1.5" /> Agotado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contenido */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h2 className="font-display text-xl font-bold text-brand-900 mb-2 line-clamp-2">{product.name}</h2>

                                        <div className="space-y-1 mb-4 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-brand-500">SKU</span>
                                                <span className="font-bold text-brand-900">{product.sku || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-brand-500">Categoría</span>
                                                <span className="font-semibold text-brand-700 bg-brand-100 px-3 py-1 rounded-full text-xs">{product.category || 'General'}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-gold-200">
                                                <span className="text-brand-900 font-bold">Total Stock</span>
                                                <span className={`text-lg font-bold ${isOutOfStock ? 'text-red-500' : 'text-gold-500'}`}>
                                                    {stock} pares
                                                </span>
                                            </div>
                                        </div>

                                        {/* Descripción */}
                                        {product.description && (
                                            <p className="text-sm text-brand-600 mb-4 line-clamp-2">{product.description}</p>
                                        )}

                                        {/* Acciones */}
                                        <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-gold-200">
                                            <button
                                                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 rounded-full bg-brand-900 text-gold-400 font-semibold shadow-glow hover:bg-brand-800 hover:text-gold-300 transition-all text-xs sm:text-sm hover:scale-105 duration-200 whitespace-nowrap"
                                                onClick={() => {
                                                    const url = `${window.location.origin}/product/${product.id}`;
                                                    if (navigator.share) {
                                                        navigator.share({ title: product.name, url });
                                                    } else {
                                                        navigator.clipboard.writeText(url);
                                                    }
                                                }}
                                                title="Compartir este producto"
                                            >
                                                <ShareIcon className="h-4 w-4" />
                                                <span className="hidden sm:inline">Compartir</span>
                                            </button>
                                            <Link
                                                to={`/admin/products/${product.id}/edit`}
                                                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 rounded-full bg-gold-500 text-brand-950 font-semibold shadow-glow hover:bg-gold-400 transition-all text-xs sm:text-sm hover:scale-105 duration-200 whitespace-nowrap"
                                                title="Editar este producto"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                                <span className="hidden sm:inline">Editar</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 rounded-full bg-red-500/90 text-white font-semibold shadow-glow hover:bg-red-600 transition-all text-xs sm:text-sm hover:scale-105 duration-200 whitespace-nowrap"
                                                title="Eliminar este producto"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                                <span className="hidden sm:inline">Eliminar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {pagination && (
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        limit={pagination.limit}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
}
