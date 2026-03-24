import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import { formatMXN } from '../utils/format';

interface SalesRow { date: string; total: number }
interface CategoryRow { category: string; total: number; count: number }
interface CustomerRow { id: string; businessName: string; total: number; orderCount: number }

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Reports() {
    const [salesData, setSalesData] = useState<SalesRow[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryRow[]>([]);
    const [customerData, setCustomerData] = useState<CustomerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [period] = useState(30); // days

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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <svg className="animate-spin h-7 w-7 text-slate-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    const totalRevenue = salesData.reduce((s, d) => s + d.total, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Reportes</h1>
                    <p className="mt-1 text-sm text-slate-500">Analítica de ventas, categorías y clientes.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Ingresos Totales (periodo)</p>
                    <p className="text-2xl font-bold text-slate-900">{formatMXN(totalRevenue)}</p>
                </div>
            </div>

            {/* Sales by Day Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase text-slate-500 mb-4">Ventas por Día</h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip formatter={(v: any) => [formatMXN(Number(v)), 'Ventas']} labelFormatter={(l) => `Fecha: ${l}`} />
                            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Sales by Category */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-bold uppercase text-slate-500 mb-4">Ventas por Categoría</h2>
                    {categoryData.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">Sin datos de categorías.</p>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => formatMXN(Number(v))} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Top Customers */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-bold uppercase text-slate-500 mb-4">Top Clientes por Ventas</h2>
                    {customerData.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">Sin datos de clientes.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                                        <th className="pb-2 pr-4">Cliente</th>
                                        <th className="pb-2 pr-4 text-center">Pedidos</th>
                                        <th className="pb-2 text-right">Monto Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customerData.map((c, i) => (
                                        <tr key={c.id}>
                                            <td className="py-2 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
                                                    <span className="font-medium text-slate-800 truncate max-w-[180px]">{c.businessName}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 pr-4 text-center text-slate-600">{c.orderCount}</td>
                                            <td className="py-2 text-right font-semibold text-slate-900">{formatMXN(c.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
