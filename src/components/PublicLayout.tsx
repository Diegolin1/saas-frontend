import { Outlet, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function PublicLayout() {
    const { itemCount } = useCart();

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Minimalist Top Nav */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Branding */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-2xl font-black text-gray-900 tracking-tighter">
                                SHOW<span className="text-indigo-600">ROOM</span>
                            </Link>
                        </div>

                        {/* Right side - Cart & Admin Link */}
                        <div className="flex items-center space-x-6">
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors hidden sm:block"
                            >
                                Acceso Fabricante
                            </Link>

                            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                                <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                                {itemCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-indigo-600 rounded-full">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main>
                <Outlet />
            </main>

            {/* Simple Footer */}
            <footer className="bg-white border-t border-gray-100 mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} Generado por SaaS B2B. El catálogo digital premium para León, Gto.
                    </p>
                </div>
            </footer>
        </div>
    );
}
