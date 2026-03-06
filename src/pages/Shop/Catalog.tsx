import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPublicCatalog, Product } from '../../services/product.service'
import { MagnifyingGlassIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useCart } from '../../context/CartContext'
import B2BRevealModal from '../../components/B2BRevealModal'

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [usedCompanyId, setUsedCompanyId] = useState<string>('')
    const [searchParams] = useSearchParams()
    const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'
    const { isB2BUnlocked, unlockB2B } = useCart()
    const [showModal, setShowModal] = useState(false)

    // Search, filter, pagination state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [categories, setCategories] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [sort, setSort] = useState('newest')

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                setError(null)
                setLoading(true)
                setUsedCompanyId(companyId)
                const data = await getPublicCatalog(companyId, {
                    search: searchQuery || undefined,
                    category: selectedCategory || undefined,
                    page,
                    sort
                })
                if (cancelled) return
                if (data && data.products) {
                    setProducts(data.products)
                    setTotalPages(data.pagination?.totalPages || 1)
                    if (data.categories) setCategories(data.categories)
                } else if (Array.isArray(data)) {
                    setProducts(data)
                    setTotalPages(1)
                } else {
                    setProducts([])
                    setTotalPages(1)
                }
            } catch (err) {
                if (cancelled) return
                console.error('Error fetching catalog:', err)
                setError('No pudimos cargar el catálogo. Intenta nuevamente.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [companyId, page, searchQuery, selectedCategory, sort])

    useEffect(() => { setPage(1) }, [searchQuery, selectedCategory, sort])

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-brand-500 mx-auto"></div>
                <p className="text-sm text-slate-500 font-medium">Cargando catálogo...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-white">
            {/* Hero — Clean & Professional */}
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_25%,rgba(0,82,255,0.3),transparent_50%),radial-gradient(circle_at_75%_75%,rgba(212,175,55,0.2),transparent_50%)]" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
                    <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-amber-200 text-xs font-bold uppercase tracking-wider border border-white/10 mb-6">
                        <ShoppingBagIcon className="h-4 w-4" /> Catálogo Mayorista
                    </p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                        Catálogo de Productos
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                        Explora nuestra colección completa. Calidad premium, diseño artesanal y precios exclusivos para mayoristas.
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full">
                            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, modelo, categoría..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors text-sm"
                            />
                        </div>
                        {categories.length > 0 && (
                            <div className="flex items-center gap-2">
                                <FunnelIcon className="h-4 w-4 text-slate-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="rounded-xl bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 text-sm"
                                >
                                    <option value="">Todas</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="rounded-xl bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 text-sm"
                        >
                            <option value="newest">Más recientes</option>
                            <option value="name_asc">Nombre A-Z</option>
                            <option value="name_desc">Nombre Z-A</option>
                            <option value="oldest">Más antiguos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {error && (
                    <div className="mb-8 bg-red-50 rounded-xl border border-red-200 p-4 text-sm text-red-700 flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                {products.length === 0 && !error ? (
                    <div className="text-center py-24 max-w-md mx-auto">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ShoppingBagIcon className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-slate-900">Catálogo en preparación</h3>
                        <p className="text-slate-500 mt-2">Estamos actualizando nuestro catálogo. Vuelve pronto para ver nuestros productos.</p>
                    </div>
                ) : null}

                {products.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                to={`/product/${product.id}?companyId=${usedCompanyId}`}
                                className="group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.name}
                                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-300">
                                            <ShoppingBagIcon className="h-12 w-12 mb-2" />
                                            <span className="text-xs font-medium">Sin foto</span>
                                        </div>
                                    )}
                                    {/* Category tag */}
                                    {product.category && (
                                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700 rounded-lg shadow-sm">
                                            {product.category}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 p-4 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-500 transition-colors leading-tight line-clamp-2">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center justify-between pt-1">
                                        {isB2BUnlocked ? (
                                            <p className="text-lg font-black text-brand-500">
                                                {product.price ? `$${Number(product.price).toLocaleString('es-MX')} MXN` : <span className="text-sm font-semibold text-slate-400">Consultar precio</span>}
                                            </p>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.preventDefault(); setShowModal(true); }}
                                                className="text-xs font-bold text-brand-500 bg-brand-500/10 px-3 py-1.5 rounded-lg hover:bg-brand-500/20 transition-colors flex items-center gap-1.5"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Ver Precios
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-3">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeftIcon className="h-4 w-4" /> Anterior
                        </button>
                        <span className="text-sm font-semibold text-slate-600 px-3">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                        >
                            Siguiente <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
            <B2BRevealModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={(lead) => {
                    unlockB2B(lead);
                    setShowModal(false);
                }}
                companyId={companyId}
            />
        </div>
    )
}
