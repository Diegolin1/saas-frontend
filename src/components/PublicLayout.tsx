import { Outlet, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function PublicLayout() {
    const { itemCount } = useCart();

    return (
        <div className="min-h-screen font-sans bg-stone-950">
            {/* Premium Top Nav */}
            <header className="sticky top-0 z-50 bg-stone-900/80 backdrop-blur-md border-b border-amber-500/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Branding */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-2xl font-black text-white tracking-tighter drop-shadow-md">
                                SHOW<span className="text-amber-500">ROOM</span>
                            </Link>
                        </div>

                        {/* Right side - Cart & Admin Link */}
                        <div className="flex items-center space-x-6">
                            <Link
                                to="/login"
                                className="text-sm font-bold text-amber-200/70 hover:text-amber-400 transition-colors hidden sm:block"
                            >
                                Acceso Fabricante
                            </Link>

                            <Link to="/cart" className="relative p-2 text-stone-300 hover:text-amber-400 transition-colors">
                                <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                                {itemCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-amber-600 rounded-full shadow-lg">
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
            <footer className="bg-stone-950 border-t border-amber-500/10 mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-stone-500 font-medium">
                        &copy; {new Date().getFullYear()} Generado por SaaS B2B. El catálogo digital premium para León, Gto.
                    </p>
                </div>
            </footer>
        </div>
    );
}
