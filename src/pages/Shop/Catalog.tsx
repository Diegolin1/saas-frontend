import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublicCatalog, Product } from '../../services/product.service'
import { SparklesIcon, FireIcon } from '@heroicons/react/24/outline'

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                // In a real app we'd get the companyId from subdomain or route
                const data = await getPublicCatalog('demo')
                setProducts(data)
            } catch (error) {
                console.error('Error fetching catalog:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchCatalog()
    }, [])

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    )

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <div className="bg-slate-900 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Nueva Colección <span className="text-indigo-400">Premium</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-xl text-slate-300">
                        Calidad de exportación directa de fábrica en León, Gto.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                            <SparklesIcon className="mr-1.5 h-4 w-4" /> Envío inmediato
                        </span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {products.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <p className="text-slate-500 text-lg">Próximamente... Nuestro catálogo está siendo actualizado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                        {products.map((product, index) => (
                            <div key={product.id} className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">

                                {/* Badges */}
                                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                    {index % 3 === 0 && (
                                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 backdrop-blur-md">
                                            <FireIcon className="mr-1 h-3 w-3" /> Más Vendido
                                        </span>
                                    )}
                                    {index % 4 === 0 && (
                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10 backdrop-blur-md">
                                            ¡Pocas Tallas!
                                        </span>
                                    )}
                                </div>

                                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.name}
                                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
                                            Sin fotografía
                                        </div>
                                    )}
                                    {/* Glassmorphism gradient bottom */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">
                                                {product.category || 'Calzado'}
                                            </p>
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                                <Link to={`/product/${product.id}`}>
                                                    <span aria-hidden="true" className="absolute inset-0" />
                                                    {product.name}
                                                </Link>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center justify-between">
                                        <p className="text-xl font-black text-slate-900">
                                            {product.price ? `$${product.price}` : <span className="text-sm text-slate-500 font-normal">Precios al Mayorista</span>}
                                        </p>
                                        <span className="inline-flex items-center justify-center rounded-full bg-slate-900 p-2 text-white group-hover:bg-indigo-600 transition-colors">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
