import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, Product, PaginationInfo } from '../services/product.service';
import { PlusIcon, PencilSquareIcon, TrashIcon, StarIcon, ExclamationTriangleIcon, ShareIcon } from '@heroicons/react/24/outline';
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
        <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-display font-bold text-slate-900">Catálogo de Productos</h1>
                        <p className="mt-1 text-sm text-slate-500">Administra los modelos de tu showroom.</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Link
                            to="/admin/products/new"
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600 transition-all"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Nuevo Producto
                        </Link>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o categoría..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center py-16 rounded-2xl bg-white border border-slate-200">
                            <div className="inline-block p-3 bg-slate-100 rounded-xl mb-4">
                                <ExclamationTriangleIcon className="h-10 w-10 text-slate-400" />
                            </div>
                            <p className="text-slate-700 text-base font-semibold">No hay productos aún</p>
                            <p className="text-slate-400 text-sm mt-1">¡Sube tu primer modelo estrella para comenzar!</p>
                        </div>
                    ) : (
                        products.map((product) => {
                            const stock = product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
                            const isBestSeller = product.tags?.includes('best-seller');
                            const isOutOfStock = stock === 0;
                            return (
                                <div
                                    key={product.id}
                                    className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden group transition-all hover:shadow-md hover:-translate-y-1 duration-300 flex flex-col h-full"
                                >
                                    {/* Container de imagen */}
                                    <div className="relative h-56 bg-slate-100 overflow-hidden flex items-center justify-center">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0].url}
                                                alt={product.name}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                                                <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                                                <span className="text-xs font-medium">Sin imagen</span>
                                            </div>
                                        )}

                                        {/* Insignias */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            {isBestSeller && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 font-bold text-xs border border-brand-200">
                                                    <StarIcon className="h-3.5 w-3.5 mr-1" /> Más Vendido
                                                </span>
                                            )}
                                            {isOutOfStock && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold text-xs border border-red-200">
                                                    <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" /> Agotado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contenido */}
                                    <div className="p-5 flex flex-col flex-grow">
                                        <h2 className="font-display text-base font-bold text-slate-900 mb-2 line-clamp-2">{product.name}</h2>

                                        <div className="space-y-1.5 mb-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">SKU</span>
                                                <span className="font-semibold text-slate-900">{product.sku || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">Categoría</span>
                                                <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs">{product.category || 'General'}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                <span className="text-slate-700 font-semibold">Stock</span>
                                                <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-900'}`}>
                                                    {stock} pares
                                                </span>
                                            </div>
                                        </div>

                                        {/* Descripción */}
                                        {product.description && (
                                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{product.description}</p>
                                        )}

                                        {/* Acciones */}
                                        <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                                            <button
                                                className="min-h-[38px] flex items-center justify-center gap-1.5 px-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all text-xs whitespace-nowrap"
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
                                                className="min-h-[38px] flex items-center justify-center gap-1.5 px-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-all text-xs whitespace-nowrap"
                                                title="Editar este producto"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                                <span className="hidden sm:inline">Editar</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="min-h-[38px] flex items-center justify-center gap-1.5 px-2 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-all text-xs whitespace-nowrap"
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
