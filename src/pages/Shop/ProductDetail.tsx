import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { getProduct, getPublicCatalog, Product, ProductVariant } from '../../services/product.service'
import { Toast } from '../../components/Toast'
import B2BRevealModal from '../../components/B2BRevealModal'
import { formatMXN } from '../../utils/format'

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
    const [zoomScale, setZoomScale] = useState(1)

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

            if (token) {
                try {
                    const data = await getProduct(id)
                    hydrateProduct(data)
                    setLoading(false)
                    return
                } catch {
                    // fallback to public catalog
                }
            }

            try {
                const response = await getPublicCatalog(companyId)
                const catalog: Product[] = response.products ? response.products : (Array.isArray(response) ? response : [])
                const found = catalog.find((p: Product) => p.id === id)
                if (found) {
                    hydrateProduct(found)
                } else {
                    setFeedback({ message: 'Producto no encontrado en el catálogo.', type: 'error' })
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error desconocido';
                setFeedback({ message: `No se pudo cargar el catálogo. ${message}`, type: 'error' })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id, searchParams])

    const handleQuantityChange = (color: string, size: string, qty: number) => {
        const key = `${color}-${size}`
        const variant = product?.variants.find(v => v.color === color && v.size === size)
        if (!variant) { setFeedback({ message: 'Variante no disponible.', type: 'error' }); return; }
        if (qty < 0) { setFeedback({ message: 'No puedes seleccionar cantidades negativas.', type: 'warning' }); setTimeout(() => setFeedback(null), 2000); return; }
        if (qty > variant.stock) { setFeedback({ message: `Solo hay ${variant.stock} unidades disponibles en Talla ${size} Color ${color}`, type: 'warning' }); setTimeout(() => setFeedback(null), 3000); return; }
        setFeedback(null);
        setOrderMatrix(prev => ({ ...prev, [key]: qty }))
    }

    const getTotalPairs = () => Object.values(orderMatrix).reduce((acc, curr) => acc + curr, 0)
    // @ts-ignore
    const getPrice = () => product?.price || 0;
    const getTotalPrice = () => getTotalPairs() * getPrice()

    const handleAddToOrder = (e: React.FormEvent) => {
        e.preventDefault()
        setFeedback(null);
        let itemsAdded = 0;
        Object.entries(orderMatrix).forEach(([key, qty]) => {
            if (qty > 0) {
                const [color, size] = key.split('-')
                const variant = product?.variants.find(v => v.size === size && v.color === color);
                if (variant) {
                    addToCart({ productId: product!.id, variantId: variant.id, name: product!.name, price: getPrice(), image: product!.images?.[0]?.url || '', size, color, quantity: qty, subtotal: qty * getPrice() })
                    itemsAdded++
                }
            }
        })
        if (itemsAdded > 0) {
            setFeedback({ message: `¡${itemsAdded} producto(s) agregado(s) al carrito!`, type: 'success' });
            setTimeout(() => { setFeedback(null); navigate('/cart'); }, 1500);
        } else {
            setFeedback({ message: 'Por favor selecciona al menos un par.', type: 'warning' });
            setTimeout(() => setFeedback(null), 2000);
        }
    }

    const handleNextImage = () => { if (product && product.images.length > 0) setSelectedImageIndex((prev) => (prev + 1) % product.images.length) }
    const handlePrevImage = () => { if (product && product.images.length > 0) setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length) }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showZoom) return
            if (e.key === 'Escape') { setShowZoom(false); setZoomScale(1); }
            else if (e.key === 'ArrowRight') handleNextImage()
            else if (e.key === 'ArrowLeft') handlePrevImage()
            else if (e.key === '+' || e.key === '=') setZoomScale(s => Math.min(s + 0.5, 3))
            else if (e.key === '-') setZoomScale(s => Math.max(s - 0.5, 1))
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showZoom, product])

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-brand-500 mx-auto"></div>
                <p className="text-sm text-slate-500 font-medium">Cargando producto...</p>
            </div>
        </div>
    )

    if (!product) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-md">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Producto no encontrado</h2>
                    <p className="text-sm text-slate-500">No pudimos localizar este producto en el catálogo.</p>
                    <button onClick={() => navigate('/')} className="mt-4 px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
                        Volver al catálogo
                    </button>
                </div>
            </div>
        )
    }

    const isBestSeller = product.tags?.includes('best-seller');
    const isOutOfStock = product.variants.every(v => v.stock === 0);
    const shareUrl = window.location.origin + '/product/' + product.id;
    const totalPairs = getTotalPairs()
    const totalPrice = getTotalPrice()

    return (
        <div className="min-h-screen bg-white">
            {feedback && <Toast message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />}

            {/* Zoom Modal */}
            {showZoom && product.images?.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => { setShowZoom(false); setZoomScale(1); }}>
                    <button onClick={() => { setShowZoom(false); setZoomScale(1); }} className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all" title="Cerrar (ESC)">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {product.images.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}
                    <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <img src={product.images[selectedImageIndex].url} alt={`${product.name} - Vista ${selectedImageIndex + 1}`} className="max-w-full max-h-[90vh] object-contain transition-transform duration-300" style={{ transform: `scale(${zoomScale})` }} />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 rounded-full px-4 py-2">
                            <button onClick={() => setZoomScale(s => Math.max(s - 0.5, 1))} disabled={zoomScale <= 1} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            </button>
                            <span className="px-3 py-2 text-white font-semibold min-w-[60px] text-center">{Math.round(zoomScale * 100)}%</span>
                            <button onClick={() => setZoomScale(s => Math.min(s + 0.5, 3))} disabled={zoomScale >= 3} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                        {product.images.length > 1 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-4 py-2 text-white text-sm font-semibold">
                                {selectedImageIndex + 1} / {product.images.length}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Gallery */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {product.images?.length > 0 ? (
                                <>
                                    <img src={product.images[selectedImageIndex].url} alt={`${product.name} - Vista ${selectedImageIndex + 1}`} className="w-full h-[340px] sm:h-[420px] lg:h-[520px] object-cover object-center transition-all duration-500" />
                                    <button onClick={() => { setShowZoom(true); setZoomScale(1); }} className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm" title="Ver en grande">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                    </button>
                                    {product.images.length > 1 && (
                                        <>
                                            <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium">
                                                {selectedImageIndex + 1} / {product.images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="h-[340px] sm:h-[420px] lg:h-[520px] flex items-center justify-center text-slate-300">
                                    <div className="text-center space-y-2">
                                        <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-sm">Sin imagen disponible</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images?.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {product.images.map((img, idx) => (
                                    <button key={idx} onClick={() => setSelectedImageIndex(idx)}
                                        className={`flex-shrink-0 w-20 h-20 overflow-hidden rounded-xl transition-all duration-200 border-2 ${idx === selectedImageIndex ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'}`}>
                                        <img src={img.url} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info + Order */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Info Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-brand-500 font-semibold">{product.category || 'Producto'}</p>
                                    <h1 className="text-2xl font-display font-bold text-slate-900 leading-tight mt-1">{product.name}</h1>
                                    <p className="text-sm text-slate-400 font-medium mt-1">SKU: {product.sku || 'N/A'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {isBestSeller && <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold">Más vendido</span>}
                                    {isOutOfStock && <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">Sin stock</span>}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{product.description || 'Producto de calidad premium para mayoristas.'}</p>

                            {/* Price */}
                            <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-xs text-slate-500 font-medium mb-1">Precio mayorista</p>
                                {isB2BUnlocked ? (
                                    <p className="text-3xl font-display font-bold text-slate-900">
                                        {getPrice() ? formatMXN(getPrice()) : 'Precio a consultar'}
                                    </p>
                                ) : (
                                    <button onClick={() => setShowModal(true)} className="mt-1 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all">
                                        Ver Precio Mayorista
                                    </button>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                                    onClick={() => navigator.share ? navigator.share({ title: product.name, url: shareUrl }) : navigator.clipboard.writeText(shareUrl)}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                                    Compartir
                                </button>
                                <button className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors"
                                    onClick={() => { const msg = encodeURIComponent(`Hola, quiero cotizar el modelo ${product.name} (SKU ${product.sku || 'N/A'}).`); window.open(`https://wa.me/?text=${msg}`, '_blank'); }}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    Cotizar por WhatsApp
                                </button>
                            </div>
                        </div>

                        {/* Order Matrix */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Pedido por talla y color</p>
                                    <p className="text-lg font-display font-bold text-slate-900">Selecciona pares</p>
                                </div>
                                <div className="text-right text-sm font-medium text-slate-600">
                                    <div>Total pares: <span className="font-bold text-slate-900">{totalPairs}</span></div>
                                    {isB2BUnlocked && <div>Total: <span className="font-bold text-brand-600">{formatMXN(totalPrice)}</span></div>}
                                </div>
                            </div>

                            <form className="space-y-4" onSubmit={handleAddToOrder}>
                                {uniqueColors.map((color) => (
                                    <div key={color} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-800">{color}</span>
                                            <span className="text-xs text-slate-400">Stock por talla</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {uniqueSizes.map((size) => {
                                                const key = `${color}-${size}`
                                                const variant = product.variants.find(v => v.color === color && v.size === size)
                                                if (!variant) return <div key={key} className="rounded-lg border border-slate-200 bg-white text-center py-2 text-xs text-slate-300">{size}</div>
                                                const disabled = variant.stock === 0;
                                                return (
                                                    <div key={key} className={`rounded-lg border px-2 py-2 flex flex-col gap-1 text-center transition-all ${disabled ? 'border-red-200 bg-red-50 text-red-400' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'}`}>
                                                        <span className="text-sm font-bold">{size}</span>
                                                        {disabled ? (
                                                            <span className="text-[11px] font-semibold">Agotado</span>
                                                        ) : (
                                                            <input type="number" min="0" max={variant.stock} placeholder="0"
                                                                className="w-full rounded-md bg-slate-50 text-center text-sm font-semibold focus:ring-brand-500 focus:border-brand-500 border-slate-200"
                                                                value={orderMatrix[key] || ''}
                                                                onChange={(e) => handleQuantityChange(color, size, parseInt(e.target.value) || 0)} />
                                                        )}
                                                        {!disabled && <span className="text-[10px] text-slate-400">Disp: {variant.stock}</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {isB2BUnlocked ? (
                                    <button type="submit" disabled={totalPairs === 0}
                                        className="w-full rounded-xl bg-brand-500 text-white font-bold py-3.5 text-sm shadow-sm hover:bg-brand-600 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
                                        Agregar al pedido
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => setShowModal(true)}
                                        className="w-full rounded-xl bg-slate-100 text-slate-600 font-bold py-3.5 text-sm hover:bg-slate-200 transition-all border border-slate-200">
                                        Ingresa para Comprar
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile sticky bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">
                        <div>{totalPairs} pares</div>
                        {isB2BUnlocked && <div className="font-bold text-brand-600">{formatMXN(totalPrice)}</div>}
                    </div>
                    <button onClick={(e) => handleAddToOrder(e as React.FormEvent)} disabled={totalPairs === 0}
                        className="rounded-xl bg-brand-500 text-white font-bold px-6 py-3 text-sm shadow-sm hover:bg-brand-600 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
                        Agregar
                    </button>
                </div>
            </div>

            <B2BRevealModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={(lead) => { unlockB2B(lead); setShowModal(false); }}
                companyId={searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || 'demo'} />
        </div>
    )
}
