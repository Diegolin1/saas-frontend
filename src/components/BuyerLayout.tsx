import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const NAV_ITEMS = [
    { label: 'Mis Pedidos', href: '/buyer/orders' },
    { label: 'Mis Facturas', href: '/buyer/invoices' },
    { label: 'Catálogo', href: '/buyer/catalog' },
];

export default function BuyerLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link to="/buyer/orders" className="text-lg font-display font-bold text-slate-900">
                            Portal Comprador
                        </Link>
                        <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
                            {user?.email}
                        </span>
                    </div>

                    <nav className="flex items-center gap-1">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                                    location.pathname === item.href
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <button
                        onClick={logout}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Salir
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}
