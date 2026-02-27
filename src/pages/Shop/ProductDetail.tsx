import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { getProduct, Product, ProductVariant } from '../../services/product.service'
import { Toast } from '../../components/Toast'

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { addToCart } = useCart()

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [orderMatrix, setOrderMatrix] = useState<Record<string, number>>({})
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)

    // Derived state for matrix headers
    const [uniqueSizes, setUniqueSizes] = useState<string[]>([])
    const [uniqueColors, setUniqueColors] = useState<string[]>([])

    useEffect(() => {
        if (!id) return;
        getProduct(id)
            .then(data => {
                setProduct(data)
                // Extract unique sizes and colors
                const sizes = Array.from(new Set(data.variants.map((v: ProductVariant) => v.size))).sort()
                const colors = Array.from(new Set(data.variants.map((v: ProductVariant) => v.color))).sort()
                setUniqueSizes(sizes as string[])
                setUniqueColors(colors as string[])
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [id])

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

    if (loading) return <div className="p-12 text-center text-brand-400">Cargando producto...</div>
    if (!product) return <div className="p-12 text-center text-brand-400">Producto no encontrado.</div>

    // Insignias premium
    const isBestSeller = product.tags?.includes('best-seller');
    const isOutOfStock = product.variants.every(v => v.stock === 0);

    const shareUrl = window.location.origin + '/shop/' + product.id;

    return (
        <div className="glass-dark min-h-screen py-8">
            {feedback && (
                <Toast
                    message={feedback.message}
                    type={feedback.type}
                    onClose={() => setFeedback(null)}
                />
            )}
            <div className="pt-6 max-w-7xl mx-auto">
                {/* Image Gallery */}
                <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
                    <div className="aspect-h-4 aspect-w-3 hidden overflow-hidden rounded-3xl shadow-glass-dark border-4 border-gold-500/30 lg:block bg-brand-50">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-full w-full object-cover object-center"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-brand-100 text-brand-400 font-bold text-2xl">Sin Imagen</div>
                        )}
                    </div>
                    {/* Secondary images */}
                    <div className="hidden lg:grid lg:grid-cols-1 lg:gap-y-8">
                        {product.images && product.images.slice(1, 3).map((img, idx) => (
                            <div key={idx} className="aspect-h-2 aspect-w-3 overflow-hidden rounded-2xl border-2 border-gold-100 shadow-glow">
                                <img
                                    src={img.url}
                                    alt=""
                                    className="h-full w-full object-cover object-center"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto,auto,1fr] lg:gap-x-8 lg:px-8 lg:pb-24 lg:pt-16">
                    <div className="lg:col-span-2 lg:border-r lg:border-gold-100 lg:pr-8">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-display font-bold tracking-tight text-gold-500 drop-shadow-glow">{product.name}</h1>
                            {isBestSeller && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-brand-950 font-bold text-xs shadow-glow animate-pulse">
                                    ⭐ Más Vendido
                                </span>
                            )}
                            {isOutOfStock && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-brand-400 to-brand-700 text-white font-bold text-xs shadow-glow animate-pulse">
                                    Sin Stock
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-base text-brand-400 font-bold">SKU: {product.sku}</p>
                        <button
                            className="mt-4 mb-2 bg-gold-500 text-brand-950 font-bold px-6 py-2 rounded-full shadow-glow hover:bg-gold-400 transition-all animate-pulse"
                            onClick={() => navigator.share ? navigator.share({ title: product.name, url: shareUrl }) : navigator.clipboard.writeText(shareUrl)}
                        >
                            Compartir este modelo en WhatsApp
                        </button>
                    </div>

                    {/* Options (Matrix) */}
                    <div className="mt-4 lg:row-span-3 lg:mt-0">
                        <h2 className="sr-only">Product information</h2>
                        <p className="text-4xl font-display font-bold tracking-tight text-gold-500 drop-shadow-glow">
                            {getPrice() ? `$${getPrice()} MXN` : 'Precio a consultar'}
                        </p>

                        <form className="mt-10" onSubmit={handleAddToOrder}>
                            <h3 className="text-base font-bold text-brand-900 mb-2">Pedido por Talla y Color</h3>

                            <div className="mt-4 space-y-6">
                                {uniqueColors.map((color) => (
                                    <div key={color} className="border-b border-gold-100 pb-4">
                                        <h4 className="text-base font-bold text-brand-600 mb-2">{color}</h4>
                                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                            {uniqueSizes.map((size) => {
                                                const key = `${color}-${size}`
                                                // Find if this specific variant exists
                                                const variant = product.variants.find(v => v.color === color && v.size === size)

                                                if (!variant) {
                                                    // Variant doesn't exist for this combo
                                                    return (
                                                        <div key={key} className="flex flex-col items-center p-2 border border-brand-100 rounded-xl bg-brand-50 opacity-50">
                                                            <span className="text-xs text-brand-200 mb-1">{size}</span>
                                                            <span className="text-xs text-brand-200">-</span>
                                                        </div>
                                                    )
                                                }

                                                return (
                                                    <div key={key} className={`flex flex-col items-center p-2 border rounded-xl shadow-glow ${variant.stock === 0 ? 'bg-red-50 border-red-200' : 'bg-white/80 border-gold-100'}`}>
                                                        <span className="text-xs font-bold text-brand-900 mb-1">{size}</span>
                                                        {variant.stock > 0 ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={variant.stock}
                                                                placeholder="0"
                                                                className="w-full text-center text-base border-gold-400 rounded-xl shadow-glow focus:ring-gold-400 focus:border-gold-500 p-2 bg-white/70"
                                                                value={orderMatrix[key] || ''}
                                                                onChange={(e) => handleQuantityChange(color, size, parseInt(e.target.value) || 0)}
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-red-500 font-bold">Agotado</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 glass p-6 rounded-2xl sticky bottom-0 border border-gold-100 shadow-glow">
                                <div className="flex justify-between text-lg font-bold text-brand-900 mb-4">
                                    <p>Total Pares: {getTotalPairs()}</p>
                                    <p>Total: ${getTotalPrice().toLocaleString()}</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={getTotalPairs() === 0}
                                    className="flex w-full items-center justify-center rounded-full border border-transparent bg-gold-500 px-10 py-4 text-lg font-bold text-brand-950 shadow-glow hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 disabled:bg-gray-300 transition-all animate-pulse"
                                >
                                    Agregar al Pedido
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gold-100 lg:pb-16 lg:pr-8 lg:pt-6">
                        <div>
                            <h3 className="sr-only">Description</h3>
                            <div className="space-y-6">
                                <p className="text-lg text-brand-900 font-bold">{product.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
