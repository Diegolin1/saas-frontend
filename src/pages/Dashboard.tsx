import { useEffect, useState } from 'react'
import { CurrencyDollarIcon, ShoppingCartIcon, UsersIcon, CursorArrowRaysIcon, SparklesIcon, QrCodeIcon, ArrowTopRightOnSquareIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import { getDashboardStats } from '../services/dashboard.service'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Tooltip } from '../components/Tooltip'

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
                    <h2 className="text-2xl font-display font-bold text-brand-900">Hola, {user?.email?.split('@')[0] || 'Dueño'} 👋</h2>
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
                                <a href="https://youtu.be/dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 glass hover:bg-white/10 text-gold-400 font-semibold rounded-xl border border-gold-500/30 transition-all backdrop-blur-md flex items-center justify-center gap-2 hover:scale-105 focus:outline-none">
                                    <SparklesIcon className="w-5 h-5" />
                                    Ver Tutorial Rápido
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
