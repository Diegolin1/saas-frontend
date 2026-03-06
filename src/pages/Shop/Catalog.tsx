import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPublicCatalog, Product } from '../../services/product.service'
import { SparklesIcon, MagnifyingGlassIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
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
                // Support both new paginated format and legacy array format
                if (data && data.products) {
                    setProducts(data.products)
                    setTotalPages(data.pagination?.totalPages || 1)
                    if (data.categories) setCategories(data.categories)
                } else if (Array.isArray(data)) {
                    setProducts(data)
                    setTotalPages(1)
                } else {
                    // Unexpected format — treat as empty
                    setProducts([])
                    setTotalPages(1)
                }
            } catch (err) {
                if (cancelled) return
                console.error('Error fetching catalog:', err)
                setError('No pudimos cargar el catálogo público. Verifica el companyId o intenta nuevamente.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [companyId, page, searchQuery, selectedCategory, sort])

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1)
    }, [searchQuery, selectedCategory, sort])

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center bg-slate-50">
            <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-slate-500">Cargando catálogo...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950 text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden py-16 sm:py-20">
                <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(217,119,6,0.12),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(251,191,36,0.10),transparent_40%)]" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-amber-200 text-sm font-bold border border-amber-500/30 shadow-2xl backdrop-blur-sm">
                        <SparklesIcon className="h-4 w-4" /> Showroom Mayorista Premium
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white drop-shadow-2xl">
                        Calzado de Calidad Excepcional
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-stone-200">Diseño artesanal y calidad premium. Catálogo exclusivo para mayoristas.</p>
                    <div className="flex justify-center gap-3 pt-2">
                        <span className="inline-flex items-center rounded-full bg-amber-600/30 px-4 py-2 text-sm font-semibold text-amber-100 ring-2 ring-amber-500/40 backdrop-blur shadow-lg">
                            <SparklesIcon className="mr-1.5 h-4 w-4" /> Envío inmediato
                        </span>
                        <span className="inline-flex items-center rounded-full bg-stone-800/60 px-4 py-2 text-sm font-semibold text-stone-100 ring-2 ring-stone-600/40 backdrop-blur shadow-lg">
                            Catálogo B2B
                        </span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Search & Filters Bar */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, modelo, categoría..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-amber-500/30 text-white placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent backdrop-blur-sm"
                        />
                    </div>
                    {categories.length > 0 && (
                        <div className="flex items-center gap-2">
                            <FunnelIcon className="h-5 w-5 text-amber-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="rounded-xl bg-white/10 border border-amber-500/30 text-white py-3 px-4 focus:ring-2 focus:ring-amber-500 backdrop-blur-sm"
                            >
                                <option value="" className="text-black">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat} className="text-black">{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="rounded-xl bg-white/10 border border-amber-500/30 text-white py-3 px-4 focus:ring-2 focus:ring-amber-500 backdrop-blur-sm"
                    >
                        <option value="newest" className="text-black">Más recientes</option>
                        <option value="name_asc" className="text-black">Nombre A-Z</option>
                        <option value="name_desc" className="text-black">Nombre Z-A</option>
                        <option value="oldest" className="text-black">Más antiguos</option>
                    </select>
                </div>

                {error && (
                    <div className="mb-6 bg-red-950/60 backdrop-blur-xl rounded-2xl border border-red-500/30 p-4 text-left text-sm text-red-100 shadow-xl">
                        {error} <span className="text-amber-200">(companyId usado: {usedCompanyId || 'N/A'})</span>
                    </div>
                )}
                {products.length === 0 && !error ? (
                    <div className="text-center py-24 bg-stone-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-amber-500/20">
                        <p className="text-amber-200 text-lg font-semibold">Próximamente... Nuestro catálogo está siendo actualizado.</p>
                        <p className="text-stone-200 text-sm mt-2">companyId usado: {usedCompanyId || 'N/A'}</p>
                        <p className="text-stone-300 text-xs mt-1">Puedes probar añadiendo ?companyId=&lt;uuid&gt; en la URL.</p>
                    </div>
                ) : null}
                {products.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group relative flex flex-col rounded-3xl overflow-hidden bg-stone-900/60 backdrop-blur-xl border border-amber-500/20 shadow-2xl hover:shadow-amber-900/50 hover:-translate-y-2 transition-all duration-300"
                            >
                                {/* Badges removed — only show real data-driven badges */}

                                <div className="relative h-64 w-full overflow-hidden bg-stone-950 flex items-center justify-center">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.name}
                                            className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-amber-300 bg-stone-900/80">
                                            Sin fotografía
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                                </div>

                                <div className="flex flex-1 flex-col p-5 gap-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-[0.08em]">{product.category || 'Calzado Premium'}</p>
                                            <h3 className="text-xl font-display font-bold text-white leading-tight">
                                                <Link to={`/product/${product.id}?companyId=${usedCompanyId}`}>
                                                    <span aria-hidden="true" className="absolute inset-0" />
                                                    {product.name}
                                                </Link>
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        {isB2BUnlocked ? (
                                            <p className="text-2xl font-black text-amber-300 drop-shadow-lg">
                                                {product.price ? `$${product.price}` : <span className="text-sm font-semibold text-stone-200">Precios al mayorista</span>}
                                            </p>
                                        ) : (
                                            <div className="relative z-20">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); setShowModal(true); }}
                                                    className="text-xs font-bold text-amber-100 bg-amber-600/30 px-3 py-1.5 rounded-lg border border-amber-500/50 hover:bg-amber-500/50 transition-colors backdrop-blur-sm shadow-lg overflow-hidden relative group"
                                                >
                                                    <span className="relative z-10 flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        Ver Precios
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                        <span className="inline-flex items-center justify-center rounded-full bg-amber-600 text-white p-2.5 shadow-xl group-hover:scale-110 group-hover:bg-amber-500 transition-all z-20">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </span>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-amber-500/20 text-sm text-stone-200">
                                        <span className="font-semibold">Calidad premium</span>
                                        <span className="font-semibold text-amber-300">Artesanal</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/10 border border-amber-500/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500/20 transition-colors backdrop-blur-sm"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                            Anterior
                        </button>
                        <span className="text-white font-semibold">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/10 border border-amber-500/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500/20 transition-colors backdrop-blur-sm"
                        >
                            Siguiente
                            <ChevronRightIcon className="h-5 w-5" />
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
