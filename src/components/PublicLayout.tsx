import { useState, useEffect } from 'react';
import { Outlet, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBagIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getPublicCatalog, Product } from '../services/product.service';

export default function PublicLayout() {
    const { itemCount } = useCart();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const companyId = searchParams.get('companyId') || import.meta.env.VITE_COMPANY_ID || '';
    const activeCategory = searchParams.get('category') || '';
    const [categories, setCategories] = useState<string[]>([]);

    // Cargar categorías reales del catálogo para el nav del header
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getPublicCatalog(companyId || 'demo', { page: 1 } as any);
                const prods: Product[] = data?.products ?? (Array.isArray(data) ? data : []);
                const cats = Array.from(new Set(prods.map((p: Product) => p.category).filter(Boolean))) as string[];
                setCategories(cats.sort());
            } catch { /* silent */ }
        };
        load();
    }, [companyId]);

    const goToCategory = (cat: string) => {
        const params = new URLSearchParams();
        if (companyId) params.set('companyId', companyId);
        if (cat) params.set('category', cat);
        navigate(`/?${params.toString()}`);
    };

    return (
        <div className="min-h-screen font-sans bg-white text-stone-900 flex flex-col">
            {/* ── Top Promo Bar ──────────────────────────────────────── */}
            <div className="bg-stone-900 text-white text-[10px] sm:text-xs font-medium text-center py-2 px-4 tracking-wide">
                Envío gratis a todo México en compras mayores a $1,500 MXN
            </div>

            {/* ── Enterprise Header ──────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        {/* 1. Logo (Left) */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link to={companyId ? `/?companyId=${companyId}` : '/'} className="flex items-center hover:opacity-80 transition-opacity">
                                <img src="/assets/logo-dark.png" alt="Cuero Firme" className="h-12 sm:h-16 w-auto object-contain" />
                            </Link>
                        </div>

                        {/* 2. Main Navigation (Center) — categorías dinámicas y funcionales */}
                        {categories.length > 0 && (
                            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => goToCategory(cat)}
                                        className={`text-sm font-medium transition-colors ${activeCategory.toLowerCase() === cat.toLowerCase()
                                                ? 'text-stone-900 font-bold border-b-2 border-stone-900 pb-0.5'
                                                : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </nav>
                        )}

                        {/* 3. Utilities (Right) */}
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="hidden lg:flex items-center bg-stone-100 rounded-full px-3 py-1.5 border border-transparent focus-within:border-stone-300 focus-within:bg-white transition-all w-48">
                                <MagnifyingGlassIcon className="h-4 w-4 text-stone-500 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Búsqueda"
                                    className="bg-transparent border-none outline-none text-xs w-full pl-2 text-stone-800 placeholder-stone-500"
                                />
                            </div>

                            <button className="lg:hidden text-stone-800 hover:text-stone-500 transition-colors p-1">
                                <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>

                            <Link to="/login" className="text-stone-800 hover:text-stone-500 transition-colors p-1" title="Mi Cuenta">
                                <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Link>

                            <Link to={companyId ? `/cart?companyId=${companyId}` : '/cart'} className="relative group p-1" title="Mi Carrito">
                                <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-stone-800 group-hover:text-stone-500 transition-colors" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white bg-red-600 rounded-full leading-none shadow-sm">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Content ───────────────────────────────────── */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="border-t border-stone-100">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
                        <div className="space-y-3">
                            <img src="/assets/logo-dark.png" alt="Cuero Firme" className="h-10 w-auto opacity-80" />
                            <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
                                Zapatos, bolsas y carteras de piel artesanal. Calidad mexicana para el mundo.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">Navegación</p>
                            <div className="flex flex-col gap-2">
                                <Link to="/" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">Catálogo</Link>
                                <Link to="/cart" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">Mi Pedido</Link>
                                <Link to="/privacidad" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">Aviso de Privacidad</Link>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">Acceso</p>
                            <div className="flex flex-col gap-2">
                                <Link to="/login" className="text-xs text-stone-500 hover:text-stone-900 transition-colors">Panel Administrador</Link>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-stone-100 text-center">
                        <p className="text-[10px] tracking-widest uppercase text-stone-300">
                            &copy; {new Date().getFullYear()} Cuero Firme &mdash; Todos los derechos reservados
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
