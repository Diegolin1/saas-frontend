import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { getProduct, getPublicCatalog, Product, ProductVariant } from '../../services/product.service'
import { Toast } from '../../components/Toast'
import B2BRevealModal from '../../components/B2BRevealModal'
import { formatMXN } from '../../utils/format'
import { ArrowLeftIcon, ShareIcon } from '@heroicons/react/24/outline'

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { addToCart, isB2BUnlocked, unlockB2B } = useCart()

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [orderMatrix, setOrderMatrix] = useState<Record<string, number>>({})
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [showZoom, setShowZoom] = useState(false)
    const [uniqueSizes, setUniqueSizes] = useState<string[]>([])
    const [uniqueColors, setUniqueColors] = useState<string[]>([])
    const [activeColor, setActiveColor] = useState<string>('')
    const thumbRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!id) return
        const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'

        const hydrateProduct = (data: Product) => {
            setProduct(data)
            const sizes = Array.from(new Set(data.variants.map((v: ProductVariant) => v.size))).sort() as string[]
            const colors = Array.from(new Set(data.variants.map((v: ProductVariant) => v.color))).sort() as string[]
            setUniqueSizes(sizes)
            setUniqueColors(colors)
            if (colors.length > 0) setActiveColor(colors[0])
        }

        const fetchData = async () => {
            const token = localStorage.getItem('token')
            if (token) {
                try { const data = await getProduct(id); hydrateProduct(data); setLoading(false); return } catch { /* fallback */ }
            }
            try {
                const response = await getPublicCatalog(companyId)
                const catalog: Product[] = response.products ? response.products : (Array.isArray(response) ? response : [])
                const found = catalog.find((p: Product) => p.id === id)
                if (found) hydrateProduct(found)
                else setFeedback({ message: 'Producto no encontrado.', type: 'error' })
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error desconocido'
                setFeedback({ message: `Error al cargar. ${message}`, type: 'error' })
            } finally { setLoading(false) }
        }
        fetchData()
    }, [id, searchParams])

    // Keyboard nav for zoom
    useEffect(() => {
        if (!showZoom || !product) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowZoom(false)
            if (e.key === 'ArrowRight') setSelectedImageIndex(i => (i + 1) % product.images.length)
            if (e.key === 'ArrowLeft') setSelectedImageIndex(i => (i - 1 + product.images.length) % product.images.length)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [showZoom, product])

    // Scroll thumbnail into view
    useEffect(() => {
        const container = thumbRef.current
        if (!container) return
        const btn = container.children[selectedImageIndex] as HTMLElement
        if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [selectedImageIndex])

    const handleQuantityChange = (color: string, size: string, qty: number) => {
        const variant = product?.variants.find(v => v.color === color && v.size === size)
        if (!variant) return
        if (qty < 0) return
        if (qty > variant.stock) {
            setFeedback({ message: `Solo hay ${variant.stock} unidades (talla ${size}, ${color})`, type: 'warning' })
            setTimeout(() => setFeedback(null), 2500)
            return
        }
        setFeedback(null)
        setOrderMatrix(prev => ({ ...prev, [`${color}-${size}`]: qty }))
    }

    const getTotalPairs = () => Object.values(orderMatrix).reduce((a, b) => a + b, 0)
    const getPrice = () => (product as unknown as Record<string, unknown> & { price?: number })?.price || 0
    const getTotalPrice = () => getTotalPairs() * getPrice()

    const handleAddToOrder = (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault()
        setFeedback(null)
        let added = 0
        Object.entries(orderMatrix).forEach(([key, qty]) => {
            if (qty > 0) {
                const [color, size] = key.split('-')
                const variant = product?.variants.find(v => v.size === size && v.color === color)
                if (variant) {
                    addToCart({ productId: product!.id, variantId: variant.id!, name: product!.name, price: getPrice(), image: product!.images?.[0]?.url || '', size, color, quantity: qty, subtotal: qty * getPrice() })
                    added++
                }
            }
        })
        if (added > 0) {
            setFeedback({ message: `¡${added} variante(s) agregada(s) al carrito!`, type: 'success' })
            setTimeout(() => { setFeedback(null); navigate('/cart') }, 1500)
        } else {
            setFeedback({ message: 'Selecciona al menos un par para continuar.', type: 'warning' })
            setTimeout(() => setFeedback(null), 2000)
        }
    }

    /* ── Loading ─────────────────────────────────────────────────────── */
    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
        </div>
    )

    if (!product) return (
        <div className="flex h-[80vh] items-center justify-center p-6">
            <div className="text-center space-y-4">
                <p className="text-[11px] tracking-widest uppercase text-stone-400">Producto no encontrado</p>
                <button onClick={() => navigate(-1)} className="text-xs tracking-widest uppercase border-b border-stone-400 text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-colors pb-px">
                    Volver al catálogo
                </button>
            </div>
        </div>
    )

    const totalPairs = getTotalPairs()
    const totalPrice = getTotalPrice()
    const isOutOfStock = product.variants.every(v => v.stock === 0)
    const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'

    /* ── Render ──────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-white pb-28 lg:pb-0">
            {feedback && <Toast message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />}

            {/* ── Zoom Modal ─────────────────────────────────────────── */}
            {showZoom && product.images?.length > 0 && (
                <div
                    className="fixed inset-0 z-50 bg-black flex items-center justify-center"
                    onClick={() => setShowZoom(false)}
                >
                    <button aria-label="Cerrar modal" className="absolute top-5 right-5 z-10 text-white/60 hover:text-white p-3" onClick={() => setShowZoom(false)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {product.images.length > 1 && (
                        <>
                            <button aria-label="Imagen anterior" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i - 1 + product.images.length) % product.images.length) }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white z-10">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button aria-label="Imagen siguiente" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i + 1) % product.images.length) }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white z-10">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}
                    <img
                        src={product.images[selectedImageIndex].url}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="max-h-[92vh] max-w-[96vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {product.images.length > 1 && (
                        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] tracking-widest uppercase text-white/40">
                            {selectedImageIndex + 1} / {product.images.length}
                        </span>
                    )}
                </div>
            )}

            {/* ── Slim Top Bar ───────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-100 flex items-center justify-between px-4 sm:px-8 h-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span className="text-[11px] tracking-widest uppercase hidden sm:inline">Catálogo</span>
                </button>
                <p className="text-[11px] tracking-[0.2em] uppercase font-semibold text-stone-500 truncate max-w-[50%] text-center">{product.name}</p>
                <button
                    onClick={() => navigator.share ? navigator.share({ title: product.name, url: window.location.href }) : navigator.clipboard.writeText(window.location.href)}
                    className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                    aria-label="Compartir"
                >
                    <ShareIcon className="h-4 w-4" />
                </button>
            </div>

            {/* ── Main layout: stacked mobile / side-by-side desktop ── */}
            <div className="max-w-screen-xl mx-auto lg:grid lg:grid-cols-2 lg:gap-0 lg:min-h-[90vh]">

                {/* ── LEFT: Gallery ─────────────────────────────────── */}
                <div className="relative">
                    {/* Main image */}
                    <div
                        className="relative w-full overflow-hidden bg-stone-100 cursor-zoom-in"
                        style={{ paddingBottom: '125%' }}
                        onClick={() => product.images?.length > 0 && setShowZoom(true)}
                    >
                        {product.images?.length > 0 ? (
                            <img
                                key={selectedImageIndex}
                                src={product.images[selectedImageIndex].url}
                                alt={`${product.name} – ${selectedImageIndex + 1}`}
                                loading="eager"
                                decoding="sync"
                                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                        )}
                        {product.images?.length > 1 && (
                            <>
                                <button
                                    aria-label="Imagen anterior"
                                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i - 1 + product.images.length) % product.images.length) }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white transition-colors shadow-sm"
                                >
                                    <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    aria-label="Imagen siguiente"
                                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i + 1) % product.images.length) }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white transition-colors shadow-sm"
                                >
                                    <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <span className="absolute bottom-4 right-4 text-[10px] tracking-widest text-white uppercase bg-black/40 px-2.5 py-1">
                                    {selectedImageIndex + 1} / {product.images.length}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Thumbnails — horizontal scroll strip */}
                    {product.images?.length > 1 && (
                        <div ref={thumbRef} className="flex gap-1.5 p-3 overflow-x-auto no-scrollbar border-b border-stone-100">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`flex-shrink-0 w-16 h-20 overflow-hidden transition-all duration-200 ${idx === selectedImageIndex ? 'ring-2 ring-stone-900 ring-offset-1' : 'opacity-50 hover:opacity-80'}`}
                                >
                                    <img src={img.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Product Info + Order ────────────────────── */}
                <div className="lg:overflow-y-auto lg:h-screen lg:sticky lg:top-0 px-5 sm:px-8 lg:px-12 py-8 space-y-8">

                    {/* Header */}
                    <div className="space-y-2 border-b border-stone-100 pb-6">
                        {product.category && (
                            <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold">{product.category}</p>
                        )}
                        <h1 data-testid="product-title" className="text-xl sm:text-2xl font-semibold text-stone-900 leading-snug">{product.name}</h1>
                        <p className="text-xs text-stone-400 tracking-widest uppercase">SKU: {product.sku || 'N/A'}</p>

                        {/* Price */}
                        <div className="pt-2">
                            {isB2BUnlocked ? (
                                getPrice() > 0 ? (
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-semibold text-stone-900">{formatMXN(getPrice())}</p>
                                        <span className="text-xs tracking-widest uppercase text-stone-400">/ par</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-stone-400 italic">Precio a consultar</p>
                                )
                            ) : (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-1 inline-flex items-center gap-2 bg-stone-900 text-white text-xs tracking-widest uppercase px-6 py-3 hover:bg-stone-700 transition-colors font-medium"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Desbloquear precios
                                </button>
                            )}
                        </div>
                        {isOutOfStock && (
                            <p className="text-[11px] tracking-widest uppercase text-red-500 font-semibold pt-1">Sin existencias</p>
                        )}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <p className="text-sm text-stone-500 leading-relaxed">{product.description}</p>
                    )}

                    {/* ── Order matrix ─────────────────────────────── */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold">Seleccionar pares</p>
                            {totalPairs > 0 && (
                                <div className="text-right">
                                    <p className="text-xs text-stone-500">{totalPairs} {totalPairs === 1 ? 'par' : 'pares'}</p>
                                    {isB2BUnlocked && totalPrice > 0 && (
                                        <p className="text-sm font-semibold text-stone-900">{formatMXN(totalPrice)}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Color tabs */}
                        {uniqueColors.length > 1 && (
                            <div className="flex gap-2 flex-wrap">
                                {uniqueColors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setActiveColor(color)}
                                        className={`text-[11px] tracking-widest uppercase px-4 py-2 border transition-all ${activeColor === color ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-500 hover:text-stone-800'}`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        )}
                        {uniqueColors.length === 1 && (
                            <p className="text-sm text-stone-700 font-medium">{uniqueColors[0]}</p>
                        )}

                        {/* Size grid — only for active color */}
                        {(activeColor ? [activeColor] : uniqueColors).map(color => (
                            <div key={color} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {uniqueSizes.map(size => {
                                    const key = `${color}-${size}`
                                    const variant = product.variants.find(v => v.color === color && v.size === size)
                                    const disabled = !variant || variant.stock === 0
                                    return (
                                        <div
                                            key={key}
                                            className={`relative border flex flex-col items-center gap-1.5 p-2.5 transition-all ${disabled ? 'border-stone-100 bg-stone-50 text-stone-300' : 'border-stone-200 bg-white hover:border-stone-700'}`}
                                        >
                                            <span className={`text-xs font-semibold tracking-wide ${disabled ? 'text-stone-300' : 'text-stone-900'}`}>{size}</span>
                                            {disabled ? (
                                                <span className="text-[9px] tracking-widest uppercase text-stone-300">N/D</span>
                                            ) : (
                                                <>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={variant!.stock}
                                                        placeholder="0"
                                                        value={orderMatrix[key] || ''}
                                                        onChange={(e) => handleQuantityChange(color, size, parseInt(e.target.value) || 0)}
                                                        className="w-full text-center text-sm font-semibold border-0 bg-transparent focus:outline-none focus:ring-0 text-stone-900 placeholder:text-stone-300"
                                                    />
                                                    <span className="text-[9px] tracking-wider text-stone-300">{variant!.stock} disp.</span>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}

                        {/* Desktop CTA */}
                        <div className="hidden lg:block pt-2">
                            {isB2BUnlocked ? (
                                <button
                                    onClick={handleAddToOrder}
                                    disabled={totalPairs === 0}
                                    className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-semibold transition-all disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed bg-stone-900 text-white hover:bg-stone-700"
                                >
                                    {totalPairs === 0 ? 'Selecciona pares para continuar' : `Agregar ${totalPairs} par${totalPairs > 1 ? 'es' : ''} al pedido`}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-semibold bg-stone-900 text-white hover:bg-stone-700 transition-all"
                                >
                                    Iniciar sesión para comprar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* WhatsApp CTA */}
                    <div className="border-t border-stone-100 pt-6">
                        <button
                            onClick={() => { const msg = encodeURIComponent(`Hola, quiero cotizar el modelo ${product.name} (SKU: ${product.sku || 'N/A'}).`); window.open(`https://wa.me/?text=${msg}`, '_blank') }}
                            className="w-full flex items-center justify-center gap-2.5 border border-stone-200 py-3 text-[11px] tracking-widest uppercase text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all font-medium"
                        >
                            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            Cotizar por WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Sticky CTA ──────────────────────────────────── */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 p-4 shadow-2xl shadow-black/10">
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        {totalPairs > 0 ? (
                            <div>
                                <p className="text-xs font-semibold text-stone-900">{totalPairs} par{totalPairs > 1 ? 'es' : ''} seleccionado{totalPairs > 1 ? 's' : ''}</p>
                                {isB2BUnlocked && totalPrice > 0 && <p className="text-xs text-stone-400">{formatMXN(totalPrice)}</p>}
                            </div>
                        ) : (
                            <p className="text-xs text-stone-400 truncate">{product.name}</p>
                        )}
                    </div>
                    {isB2BUnlocked ? (
                        <button
                            onClick={handleAddToOrder}
                            disabled={totalPairs === 0}
                            className="text-[11px] tracking-widest uppercase font-semibold px-6 py-3 bg-stone-900 text-white hover:bg-stone-700 transition-all disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {totalPairs === 0 ? 'Seleccionar' : 'Agregar al pedido'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-[11px] tracking-widest uppercase font-semibold px-6 py-3 bg-stone-900 text-white hover:bg-stone-700 transition-all flex-shrink-0"
                        >
                            Desbloquear precios
                        </button>
                    )}
                </div>
            </div>

            <B2BRevealModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={(lead) => { unlockB2B(lead); setShowModal(false) }}
                companyId={companyId}
            />

            <style>{`.no-scrollbar::-webkit-scrollbar{display:none;}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    )
}
