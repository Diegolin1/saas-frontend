import { Outlet, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function PublicLayout() {
    const { itemCount } = useCart();

    return (
        <div className="min-h-screen font-sans bg-white text-slate-900 flex flex-col">
            {/* Clean Top Nav */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Branding */}
                        <Link to="/" className="text-xl font-display font-bold text-slate-900 tracking-tight">
                            Show<span className="text-brand-500">Room</span>
                        </Link>

                        {/* Right side */}
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="text-sm font-semibold text-slate-500 hover:text-brand-500 transition-colors hidden sm:block"
                            >
                                Acceso Fabricante
                            </Link>

                            <Link to="/cart" className="relative p-2 text-slate-500 hover:text-brand-500 transition-colors">
                                <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white bg-brand-500 rounded-full shadow-sm">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-400 font-medium">
                            &copy; {new Date().getFullYear()} ShowRoom B2B — Catálogo digital para mayoristas
                        </p>
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                                Acceso Admin
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
