import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams, useOutletContext } from 'react-router-dom'
import { getPublicCatalog, Product } from '../../services/product.service'
import { MagnifyingGlassIcon, ShoppingBagIcon, CheckIcon } from '@heroicons/react/24/outline'
import { formatMXN } from '../../utils/format'
import { useCart } from '../../context/CartContext'
import B2BRevealModal from '../../components/B2BRevealModal'
import HeroSlider from '../../components/HeroSlider'
/* ── Quick-add feedback type ───────────────────────────────────────── */
type QuickAddFeedback = { productId: string; size: string } | null

export default function Catalog() {
    const { companyInfo } = (useOutletContext<{ companyInfo: { name: string; logoUrl: string | null } | null }>()) ?? {}
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [usedCompanyId, setUsedCompanyId] = useState<string>('')
    const [searchParams] = useSearchParams()
    const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'
    const { isB2BUnlocked, unlockB2B, addToCart } = useCart()
    const [showModal, setShowModal] = useState(false)

    // Search, filter, pagination state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    // Inicializar desde el query param ?category (viene del nav del header)
    const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || '')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [sort, setSort] = useState('newest')
    // All unique categories derived from the catalog (for the visual carousel)
    const [availableCategories, setAvailableCategories] = useState<string[]>([])

    // Quick-add feedback
    const [quickAdded, setQuickAdded] = useState<QuickAddFeedback>(null)

    // Debounce search (solo para el campo de búsqueda interno)
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(searchInput), 350)
        return () => clearTimeout(timer)
    }, [searchInput])

    // Sincronizar con URL params cuando cambian (nav del header, buscador del header)
    useEffect(() => {
        const urlCategory = searchParams.get('category') || ''
        const urlSearch = searchParams.get('search') || ''
        setSelectedCategory(urlCategory)
        if (urlSearch) {
            setSearchInput(urlSearch)
            setSearchQuery(urlSearch)
        }
    }, [searchParams])

    // Load all available categories once (no filter) to populate the carousel
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await getPublicCatalog(companyId, { page: 1 } as any)
                const prods: Product[] = data?.products ?? (Array.isArray(data) ? data : [])
                const cats = Array.from(
                    new Set(prods.map((p: Product) => p.category).filter(Boolean))
                ) as string[]
                setAvailableCategories(cats.sort())
            } catch { /* silent — carousel queda vacío si falla */ }
        }
        loadCategories()
    }, [companyId])

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
                    setProducts(prev => page === 1 ? data.products : [...prev, ...data.products])
                    setTotalPages(data.pagination?.totalPages || 1)
                    setTotalCount(prevCount => data.pagination?.total || (page === 1 ? data.products.length : prevCount + data.products.length))
                } else if (Array.isArray(data)) {
                    setProducts(prev => page === 1 ? data : [...prev, ...data])
                    setTotalPages(1)
                    setTotalCount(prevCount => page === 1 ? data.length : prevCount + data.length)
                } else {
                    setProducts([])
                    setTotalPages(1)
                    setTotalCount(0)
                }
            } catch (err) {
                if (cancelled) return
                setError('No pudimos cargar el catálogo. Intenta nuevamente.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [companyId, page, searchQuery, selectedCategory, sort])

    useEffect(() => { setPage(1) }, [searchQuery, selectedCategory, sort])

    /* ── Quick-add handler ───────────────────────────────────── */
    const handleQuickAdd = useCallback((product: Product, size: string) => {
        const variant = product.variants.find(v => v.size === size && v.stock > 0)
        if (!variant) return
        addToCart({
            productId: product.id,
            name: product.name,
            size: variant.size,
            color: variant.color,
            quantity: 1,
            price: product.price || 0,
            subtotal: product.price || 0,
            image: product.images?.[0]?.url || '',
        })
        setQuickAdded({ productId: product.id, size })
        setTimeout(() => setQuickAdded(null), 1200)
    }, [addToCart])

    /* ── Get unique sizes with stock for a product ───────────── */
    const getAvailableSizes = (product: Product) => {
        const sizeMap = new Map<string, boolean>()
        product.variants?.forEach(v => {
            if (v.stock > 0 && !sizeMap.has(v.size)) sizeMap.set(v.size, true)
        })
        return Array.from(sizeMap.keys())
    }

    // Intersection Observer for Infinite Scroll
    const loaderRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && page < totalPages) {
                    setPage(p => p + 1)
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        )
        if (loaderRef.current) observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [loading, page, totalPages])

    return (
        <div className="min-h-screen bg-white">

            {/* ══════════════════════════════════════════════════════════
                 FEATURE 1: Enterprise Hero Slider
                 Only shown on the first page when no filters/search are active
               ══════════════════════════════════════════════════════════ */}
            {page === 1 && !searchQuery && !selectedCategory && (
                <HeroSlider companyName={companyInfo?.name} />
            )}

            {/* ══════════════════════════════════════════════════════════
                 FEATURE 2: Category pills — sticky + dynamic
               ══════════════════════════════════════════════════════════ */}
            {availableCategories.length > 1 && (
                <div className="sticky top-0 z-40 bg-white border-b border-stone-100 shadow-sm">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div
                            className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar"
                        >
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${!selectedCategory ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'}`}
                            >
                                Todos
                            </button>
                            <div className="h-4 w-px bg-stone-200 flex-shrink-0" />
                            {availableCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toolbar (Search & Sort) ─────────────────────────────────── */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                        {selectedCategory || 'Todos los Productos'}
                    </h1>
                    <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                        {totalCount}
                    </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                    {/* Search Field */}
                    <div className="relative flex-1 sm:w-64">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full text-sm bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-full pl-9 pr-4 py-2 text-stone-900 placeholder:text-stone-400 transition-colors focus:ring-0 outline-none"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="text-xs sm:text-sm font-medium bg-transparent border-none text-stone-600 focus:outline-none focus:ring-0 cursor-pointer hover:text-stone-900 transition-colors pr-6"
                    >
                        <option value="newest">Más recientes</option>
                        <option value="name_asc">A → Z</option>
                        <option value="name_desc">Z → A</option>
                        <option value="oldest">Más antiguos</option>
                    </select>
                </div>
            </div>

            {/* ── Loading (Eager Initial) ─────────────────────────────────────────── */}
            {loading && page === 1 && (
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                        <p className="text-[11px] tracking-widest uppercase text-stone-400">Cargando colección...</p>
                    </div>
                </div>
            )}

            {/* ── Error ───────────────────────────────────────────────────────────── */}
            {error && !loading && (
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            )}

            {/* ── Empty State ─────────────────────────────────────────────────────── */}
            {!loading && !error && products.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] gap-5 px-6">
                    <ShoppingBagIcon className="h-12 w-12 text-stone-200" />
                    <div className="text-center">
                        <p className="text-xs tracking-[0.25em] uppercase text-stone-400 font-semibold">Colección en preparación</p>
                        <p className="text-stone-500 mt-2 text-sm max-w-xs mx-auto">Estamos actualizando nuestro catálogo. Vuelve pronto.</p>
                    </div>
                    {(searchQuery || selectedCategory) && (
                        <button
                            onClick={() => { setSearchInput(''); setSearchQuery(''); setSelectedCategory(''); }}
                            className="text-[11px] tracking-widest uppercase border-b border-stone-400 text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-colors pb-0.5"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                 FEATURES 2, 3, 4, 5: Product Grid
                 F2: Second-look crossfade on hover
                 F3: Quick-order overlay with sizes
                 F4: Asymmetric grid (1st + every 7th = featured)
                 F5: Stagger reveal animations via IntersectionObserver
               ══════════════════════════════════════════════════════════ */}
            {!loading && !error && products.length > 0 && (
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-20">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {products.map((product, index) => {
                            const hasImage = product.images && product.images.length > 0
                            const hasSecondImage = product.images && product.images.length > 1
                            const inStock = product.variants?.some(v => v.stock > 0)
                            const availableSizes = getAvailableSizes(product)

                            /* F4: Asymmetric featured — first item + every 7th */
                            const isFeatured = index === 0 || (index > 0 && index % 7 === 0)

                            return (
                                <CatalogCard
                                    key={product.id}
                                    product={product}
                                    index={index}
                                    isFeatured={isFeatured}
                                    hasImage={hasImage}
                                    hasSecondImage={hasSecondImage}
                                    inStock={inStock}
                                    availableSizes={availableSizes}
                                    isB2BUnlocked={isB2BUnlocked}
                                    usedCompanyId={usedCompanyId}
                                    quickAdded={quickAdded}
                                    onShowModal={() => setShowModal(true)}
                                    onQuickAdd={handleQuickAdd}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Infinite Scroll Loader ──────────────────────────────────────────── */}
            {page < totalPages && (
                <div ref={loaderRef} className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
                    {loading && page > 1 ? (
                        <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                    ) : (
                        <div className="h-5 text-transparent">Scroll Trigger</div>
                    )}
                </div>
            )}

            {/* Reveal Modal */}
            <B2BRevealModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={(lead) => { unlockB2B(lead); setShowModal(false); }}
                companyId={companyId}
            />

            {/* Hide scrollbar for category ribbon */}
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    )
}


/* ═══════════════════════════════════════════════════════════════════════════
   CatalogCard — Individual product card with all premium features
   ═══════════════════════════════════════════════════════════════════════════ */
interface CatalogCardProps {
    product: Product
    index: number
    isFeatured: boolean
    hasImage: boolean
    hasSecondImage: boolean
    inStock: boolean
    availableSizes: string[]
    isB2BUnlocked: boolean
    usedCompanyId: string
    quickAdded: QuickAddFeedback
    onShowModal: () => void
    onQuickAdd: (product: Product, size: string) => void
}

function CatalogCard({
    product, index, isFeatured, hasImage, hasSecondImage, inStock,
    availableSizes, isB2BUnlocked, usedCompanyId, quickAdded,
    onShowModal, onQuickAdd
}: CatalogCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    /* F5: IntersectionObserver for stagger reveal */
    useEffect(() => {
        const el = cardRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const staggerDelay = Math.min(index % 8, 7) * 60 // stagger within visible batch

    return (
        <div
            ref={cardRef}
            className={`
                group relative flex flex-col bg-white overflow-hidden
                ${isFeatured ? 'sm:col-span-2 sm:row-span-1' : ''}
                ${isVisible ? 'catalog-card-visible' : 'catalog-card-hidden'}
            `}
            style={{ animationDelay: `${staggerDelay}ms` }}
        >
            <Link
                to={`/product/${product.id}?companyId=${usedCompanyId}`}
                className="relative flex flex-col flex-1"
            >
                {/* ── Image Block ─────────────────────────────────── */}
                <div className="relative w-full overflow-hidden bg-white" style={{ paddingBottom: isFeatured ? '100%' : '133.33%' }}>
                    {hasImage ? (
                        <>
                            {/* Primary image. LCP fix: eager load the first 8 images */}
                            <img
                                src={product.images[0].url}
                                alt={product.name}
                                loading={index < 8 ? "eager" : "lazy"}
                                className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.03] ${hasSecondImage ? 'group-hover:opacity-0' : ''}`}
                            />
                            {/* F2: Second-look image — crossfade on hover */}
                            {hasSecondImage && (
                                <img
                                    src={product.images[1].url}
                                    alt={`${product.name} – vista lateral`}
                                    loading={index < 8 ? "eager" : "lazy"}
                                    className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-[1.03]"
                                />
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-50">
                            <div className="w-10 h-10 border border-stone-200 rounded-full flex items-center justify-center">
                                <ShoppingBagIcon className="h-5 w-5 text-stone-300" />
                            </div>
                            <span className="text-[10px] tracking-widest uppercase text-stone-300">Sin foto</span>
                        </div>
                    )}

                    {/* Out of stock overlay */}
                    {!inStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-500 bg-white/90 px-3 py-1.5">Agotado</span>
                        </div>
                    )}

                    {/* Category tag — desktop hover */}
                    {product.category && (
                        <span className="absolute top-3 left-3 text-[9px] tracking-widest uppercase font-semibold text-stone-600 bg-white/90 px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {product.category}
                        </span>
                    )}

                    {/* F4: Featured badge */}
                    {isFeatured && (
                        <span className="absolute top-3 right-3 text-[9px] tracking-widest uppercase font-semibold text-white bg-stone-900/80 backdrop-blur-sm px-2.5 py-1">
                            Destacado
                        </span>
                    )}

                    {/* F3: Quick-order overlay — only for B2B unlocked, has stock, desktop */}
                    {isB2BUnlocked && inStock && availableSizes.length > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-stone-900/90 via-stone-900/70 to-transparent pt-10 pb-3 px-3 hidden sm:block">
                            <p className="text-[9px] tracking-widest uppercase text-white/70 font-semibold mb-2">Agregar rápido</p>
                            <div className="flex flex-wrap gap-1.5">
                                {availableSizes.map(size => {
                                    const justAdded = quickAdded?.productId === product.id && quickAdded?.size === size
                                    return (
                                        <button
                                            key={size}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                onQuickAdd(product, size)
                                            }}
                                            className={`px-2.5 py-1.5 text-[10px] font-semibold rounded transition-all ${justAdded
                                                ? 'bg-emerald-500 text-white scale-110'
                                                : 'bg-white/20 text-white hover:bg-white hover:text-stone-900 backdrop-blur-sm'
                                                }`}
                                        >
                                            {justAdded ? <CheckIcon className="h-3.5 w-3.5 inline" /> : size}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Info ─────────────────────────────────────────── */}
                <div className={`p-3 sm:p-4 flex flex-col gap-1.5 flex-1 ${isFeatured ? 'sm:p-5' : ''}`}>
                    <p className={`text-[11px] sm:text-xs font-semibold text-stone-900 leading-snug line-clamp-2 group-hover:underline underline-offset-2 transition-all ${isFeatured ? 'sm:text-sm' : ''}`}>
                        {product.name}
                    </p>

                    {/* Price or unlock CTA */}
                    {isB2BUnlocked ? (
                        <p className={`text-[11px] sm:text-xs text-stone-500 font-medium ${isFeatured ? 'sm:text-sm' : ''}`}>
                            {product.price
                                ? `${formatMXN(Number(product.price), false)} MXN`
                                : 'Precio a consultar'}
                        </p>
                    ) : (
                        <button
                            onClick={(e) => { e.preventDefault(); onShowModal(); }}
                            className="self-start text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors border-b border-stone-200 hover:border-stone-900 pb-px mt-auto"
                        >
                            Ver precio
                        </button>
                    )}

                    {/* Available sizes hint — only when B2B unlocked */}
                    {isB2BUnlocked && availableSizes.length > 0 && (
                        <p className="text-[10px] text-stone-400 hidden sm:block">
                            Tallas: {availableSizes.slice(0, 6).join(', ')}{availableSizes.length > 6 ? '…' : ''}
                        </p>
                    )}
                </div>
            </Link>
        </div>
    )
}
