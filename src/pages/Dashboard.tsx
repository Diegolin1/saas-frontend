import { useEffect, useState } from 'react'
import { CurrencyDollarIcon, ShoppingCartIcon, UsersIcon, CursorArrowRaysIcon, SparklesIcon, QrCodeIcon, ArrowTopRightOnSquareIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import { getDashboardStats } from '../services/dashboard.service'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real app we fetch actual stats, here we mock it to 0 for the empty state demonstration or use API
                const statsData = await getDashboardStats()
                setStats(statsData || { salesToday: 0, pendingOrders: 0, botInteractions: 0, lowStockCount: 0 })
            } catch (error) {
                console.error('Error loading dashboard:', error)
                // Fallback for new empty account
                setStats({ salesToday: 0, pendingOrders: 0, botInteractions: 0, lowStockCount: 0 })
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
    const isNewAccount = stats && stats.salesToday === 0 && stats.pendingOrders === 0 && stats.botInteractions === 0

    const statsCards = [
        {
            name: 'Ventas Cerradas (WhatsApp)',
            stat: stats ? `$${stats.salesToday?.toLocaleString() || '0'}` : '$0',
            icon: CurrencyDollarIcon,
            color: 'bg-green-500',
            textColor: 'text-green-500'
        },
        {
            name: 'Pedidos en Espera',
            stat: stats?.pendingOrders || 0,
            icon: ShoppingCartIcon,
            color: 'bg-brand-500',
            textColor: 'text-brand-500'
        },
        {
            name: 'Nuevos Leads (Mayoristas)',
            stat: stats?.botInteractions || 0,
            icon: UsersIcon,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-500'
        },
        {
            name: 'Vistas al Catálogo',
            stat: stats?.lowStockCount || 0,
            icon: CursorArrowRaysIcon,
            color: 'bg-pink-500',
            textColor: 'text-pink-500'
        }
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Hola, {user?.email?.split('@')[0] || 'Dueño'} 👋</h2>
                    <p className="text-slate-500 mt-1">Este es el resumen de tu maquinaria de ventas.</p>
                </div>

                {/* Global Quick Action */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigator.clipboard.writeText(window.location.origin)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                        <QrCodeIcon className="w-5 h-5 text-slate-400" />
                        Copiar Mi Enlace
                    </button>
                    <Link to="/admin/products" className="flex items-center gap-2 bg-brand-900 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md hover:bg-brand-800 transition-colors">
                        <SparklesIcon className="w-5 h-5 text-gold-400" />
                        Nuevo Producto
                    </Link>
                </div>
            </div>

            {isNewAccount ? (
                /* SMART EMPTY STATE */
                <div className="relative overflow-hidden rounded-3xl bg-brand-950 px-8 py-16 shadow-2xl sm:px-16 sm:py-24 border border-white/10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 mb-8 backdrop-blur-md">
                            <RocketLaunchIcon className="w-12 h-12 text-gold-400 animate-pulse" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-4">
                            Bienvenido a tu Nuevo Showroom Digital
                        </h2>
                        <p className="text-lg text-brand-200 mb-10 leading-relaxed">
                            Tu motor de ventas B2B está listo. Sin embargo, tus clientes no pueden comprar si tus vitrinas están vacías. Sube tu primer producto estrella para empezar a recibir pedidos por WhatsApp hoy mismo.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/admin/products" className="w-full sm:w-auto px-8 py-4 bg-gold-500 hover:bg-gold-400 text-brand-950 font-bold rounded-xl transition-all shadow-glow hover:scale-105 flex items-center justify-center gap-2">
                                Subir Primer Modelo
                                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                            </Link>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all backdrop-blur-md">
                                Ver Tutorial Rápido
                            </button>
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
                                className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
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

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
                        {/* Leads Box */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-50 rounded-lg">
                                        <UsersIcon className="h-6 w-6 text-brand-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 font-display">Últimos Leads (WhatsApp)</h3>
                                </div>
                                <Link to="/admin/customers" className="text-sm font-semibold text-brand-600 hover:text-brand-500">Ver CRM &rarr;</Link>
                            </div>
                            <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <UsersIcon className="h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-slate-500 text-sm font-medium">Aún no hay leads capturados.</p>
                                <p className="text-slate-400 text-xs mt-1">Comparte tu enlace para empezar.</p>
                            </div>
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
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Esta semana</span>
                            </div>
                            <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <CurrencyDollarIcon className="h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-slate-500 text-sm font-medium">Faltan datos de ventas.</p>
                                <p className="text-slate-400 text-xs mt-1">Cierra pedidos para ver estadísticas.</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
