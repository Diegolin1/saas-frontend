import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { getProduct, Product, ProductVariant } from '../../services/product.service'

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { addToCart } = useCart()

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [orderMatrix, setOrderMatrix] = useState<Record<string, number>>({})

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

        // Check stock availability
        const variant = product?.variants.find(v => v.color === color && v.size === size)
        if (!variant) return // Should not happen if UI is correct

        if (qty > variant.stock) {
            alert(`Solo hay ${variant.stock} unidades disponibles en Talla ${size} Color ${color}`)
            return
        }

        if (qty < 0) return
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

        let itemsAdded = 0;
        Object.entries(orderMatrix).forEach(([key, qty]) => {
            if (qty > 0) {
                const [color, size] = key.split('-')
                // Find variant ID
                const variant = product?.variants.find(v => v.size === size && v.color === color);

                if (variant) {
                    addToCart({
                        productId: product!.id,
                        variantId: variant.id, // Important for backend order
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
            navigate('/cart')
        } else {
            alert('Por favor selecciona al menos un par.')
        }
    }

    if (loading) return <div className="p-12 text-center text-gray-500">Cargando producto...</div>
    if (!product) return <div className="p-12 text-center text-gray-500">Producto no encontrado.</div>

    return (
        <div className="bg-white">
            <div className="pt-6">
                {/* Image Gallery */}
                <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
                    <div className="aspect-h-4 aspect-w-3 hidden overflow-hidden rounded-lg lg:block">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-full w-full object-cover object-center"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">Sin Imagen</div>
                        )}
                    </div>
                    {/* Secondary images */}
                    <div className="hidden lg:grid lg:grid-cols-1 lg:gap-y-8">
                        {product.images && product.images.slice(1, 3).map((img, idx) => (
                            <div key={idx} className="aspect-h-2 aspect-w-3 overflow-hidden rounded-lg">
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
                    <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{product.name}</h1>
                        <p className="mt-1 text-sm text-gray-500">{product.sku}</p>
                    </div>

                    {/* Options (Matrix) */}
                    <div className="mt-4 lg:row-span-3 lg:mt-0">
                        <h2 className="sr-only">Product information</h2>
                        <p className="text-3xl tracking-tight text-gray-900">
                            {getPrice() ? `$${getPrice()} MXN` : 'Precio a consultar'}
                        </p>

                        <form className="mt-10" onSubmit={handleAddToOrder}>
                            <h3 className="text-sm font-medium text-gray-900">Pedido por Talla y Color</h3>

                            <div className="mt-4 space-y-6">
                                {uniqueColors.map((color) => (
                                    <div key={color} className="border-b pb-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-2">{color}</h4>
                                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                            {uniqueSizes.map((size) => {
                                                const key = `${color}-${size}`
                                                // Find if this specific variant exists
                                                const variant = product.variants.find(v => v.color === color && v.size === size)

                                                if (!variant) {
                                                    // Variant doesn't exist for this combo
                                                    return (
                                                        <div key={key} className="flex flex-col items-center p-2 border border-gray-100 rounded bg-gray-50 opacity-50">
                                                            <span className="text-xs text-gray-300 mb-1">{size}</span>
                                                            <span className="text-xs text-gray-300">-</span>
                                                        </div>
                                                    )
                                                }

                                                return (
                                                    <div key={key} className={`flex flex-col items-center p-2 border rounded ${variant.stock === 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                                        <span className="text-xs text-gray-500 mb-1">{size}</span>
                                                        {variant.stock > 0 ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={variant.stock}
                                                                placeholder="0"
                                                                className="w-full text-center text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-1"
                                                                value={orderMatrix[key] || ''}
                                                                onChange={(e) => handleQuantityChange(color, size, parseInt(e.target.value) || 0)}
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-red-500 font-medium">Agotado</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 bg-gray-50 p-6 rounded-lg sticky bottom-0">
                                <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                                    <p>Total Pares: {getTotalPairs()}</p>
                                    <p>Total: ${getTotalPrice().toLocaleString()}</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={getTotalPairs() === 0}
                                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300"
                                >
                                    Agregar al Pedido
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pb-16 lg:pr-8 lg:pt-6">
                        <div>
                            <h3 className="sr-only">Description</h3>
                            <div className="space-y-6">
                                <p className="text-base text-gray-900">{product.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
