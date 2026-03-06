import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { getProduct, getPublicCatalog, Product, ProductVariant } from '../../services/product.service'
import { Toast } from '../../components/Toast'
import B2BRevealModal from '../../components/B2BRevealModal'

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

    // Image gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [showZoom, setShowZoom] = useState(false)
    const [zoomScale, setZoomScale] = useState(1)

    // Derived state for matrix headers
    const [uniqueSizes, setUniqueSizes] = useState<string[]>([])
    const [uniqueColors, setUniqueColors] = useState<string[]>([])

    useEffect(() => {
        if (!id) return;
        const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'

        const hydrateProduct = (data: Product) => {
            setProduct(data)
            const sizes = Array.from(new Set(data.variants.map((v: ProductVariant) => v.size))).sort()
            const colors = Array.from(new Set(data.variants.map((v: ProductVariant) => v.color))).sort()
            setUniqueSizes(sizes as string[])
            setUniqueColors(colors as string[])
        }

        const fetchData = async () => {
            const token = localStorage.getItem('token')

            // Si hay token, intenta endpoint privado primero
            if (token) {
                try {
                    const data = await getProduct(id)
                    hydrateProduct(data)
                    setLoading(false)
                    return
                } catch {
                    // Endpoint privado falló, fallback a catálogo público
                }
            }

            // Sin token o endpoint privado falló -> usar catálogo público
            try {
                const response = await getPublicCatalog(companyId)
                // Support both new paginated format and legacy array format
                const catalog: Product[] = response.products ? response.products : (Array.isArray(response) ? response : [])

                const found = catalog.find((p: Product) => p.id === id)
                if (found) {
                    hydrateProduct(found)
                } else {
                    setFeedback({ message: `Producto no encontrado en el catálogo.`, type: 'error' })
                }
            } catch (err: unknown) {
                console.error('[ProductDetail] Error cargando catálogo público:', err)
                const message = err instanceof Error ? err.message : 'Error desconocido';
                console.error('[ProductDetail] Error detalles:', message)
                setFeedback({ message: `No se pudo cargar el catálogo. Error: ${message}`, type: 'error' })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id, searchParams])

    const handleQuantityChange = (color: string, size: string, qty: number) => {
        const key = `${color}-${size}`
        const variant = product?.variants.find(v => v.color === color && v.size === size)
        if (!variant) {
            setFeedback({ message: 'Variante no disponible.', type: 'error' });
            return;
        }
        if (qty < 0) {
            setFeedback({ message: 'No puedes seleccionar cantidades negativas.', type: 'warning' });
            setTimeout(() => setFeedback(null), 2000);
            return;
        }
        if (qty > variant.stock) {
            setFeedback({ message: `Solo hay ${variant.stock} unidades disponibles en Talla ${size} Color ${color}`, type: 'warning' });
            setTimeout(() => setFeedback(null), 3000);
            return;
        }
        setFeedback(null);
        setOrderMatrix(prev => ({
            ...prev,
            [key]: qty
        }))
    }

    const getTotalPairs = () => {
        return Object.values(orderMatrix).reduce((acc, curr) => acc + curr, 0)
    }

    // TODO: Fetch price from backend (PriceList). For now use static or assume product has price.
    // Since backend Product doesn't always have price attached on GET /products/:id directly unless included.
    // We will update backend later to include price. For MVP let's assume a default.
    const getPrice = () => {
        // @ts-ignore - Backend currently needs to send price. We'll fallback to a mock or extracted value.
        return product?.price || 0;
    }

    const getTotalPrice = () => {
        return getTotalPairs() * (getPrice() || 0)
    }

    const handleAddToOrder = (e: React.FormEvent) => {
        e.preventDefault()
        setFeedback(null);
        let itemsAdded = 0;
        Object.entries(orderMatrix).forEach(([key, qty]) => {
            if (qty > 0) {
                const [color, size] = key.split('-')
                const variant = product?.variants.find(v => v.size === size && v.color === color);
                if (variant) {
                    addToCart({
                        productId: product!.id,
                        variantId: variant.id,
                        name: product!.name,
                        price: getPrice(),
                        image: product!.images && product!.images.length > 0 ? product!.images[0].url : '',
                        size: size,
                        color: color,
                        quantity: qty,
                        subtotal: qty * getPrice()
                    })
                    itemsAdded++
                }
            }
        })
        if (itemsAdded > 0) {
            setFeedback({ message: `¡${itemsAdded} producto(s) agregado(s) al carrito!`, type: 'success' });
            setTimeout(() => {
                setFeedback(null);
                navigate('/cart');
            }, 1500);
        } else {
            setFeedback({ message: 'Por favor selecciona al menos un par.', type: 'warning' });
            setTimeout(() => setFeedback(null), 2000);
        }
    }

    // Image gallery handlers
    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index)
    }

    const handleNextImage = () => {
        if (product && product.images.length > 0) {
            setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
        }
    }

    const handlePrevImage = () => {
        if (product && product.images.length > 0) {
            setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
        }
    }

    const handleZoomClick = () => {
        setShowZoom(true)
        setZoomScale(1)
    }

    const handleCloseZoom = () => {
        setShowZoom(false)
        setZoomScale(1)
    }

    const handleZoomIn = () => {
        setZoomScale((prev) => Math.min(prev + 0.5, 3))
    }

    const handleZoomOut = () => {
        setZoomScale((prev) => Math.max(prev - 0.5, 1))
    }

    // Keyboard navigation for zoom
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showZoom) return

            if (e.key === 'Escape') {
                handleCloseZoom()
            } else if (e.key === 'ArrowRight') {
                handleNextImage()
            } else if (e.key === 'ArrowLeft') {
                handlePrevImage()
            } else if (e.key === '+' || e.key === '=') {
                handleZoomIn()
            } else if (e.key === '-') {
                handleZoomOut()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showZoom, product])

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950 text-white flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
                <p className="text-amber-200">Cargando producto...</p>
            </div>
        </div>
    )

    if (!product) {
        const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'
        return (
            <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950 text-white flex items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-lg bg-stone-900/60 backdrop-blur-xl rounded-3xl border border-amber-500/30 shadow-2xl p-8">
                    <p className="text-amber-200 text-xl font-bold">Producto no encontrado</p>
                    <p className="text-stone-200 text-sm">CompanyId usado: {companyId}</p>
                    <p className="text-stone-200 text-sm">Product ID: {id}</p>
                    <p className="text-stone-300 text-xs mt-2">Abre la consola del navegador (F12) para más detalles.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all shadow-lg"
                    >
                        Volver al catálogo
                    </button>
                </div>
            </div>
        )
    }

    // Insignias premium
    const isBestSeller = product.tags?.includes('best-seller');
    const isOutOfStock = product.variants.every(v => v.stock === 0);

    const shareUrl = window.location.origin + '/product/' + product.id;

    const totalPairs = getTotalPairs()
    const totalPrice = getTotalPrice()

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950 text-white">
            {feedback && (
                <Toast
                    message={feedback.message}
                    type={feedback.type}
                    onClose={() => setFeedback(null)}
                />
            )}

            {/* Zoom Modal */}
            {showZoom && product.images && product.images.length > 0 && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={handleCloseZoom}
                >
                    <button
                        onClick={handleCloseZoom}
                        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-amber-900/80 hover:bg-amber-800 text-white transition-all"
                        title="Cerrar (ESC)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {product.images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                className="absolute left-4 z-10 p-3 rounded-full bg-amber-900/80 hover:bg-amber-800 text-white transition-all"
                                title="Anterior (←)"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                className="absolute right-4 z-10 p-3 rounded-full bg-amber-900/80 hover:bg-amber-800 text-white transition-all"
                                title="Siguiente (→)"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={product.images[selectedImageIndex].url}
                            alt={`${product.name} - Vista ${selectedImageIndex + 1}`}
                            className="max-w-full max-h-[90vh] object-contain transition-transform duration-300"
                            style={{ transform: `scale(${zoomScale})` }}
                        />

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-amber-900/80 rounded-full px-4 py-2">
                            <button
                                onClick={handleZoomOut}
                                disabled={zoomScale <= 1}
                                className="p-2 rounded-full bg-amber-800/50 hover:bg-amber-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                                title="Alejar (-)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="px-3 py-2 text-white font-semibold min-w-[60px] text-center">
                                {Math.round(zoomScale * 100)}%
                            </span>
                            <button
                                onClick={handleZoomIn}
                                disabled={zoomScale >= 3}
                                className="p-2 rounded-full bg-amber-800/50 hover:bg-amber-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                                title="Acercar (+)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {product.images.length > 1 && (
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-amber-900/80 rounded-full px-4 py-2 text-white text-sm font-semibold">
                                {selectedImageIndex + 1} / {product.images.length}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Gallery */}
                    <div className="lg:col-span-3 space-y-4 order-1 lg:order-none">
                        {/* Main Image */}
                        <div className="relative group overflow-hidden rounded-3xl border border-amber-500/20 shadow-2xl bg-stone-900">
                            {product.images && product.images.length > 0 ? (
                                <>
                                    <img
                                        src={product.images[selectedImageIndex].url}
                                        alt={`${product.name} - Vista ${selectedImageIndex + 1}`}
                                        className="w-full h-[340px] sm:h-[420px] lg:h-[520px] object-cover object-center transition-all duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                    {/* Zoom button overlay */}
                                    <button
                                        onClick={handleZoomClick}
                                        className="absolute top-4 right-4 p-3 rounded-full bg-amber-900/80 hover:bg-amber-800 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                        title="Ver en grande"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </button>

                                    {/* Navigation arrows for multiple images */}
                                    {product.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-amber-900/80 hover:bg-amber-800 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-amber-900/80 hover:bg-amber-800 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>

                                            {/* Image counter */}
                                            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-amber-900/90 backdrop-blur-sm text-white text-sm font-semibold">
                                                {selectedImageIndex + 1} / {product.images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="h-[340px] sm:h-[420px] lg:h-[520px] flex items-center justify-center text-amber-300">
                                    <div className="text-center space-y-2">
                                        <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p>Sin imagen disponible</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-stone-900/50">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleImageClick(idx)}
                                        className={`flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl transition-all duration-300 ${idx === selectedImageIndex
                                                ? 'ring-3 ring-amber-500 shadow-lg shadow-amber-500/50 scale-105'
                                                : 'ring-2 ring-stone-700/50 hover:ring-amber-400/50 opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Vista ${idx + 1}`}
                                            className="w-full h-full object-cover object-center"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info + Order */}
                    <div className="lg:col-span-2 space-y-6 order-2 lg:order-none">
                        <div className="bg-stone-900/60 backdrop-blur-xl rounded-3xl border border-amber-500/30 shadow-2xl p-6 text-stone-50">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-semibold">Calzado Premium</p>
                                    <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg leading-tight">{product.name}</h1>
                                    <p className="text-sm text-amber-200 font-semibold mt-1">SKU: {product.sku || 'N/A'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {isBestSeller && <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-lg">Más vendido</span>}
                                    {isOutOfStock && <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg">Sin stock</span>}
                                </div>
                            </div>
                            <p className="text-lg text-stone-100 leading-relaxed">{product.description || 'Calzado de calidad premium, diseñado para mayoristas exigentes.'}</p>

                            <div className="mt-6 p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/40 to-stone-900/40 backdrop-blur">
                                <p className="text-sm text-amber-200 font-semibold mb-1">Precio mayorista</p>
                                {isB2BUnlocked ? (
                                    <>
                                        <p className="text-4xl font-display font-bold text-white drop-shadow-lg">
                                            {getPrice() ? `$${getPrice().toLocaleString()} MXN` : 'Precio a consultar'}
                                        </p>
                                        <p className="text-xs text-amber-100 mt-2">Confirma volumen y tallas para cotizar.</p>
                                    </>
                                ) : (
                                    <div>
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="mt-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-all"
                                        >
                                            Ver Precio Mayorista
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-500 transition-all"
                                    onClick={() => navigator.share ? navigator.share({ title: product.name, url: shareUrl }) : navigator.clipboard.writeText(shareUrl)}
                                >
                                    Compartir modelo
                                </button>
                                <button
                                    className="inline-flex items-center justify-center rounded-full border-2 border-amber-500/60 px-6 py-3 text-sm font-bold text-amber-200 hover:bg-amber-600/20 transition-all"
                                    onClick={() => {
                                        const msg = encodeURIComponent(`Hola, quiero cotizar el modelo ${product.name} (SKU ${product.sku || 'N/A'}).`)
                                        window.open(`https://wa.me/?text=${msg}`, '_blank')
                                    }}
                                >
                                    Cotizar por WhatsApp
                                </button>
                            </div>
                        </div>

                        <div className="bg-stone-900/60 backdrop-blur-xl rounded-3xl border border-amber-500/30 shadow-2xl p-6 text-stone-50">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.12em] text-amber-300 font-semibold">Pedido por talla y color</p>
                                    <p className="text-xl font-display font-bold text-white">Selecciona pares</p>
                                </div>
                                <div className="text-right text-sm text-amber-100 font-semibold">
                                    <div>Total pares: {totalPairs}</div>
                                    <div>Total: ${totalPrice.toLocaleString()}</div>
                                </div>
                            </div>

                            <form className="space-y-5" onSubmit={handleAddToOrder}>
                                {uniqueColors.map((color) => (
                                    <div key={color} className="rounded-2xl border border-amber-500/20 bg-stone-900/50 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-white">{color}</span>
                                            <span className="text-xs text-amber-200">Stock por talla</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {uniqueSizes.map((size) => {
                                                const key = `${color}-${size}`
                                                const variant = product.variants.find(v => v.color === color && v.size === size)
                                                if (!variant) {
                                                    return (
                                                        <div key={key} className="rounded-xl border border-stone-700 bg-stone-900/60 text-center py-2 text-xs text-stone-500">{size}</div>
                                                    )
                                                }
                                                const disabled = variant.stock === 0;
                                                return (
                                                    <div key={key} className={`rounded-xl border px-3 py-2 flex flex-col gap-1 text-center transition-all ${disabled ? 'border-red-500/40 bg-red-950/30 text-red-200' : 'border-amber-500/40 bg-stone-950/70 text-amber-50 hover:border-amber-400/60'}`}>
                                                        <span className="text-sm font-bold text-white">{size}</span>
                                                        {disabled ? (
                                                            <span className="text-[11px] font-semibold">Agotado</span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={variant.stock}
                                                                placeholder="0"
                                                                className="w-full rounded-lg bg-white text-stone-900 text-center text-sm font-semibold focus:ring-amber-500 focus:border-amber-500 border-amber-300/50"
                                                                value={orderMatrix[key] || ''}
                                                                onChange={(e) => handleQuantityChange(color, size, parseInt(e.target.value) || 0)}
                                                            />
                                                        )}
                                                        {!disabled && <span className="text-[11px] text-amber-200">Disp: {variant.stock}</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {isB2BUnlocked ? (
                                    <button
                                        type="submit"
                                        disabled={totalPairs === 0}
                                        className="w-full rounded-full bg-amber-600 text-white font-bold py-4 text-lg shadow-xl hover:bg-amber-500 transition-all disabled:bg-stone-700 disabled:text-stone-400 disabled:cursor-not-allowed"
                                    >
                                        Agregar al pedido
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(true)}
                                        className="w-full rounded-full bg-stone-700 text-stone-200 font-bold py-4 text-lg shadow-xl hover:bg-stone-600 transition-all border border-stone-500"
                                    >
                                        Ingresa para Comprar
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile sticky bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-stone-900/95 backdrop-blur border-t border-amber-500/30 p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-amber-50">
                        <div>Total pares: {totalPairs}</div>
                        <div>Total: ${totalPrice.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={(e) => handleAddToOrder(e as any)}
                        disabled={totalPairs === 0}
                        className="rounded-full bg-amber-600 text-white font-bold px-6 py-3 shadow-xl hover:bg-amber-500 transition-all disabled:bg-stone-700 disabled:text-stone-400 disabled:cursor-not-allowed"
                    >
                        Agregar
                    </button>
                </div>
            </div>

            <B2BRevealModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={(lead) => {
                    unlockB2B(lead);
                    setShowModal(false);
                }}
                companyId={searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'}
            />
        </div>
    )
}
