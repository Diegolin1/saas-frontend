import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    Bars3Icon,
    HomeIcon,
    UsersIcon,
    CurrencyDollarIcon,
    TagIcon,
    ShoppingBagIcon,
    ClipboardDocumentListIcon,
    ShoppingCartIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const { itemCount } = useCart()
    const { user, logout } = useAuth()

    // Define navigation based on Roles
    const getNavigation = () => {
        const role = user?.role;

        const common = [
            { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        ];

        const buyerNav = [
            { name: 'Ir al Showroom', href: '/', icon: ShoppingBagIcon },
            { name: 'Mis Pedidos', href: '/admin/my-orders', icon: ClipboardDocumentListIcon },
        ];

        const sellerNav = [
            { name: 'Ir al Showroom', href: '/', icon: ShoppingBagIcon },
            { name: 'Todos los Pedidos', href: '/admin/orders', icon: ClipboardDocumentListIcon },
        ];

        const adminNav = [ // Owner & Supervisor
            ...sellerNav,
            { name: 'Admin Productos', href: '/admin/products', icon: TagIcon },
            { name: 'Clientes / Leads', href: '/admin/customers', icon: UsersIcon },
            { name: 'Listas Precio', href: '/admin/price-lists', icon: CurrencyDollarIcon },
        ];

        const ownerNav = [ // Only for Owner/Admin
            ...adminNav,
            { name: 'Configuración', href: '/admin/settings', icon: Cog6ToothIcon },
        ];

        if (role === 'BUYER') return [...common, ...buyerNav];
        if (role === 'SELLER') return [...common, ...sellerNav];
        if (role === 'SUPERVISOR') return [...common, ...adminNav];
        // Treat ADMIN as OWNER for legacy support
        if (role === 'OWNER' || role === 'ADMIN') return [...common, ...ownerNav];

        return common;
    };

    const navigation = getNavigation();

    return (
        <>
            <div>
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                    <div className="flex grow flex-col gap-y-8 overflow-y-auto glass-dark px-6 pb-4 ring-1 ring-white/10 relative">
                                        {/* Decorative Background Blob */}
                                        <div className="absolute top-0 left-0 w-full h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 -z-10 pointer-events-none"></div>

                                        <div className="flex h-20 shrink-0 items-center border-b border-white/10">
                                            <h1 className="text-white font-display text-2xl font-bold tracking-tight">
                                                León<span className="text-gold-400">B2B</span>
                                            </h1>
                                        </div>
                                        <nav className="flex flex-1 flex-col">
                                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                                <li>
                                                    <div className="text-xs font-semibold leading-6 text-brand-400 mb-2 uppercase tracking-wider">Menú Principal</div>
                                                    <ul role="list" className="-mx-2 space-y-2">
                                                        {navigation.map((item) => (
                                                            <li key={item.name}>
                                                                <Link
                                                                    to={item.href}
                                                                    onClick={() => setSidebarOpen(false)}
                                                                    className={classNames(
                                                                        location.pathname === item.href
                                                                            ? 'bg-white/10 text-gold-400 border-l-2 border-gold-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                                                                            : 'text-brand-200 hover:text-white hover:bg-white/5',
                                                                        'group flex gap-x-3 p-3 text-sm leading-6 font-medium transition-all duration-300 rounded-r-xl'
                                                                    )}
                                                                >
                                                                    <item.icon
                                                                        className={classNames(
                                                                            location.pathname === item.href ? 'text-gold-400' : 'text-brand-400 group-hover:text-gold-400',
                                                                            'h-6 w-6 shrink-0 transition-colors duration-300'
                                                                        )}
                                                                        aria-hidden="true"
                                                                    />
                                                                    {item.name}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                    <div className="flex grow flex-col gap-y-8 overflow-y-auto glass-dark px-6 pb-4 border-r border-white/5 relative">
                        {/* Decorative Background Blob */}
                        <div className="absolute top-0 left-0 w-full h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 -z-10 pointer-events-none"></div>

                        <div className="flex h-20 shrink-0 items-center border-b border-white/10">
                            <h1 className="text-white font-display text-2xl font-bold tracking-tight">
                                León<span className="text-gold-400">B2B</span>
                            </h1>
                        </div>
                        <nav className="flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <div className="text-xs font-semibold leading-6 text-brand-400 mb-2 uppercase tracking-wider">Menú Principal</div>
                                    <ul role="list" className="-mx-2 space-y-2">
                                        {navigation.map((item) => (
                                            <li key={item.name}>
                                                <Link
                                                    to={item.href}
                                                    className={classNames(
                                                        location.pathname === item.href
                                                            ? 'bg-white/10 text-gold-400 border-l-2 border-gold-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                                                            : 'text-brand-200 hover:text-white hover:bg-white/5',
                                                        'group flex gap-x-3 p-3 text-sm leading-6 font-medium transition-all duration-300 rounded-r-xl'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={classNames(
                                                            location.pathname === item.href ? 'text-gold-400' : 'text-brand-400 group-hover:text-gold-400',
                                                            'h-6 w-6 shrink-0 transition-colors duration-300'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="lg:pl-72">
                    <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-brand-100 glass px-4 shadow-glass sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-300">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-brand-700 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="h-6 w-px bg-brand-200 lg:hidden" aria-hidden="true" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="flex flex-1" />
                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                {/* Cart Icon */}
                                <Link to="/cart" className="group -m-2.5 p-2.5 flex items-center relative hover:bg-brand-50 rounded-full transition-colors">
                                    <ShoppingCartIcon
                                        className="h-6 w-6 flex-shrink-0 text-brand-500 group-hover:text-brand-600 transition-colors"
                                        aria-hidden="true"
                                    />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-brand-950 shadow-sm ring-2 ring-white">
                                            {itemCount}
                                        </span>
                                    )}
                                    <span className="sr-only">items in cart, view bag</span>
                                </Link>

                                <div className="h-6 w-px bg-brand-200" aria-hidden="true" />

                                <div className="flex items-center gap-x-4">
                                    <span className="hidden lg:flex lg:flex-col lg:items-end">
                                        <span className="text-sm font-semibold leading-6 text-brand-900">{user?.email || 'Premium User'}</span>
                                        <span className="text-xs text-brand-500 uppercase tracking-widest font-medium bg-brand-50 px-2 py-0.5 rounded-full mt-0.5">{user?.role || 'OWNER'}</span>
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors bg-red-50/50 px-4 py-2 rounded-full hover:bg-red-50"
                                    >
                                        Salir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <main className="py-10 bg-brand-50 min-h-[calc(100vh-4rem)]">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <Outlet />
                        </div>
                    </main>
                {/* Botón flotante de acción rápida */}
                <button
                    className="fixed z-40 bottom-8 right-8 flex items-center gap-2 bg-gold-500 text-brand-950 font-bold px-6 py-3 rounded-full shadow-glow hover:bg-gold-400 transition-all duration-300 animate-pulse hover:scale-110 focus:outline-none focus:ring-4 focus:ring-gold-400"
                    style={{ boxShadow: '0 0 32px 0 rgba(212,175,55,0.25)' }}
                    onClick={() => window.location.href = '/admin/products/new'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nuevo Producto / Venta Rápida
                </button>
                </div>
            </div>
        </>
    )
}
