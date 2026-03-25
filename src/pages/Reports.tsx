import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import api from '../services/api';
import { formatMXN } from '../utils/format';
import { ArrowTrendingUpIcon, ShoppingBagIcon, UsersIcon, ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface SalesRow { date: string; total: number }
interface CategoryRow { category: string; total: number; count: number }
interface CustomerRow { id: string; businessName: string; total: number; orderCount: number }

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const PERIODS = [
    { label: '7 días', value: 7 },
    { label: '30 días', value: 30 },
    { label: '90 días', value: 90 },
];

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-700 mb-1">{label}</p>
            <p className="text-indigo-600 font-bold">{formatMXN(payload[0].value)}</p>
        </div>
    );
};

export default function Reports() {
    const [salesData, setSalesData] = useState<SalesRow[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryRow[]>([]);
    const [customerData, setCustomerData] = useState<CustomerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/dashboard/sales-by-day').then(r => r.data).catch(() => []),
            api.get('/analytics/sales-by-category').then(r => r.data).catch(() => []),
            api.get('/analytics/sales-by-customer').then(r => r.data).catch(() => []),
        ]).then(([sales, categories, customers]) => {
            setSalesData(sales);
            setCategoryData(categories);
            setCustomerData(customers);
        }).finally(() => setLoading(false));
    }, [period]);

    const totalRevenue = salesData.reduce((s, d) => s + d.total, 0);
    const avgDaily = salesData.length > 0 ? totalRevenue / salesData.length : 0;
    const totalOrders = customerData.reduce((s, c) => s + c.orderCount, 0);
    const topCustomer = customerData[0];

    const handleExportCsv = () => {
        const rows = [
            ['Fecha', 'Ventas'],
            ...salesData.map(d => [d.date, d.total.toFixed(2)])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-ventas-${period}dias.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Reportes</h1>
                    <p className="mt-1 text-sm text-slate-500">Analítica de ventas, categorías y clientes.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Period selector */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard icon={ArrowTrendingUpIcon} label="Ingresos Totales" value={formatMXN(totalRevenue)} sub={`Últimos ${period} días`} color="bg-indigo-500" />
                    <KpiCard icon={ChartBarIcon} label="Promedio Diario" value={formatMXN(avgDaily)} sub="Por día activo" color="bg-sky-500" />
                    <KpiCard icon={ShoppingBagIcon} label="Total Pedidos" value={String(totalOrders)} sub="En el período" color="bg-emerald-500" />
                    <KpiCard icon={UsersIcon} label="Mejor Cliente" value={topCustomer?.businessName?.split(' ')[0] || 'N/A'} sub={topCustomer ? formatMXN(topCustomer.total) : '—'} color="bg-amber-500" />
                </div>
            )}

            {/* Area Chart - Sales by Day */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wide">Ventas por Día</h2>
                    {!loading && salesData.length > 0 && (
                        <span className="text-xs text-slate-400">{salesData.length} días con ventas</span>
                    )}
                </div>
                {loading ? (
                    <div className="h-72 bg-slate-50 rounded-xl animate-pulse" />
                ) : salesData.length === 0 ? (
                    <div className="h-72 flex items-center justify-center text-sm text-slate-400">Sin datos de ventas en este período.</div>
                ) : (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#colorSales)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Sales by Category - Pie */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wide mb-4">Ventas por Categoría</h2>
                    {loading ? (
                        <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
                    ) : categoryData.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">Sin datos de categorías.</p>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        dataKey="total"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                    >
                                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => [formatMXN(Number(v)), 'Ventas']} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Top Customers */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wide mb-4">Top Clientes</h2>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : customerData.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">Sin datos de clientes.</p>
                    ) : (
                        <div className="space-y-3">
                            {customerData.slice(0, 6).map((c, i) => {
                                const maxTotal = customerData[0]?.total || 1;
                                const pct = Math.round((c.total / maxTotal) * 100);
                                return (
                                    <div key={c.id} className="flex items-center gap-3">
                                        <span className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">{c.businessName}</span>
                                                <span className="text-sm font-bold text-slate-900 ml-2 flex-shrink-0">{formatMXN(c.total)}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 text-xs text-slate-400">{c.orderCount} ped.</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Category Bar Chart */}
            {!loading && categoryData.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wide mb-4">Volumen por Categoría (unidades)</h2>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={90} />
                                <Tooltip formatter={(v: any) => [`${v} unidades`, 'Volumen']} />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
