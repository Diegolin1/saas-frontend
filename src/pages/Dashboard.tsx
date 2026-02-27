import { useEffect, useState } from 'react'
import { CurrencyDollarIcon, ShoppingCartIcon, UsersIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline'
import { getDashboardStats } from '../services/dashboard.service'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsData = await getDashboardStats()
                setStats(statsData)
            } catch (error) {
                console.error('Error loading dashboard:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando tablero...</div>

    const statsCards = [
        {
            name: 'Ventas Cerradas (WhatsApp)',
            stat: stats ? `$${stats.salesToday?.toLocaleString() || '15,400'}` : '$0',
            icon: CurrencyDollarIcon,
            color: 'bg-green-500'
        },
        {
            name: 'Pedidos en Espera',
            stat: stats?.pendingOrders || 3,
            icon: ShoppingCartIcon,
            color: 'bg-indigo-500'
        },
        {
            name: 'Nuevos Leads (Mayoristas)',
            stat: stats?.botInteractions || 12,
            icon: UsersIcon,
            color: 'bg-blue-500'
        },
        {
            name: 'Vistas al Catálogo',
            stat: stats?.lowStockCount || 342,
            icon: CursorArrowRaysIcon,
            color: 'bg-pink-500'
        }
    ]

    return (
        <div>
            <h3 className="text-base font-semibold leading-6 text-gray-900">Resumen del Día</h3>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((item) => (
                    <div
                        key={item.name}
                        className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
                    >
                        <dt>
                            <div className={`absolute rounded-md ${item.color} p-3`}>
                                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-1 sm:pb-7">
                            <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Leads Box */}
                <div className="bg-white shadow rounded-lg p-6 border-t-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <UsersIcon className="h-6 w-6 text-blue-500" />
                            <h3 className="text-lg font-bold leading-6 text-gray-900">Últimos Leads Capturados</h3>
                        </div>
                        <Link to="/customers" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Ver CRM</Link>
                    </div>
                    <ul role="list" className="divide-y divide-gray-100">
                        <li className="flex justify-between py-4">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Zapaterías 3 Hermanos</p>
                                <p className="text-sm text-gray-500">477 123 4567</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Contactado
                            </span>
                        </li>
                        <li className="flex justify-between py-4">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Boutique María</p>
                                <p className="text-sm text-gray-500">477 987 6543</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                Esperando Respuesta
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Top Products Placeholder */}
                <div className="bg-white shadow rounded-lg p-6 border-t-4 border-indigo-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold leading-6 text-gray-900">Modelos Ganadores</h3>
                        <span className="text-sm text-gray-500">Esta semana en León</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-slate-100">
                        <CurrencyDollarIcon className="h-12 w-12 text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm font-medium">Recopilando datos de ventas por WhatsApp...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
