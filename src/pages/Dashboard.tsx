import { useEffect, useState } from 'react'
import { CurrencyDollarIcon, ShoppingCartIcon, UsersIcon, CursorArrowRaysIcon, SparklesIcon, QrCodeIcon, ArrowTopRightOnSquareIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import { getDashboardStats, getTopProducts, getLowStockProducts } from '../services/dashboard.service'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Tooltip } from '../components/Tooltip'

interface DashboardStats {
    salesToday: number;
    salesMonth: number;
    pendingOrders: number;
    leadsCaptured: number;
    abandonedCartsValue: number;
    activeCartsCount: number;
}

interface LowStockItem {
    id: string;
    name: string;
    variant: string;
    stock: number;
    image?: string;
}

interface TopProduct {
    id: string;
    name: string;
    totalSold: number;
    images?: { url: string }[];
}

const defaultStats: DashboardStats = { salesToday: 0, salesMonth: 0, pendingOrders: 0, leadsCaptured: 0, abandonedCartsValue: 0, activeCartsCount: 0 };

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [lowStock, setLowStock] = useState<LowStockItem[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, topData, lowData] = await Promise.allSettled([
                    getDashboardStats(),
                    getTopProducts(),
                    getLowStockProducts()
                ])
                setStats(statsData.status === 'fulfilled' ? (statsData.value || defaultStats) : defaultStats)
                setTopProducts(topData.status === 'fulfilled' ? (topData.value || []) : [])
                setLowStock(lowData.status === 'fulfilled' ? (lowData.value || []) : [])
            } catch (error) {
                console.error('Error loading dashboard:', error)
                setStats(defaultStats)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
    )

    // Detect if this is a brand new account with no activity
    const isNewAccount = stats && stats.salesToday === 0 && stats.pendingOrders === 0 && stats.leadsCaptured === 0

    const statsCards = [
        {
            name: 'Ventas de Hoy (MXN)',
            stat: stats ? `$${stats.salesToday?.toLocaleString() || '0'}` : '$0',
            icon: CurrencyDollarIcon,
            color: 'bg-green-500',
            textColor: 'text-green-500'
        },
        {
            name: 'Ventas del Mes',
            stat: stats ? `$${stats.salesMonth?.toLocaleString() || '0'}` : '$0',
            icon: SparklesIcon,
            color: 'bg-gold-500',
            textColor: 'text-gold-500'
        },
        {
            name: 'Leads Capturados (7 días)',
            stat: stats?.leadsCaptured || 0,
            icon: UsersIcon,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-500'
        },
        {
            name: 'En Carritos Abandonados',
            stat: stats ? `$${stats.abandonedCartsValue?.toLocaleString() || '0'} (${stats.activeCartsCount || 0})` : '$0 (0)',
            icon: ShoppingCartIcon,
            color: 'bg-pink-500',
            textColor: 'text-pink-500'
        }
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-brand-900">Hola, {user?.name || user?.email?.split('@')[0] || 'Dueño'} 👋</h2>
                    <p className="text-brand-500 mt-1">Este es el resumen de tu maquinaria de ventas.</p>
                </div>

                {/* Global Quick Action Mejorado con Tooltips */}
                <div className="flex items-center gap-3">
                    <Tooltip content="Comparte este enlace con tus clientes mayoristas para que accedan a tu catálogo digital.">
                        <button
                            onClick={() => navigator.clipboard.writeText(window.location.origin)}
                            className="flex items-center gap-2 glass px-5 py-2 rounded-xl text-sm font-semibold text-brand-900 shadow-glass border border-brand-100 hover:bg-white/80 transition-all hover:scale-105 focus:outline-none"
                        >
                            <QrCodeIcon className="w-5 h-5 text-gold-500" />
                            Copiar Mi Enlace
                        </button>
                    </Tooltip>
                    <Tooltip content="Agrega tu primer producto estrella para activar tu showroom.">
                        <Link
                            to="/admin/products"
                            className="flex items-center gap-2 bg-gold-500 text-brand-950 px-6 py-2 rounded-xl text-sm font-bold shadow-glow hover:bg-gold-400 transition-all hover:scale-105 animate-pulse focus:outline-none"
                        >
                            <SparklesIcon className="w-5 h-5 text-brand-900" />
                            Nuevo Producto
                        </Link>
                    </Tooltip>
                </div>
            </div>

            {/* Onboarding visual para cuentas nuevas */}
            {isNewAccount ? (
                /* SMART EMPTY STATE PREMIUM */
                <div className="relative overflow-hidden rounded-3xl glass-dark px-8 py-16 shadow-glass-dark sm:px-16 sm:py-24 border border-gold-500/20">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-4 glass rounded-2xl border border-gold-500/30 mb-8">
                            <RocketLaunchIcon className="w-12 h-12 text-gold-400 animate-pulse" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gold-400 tracking-tight mb-4 drop-shadow-glow animate-fade-in">
                            Bienvenido a tu Nuevo Showroom Digital
                        </h2>
                        <p className="text-lg text-brand-200 mb-10 leading-relaxed animate-fade-in">
                            Tu motor de ventas B2B está listo. <span className="text-gold-400 font-bold">¿Listo para tu primer pedido?</span> Sube tu producto estrella y comparte tu enlace para empezar a recibir pedidos por WhatsApp hoy mismo.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
                            <Tooltip content="Haz clic aquí para subir tu primer producto y activar tu catálogo.">
                                <Link to="/admin/products" className="w-full sm:w-auto px-8 py-4 bg-gold-500 hover:bg-gold-400 text-brand-950 font-bold rounded-xl transition-all shadow-glow hover:scale-105 flex items-center justify-center gap-2 animate-pulse focus:outline-none">
                                    Subir Primer Modelo
                                    <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                </Link>
                            </Tooltip>
                            <Tooltip content="Mira un tutorial rápido para dominar tu showroom.">
                                <a href="#" onClick={(e) => e.preventDefault()} className="w-full sm:w-auto px-8 py-4 glass hover:bg-white/10 text-gold-400 font-semibold rounded-xl border border-gold-500/30 transition-all backdrop-blur-md flex items-center justify-center gap-2 hover:scale-105 focus:outline-none">
                                    <SparklesIcon className="w-5 h-5" />
                                    Tutorial (Próximamente)
                                </a>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            ) : (
                /* NORMAL POPULATED DASHBOARD */
                <>
                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {statsCards.map((item) => (
                            <div
                                key={item.name}
                                className="relative overflow-hidden rounded-2xl glass p-6 shadow-glow border border-gold-500/10 hover:shadow-glass-dark transition-all group hover:scale-105 duration-300 animate-fade-in"
                            >
                                <dt>
                                    <div className={`absolute rounded-xl ${item.color} bg-opacity-20 p-3 group-hover:scale-110 transition-transform shadow-glow`}>
                                        <item.icon className={`h-6 w-6 ${item.textColor} drop-shadow-glow`} aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 truncate text-sm font-medium text-brand-500">{item.name}</p>
                                </dt>
                                <dd className="ml-16 flex items-baseline pb-1 mt-2">
                                    <p className="text-3xl font-display font-bold text-brand-900">{item.stat}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
                        {/* Leads / Low Stock Box */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-50 rounded-lg">
                                        <UsersIcon className="h-6 w-6 text-brand-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 font-display">Stock Crítico</h3>
                                </div>
                                <Link to="/admin/products" className="text-sm font-semibold text-brand-600 hover:text-brand-500">Ver Productos &rarr;</Link>
                            </div>
                            {lowStock.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <UsersIcon className="h-10 w-10 text-slate-300 mb-3" />
                                    <p className="text-slate-500 text-sm font-medium">No hay productos con stock crítico.</p>
                                    <p className="text-slate-400 text-xs mt-1">¡Excelente! Todo tu inventario está en orden.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {lowStock.map((item) => (
                                        <li key={`${item.id}-${item.variant}`} className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-3">
                                                {item.image && <img src={item.image} alt={item.name} className="h-8 w-8 rounded object-cover" />}
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.variant}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold ${item.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {item.stock === 0 ? 'Agotado' : `${item.stock} uds`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Top Products Box */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gold-50 rounded-lg">
                                        <SparklesIcon className="h-6 w-6 text-gold-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 font-display">Modelos Ganadores</h3>
                                </div>
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Por pares vendidos</span>
                            </div>
                            {topProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <CurrencyDollarIcon className="h-10 w-10 text-slate-300 mb-3" />
                                    <p className="text-slate-500 text-sm font-medium">Faltan datos de ventas.</p>
                                    <p className="text-slate-400 text-xs mt-1">Cierra pedidos para ver estadísticas.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {topProducts.map((item, i) => (
                                        <li key={item.id || i} className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-slate-400 w-5">#{i + 1}</span>
                                                {item.images?.[0]?.url && <img src={item.images[0].url} alt={item.name} className="h-8 w-8 rounded object-cover" />}
                                                <p className="text-sm font-medium text-slate-900">{item.name || 'Producto'}</p>
                                            </div>
                                            <span className="text-sm font-bold text-gold-600">{item.totalSold} pares</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
