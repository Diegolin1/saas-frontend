import { useEffect, useState, useCallback } from 'react'
import { CurrencyDollarIcon, ShoppingCartIcon, UsersIcon, SparklesIcon, QrCodeIcon, ArrowTopRightOnSquareIcon, RocketLaunchIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getDashboardStats, getTopProducts, getLowStockProducts, getSalesByDay } from '../services/dashboard.service'
import { SkeletonCard, SkeletonChart } from '../components/Skeleton'
import { Link, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Tooltip } from '../components/Tooltip'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { formatMXN } from '../utils/format'

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

interface SalesDay {
    date: string;
    total: number;
}

const defaultStats: DashboardStats = { salesToday: 0, salesMonth: 0, pendingOrders: 0, leadsCaptured: 0, abandonedCartsValue: 0, activeCartsCount: 0 };

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [lowStock, setLowStock] = useState<LowStockItem[]>([])
    const [salesByDay, setSalesByDay] = useState<SalesDay[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const { companyName } = (useOutletContext<{ companyName: string; companyLogoUrl: string | null }>()) ?? {}

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [statsData, topData, lowData, salesData] = await Promise.allSettled([
                getDashboardStats(),
                getTopProducts(),
                getLowStockProducts(),
                getSalesByDay()
            ])
            setStats(statsData.status === 'fulfilled' ? (statsData.value || defaultStats) : defaultStats)
            setTopProducts(topData.status === 'fulfilled' ? (topData.value || []) : [])
            setLowStock(lowData.status === 'fulfilled' ? (lowData.value || []) : [])
            setSalesByDay(salesData.status === 'fulfilled' ? (salesData.value || []) : [])
        } catch {
            setStats(defaultStats)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    if (loading) return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <div className="animate-pulse rounded-lg bg-slate-200/70 h-7 w-56 mb-2" />
                    <div className="animate-pulse rounded-lg bg-slate-200/70 h-4 w-72" />
                </div>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </dl>
            <SkeletonChart />
        </div>
    )

    // Detect if this is a brand new account with no activity
    const isNewAccount = stats && stats.salesToday === 0 && stats.salesMonth === 0 && salesByDay.every(d => d.total === 0) && stats.pendingOrders === 0 && stats.leadsCaptured === 0

    const statsCards = [
        {
            name: 'Ventas de Hoy (MXN)',
            stat: stats ? formatMXN(stats.salesToday ?? 0) : formatMXN(0),
            icon: CurrencyDollarIcon,
            color: 'bg-emerald-600',
            textColor: 'text-emerald-600'
        },
        {
            name: 'Ventas del Mes',
            stat: stats ? formatMXN(stats.salesMonth ?? 0) : formatMXN(0),
            icon: SparklesIcon,
            color: 'bg-stone-800',
            textColor: 'text-stone-800'
        },
        {
            name: 'Leads Capturados (7 días)',
            stat: stats?.leadsCaptured || 0,
            icon: UsersIcon,
            color: 'bg-amber-600',
            textColor: 'text-amber-600'
        },
        {
            name: 'En Carritos Abandonados',
            stat: stats ? `${formatMXN(stats.abandonedCartsValue ?? 0)} (${stats.activeCartsCount || 0})` : `${formatMXN(0)} (0)`,
            icon: ShoppingCartIcon,
            color: 'bg-rose-600',
            textColor: 'text-rose-600'
        }
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Hola, {user?.name || user?.email?.split('@')[0] || 'Dueño'} 👋</h2>
                    <p className="text-slate-500 mt-1">Este es el resumen de tu negocio.</p>
                </div>

                {/* Global Quick Action Mejorado con Tooltips */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all focus:outline-none disabled:opacity-50"
                        title="Actualizar datos"
                    >
                        <ArrowPathIcon className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                    <Tooltip content="Comparte este enlace con tus clientes mayoristas para que accedan a tu catálogo digital.">
                        <button
                            onClick={() => navigator.clipboard.writeText(window.location.origin)}
                            className="flex items-center gap-2 bg-white px-5 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all focus:outline-none"
                        >
                            <QrCodeIcon className="w-5 h-5 text-brand-500" />
                            Copiar Mi Enlace
                        </button>
                    </Tooltip>
                    <Tooltip content="Agrega tu primer producto estrella para activar tu catálogo.">
                        <Link
                            to="/admin/products"
                            className="flex items-center gap-2 bg-brand-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-600 transition-all focus:outline-none"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            Nuevo Producto
                        </Link>
                    </Tooltip>
                </div>
            </div>

            {/* Onboarding visual para cuentas nuevas */}
            {isNewAccount ? (
                /* SMART EMPTY STATE PREMIUM */
                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 px-8 py-14 sm:px-16 sm:py-20">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-100/40 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-50/30 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-xl mb-6">
                            <RocketLaunchIcon className="w-10 h-10 text-brand-500" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight mb-3">
                            Bienvenido a {companyName || 'ShowRoom B2B'}
                        </h2>
                        <p className="text-base text-slate-500 mb-8 leading-relaxed">
                            Tu catálogo B2B está listo. <span className="text-brand-600 font-semibold">¿Listo para tu primer pedido?</span> Sube tu producto estrella y comparte tu enlace para empezar a recibir pedidos por WhatsApp hoy mismo.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Tooltip content="Haz clic aquí para subir tu primer producto y activar tu catálogo.">
                                <Link to="/admin/products" className="w-full sm:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 focus:outline-none">
                                    Subir Primer Modelo
                                    <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                </Link>
                            </Tooltip>
                            <Tooltip content="Mira un tutorial rápido para dominar tu catálogo.">
                                <a href="#" onClick={(e) => e.preventDefault()} className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 focus:outline-none">
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
                                className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group duration-300"
                            >
                                <dt>
                                    <div className={`absolute rounded-xl ${item.color} bg-opacity-10 p-3 group-hover:scale-110 transition-transform`}>
                                        <item.icon className={`h-6 w-6 ${item.textColor}`} aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
                                </dt>
                                <dd className="ml-16 flex items-baseline pb-1 mt-2">
                                    <p className="text-3xl font-display font-bold text-slate-900">{item.stat}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {/* Sales chart - 14 days */}
                    {salesByDay.length > 0 && (() => {
                        return (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-50 rounded-lg">
                                            <ChartBarIcon className="h-6 w-6 text-brand-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 font-display">Ventas Últimos 14 Días</h3>
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                        Total: {formatMXN(salesByDay.reduce((s, d) => s + d.total, 0), false)}
                                    </span>
                                </div>
                                <div className="h-64 mt-4 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => new Date(str + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10}
                                            />
                                            <YAxis
                                                axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                tickFormatter={(val) => val > 999 ? `$${(val / 1000).toFixed(1)}k` : formatMXN(val, false)}
                                            />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        const dateLabel = new Date(label + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long' });
                                                        return (
                                                            <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{dateLabel}</p>
                                                                <p className="font-display font-bold text-lg">{formatMXN(Number(payload[0].value))}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        );
                    })()}

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
