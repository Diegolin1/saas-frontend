import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    UsersIcon,
    CurrencyDollarIcon,
    TagIcon,
    ShoppingBagIcon,
    ClipboardDocumentListIcon,
    ShoppingCartIcon,
    Cog6ToothIcon,
    GiftIcon,
    ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const { itemCount } = useCart()
    const { user, logout } = useAuth()

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
            { name: 'CRM Leads', href: '/admin/leads', icon: UsersIcon },
            { name: 'Pedidos', href: '/admin/orders', icon: ClipboardDocumentListIcon },
        ];
        const adminNav = [
            ...sellerNav,
            { name: 'Productos', href: '/admin/products', icon: TagIcon },
            { name: 'Clientes', href: '/admin/customers', icon: UsersIcon },
            { name: 'Listas de Precio', href: '/admin/price-lists', icon: CurrencyDollarIcon },
            { name: 'Promociones', href: '/admin/promotions', icon: GiftIcon },
        ];
        const ownerNav = [
            ...adminNav,
            { name: 'Configuración', href: '/admin/settings', icon: Cog6ToothIcon },
        ];

        if (role === 'BUYER') return [...common, ...buyerNav];
        if (role === 'SELLER') return [...common, ...sellerNav];
        if (role === 'SUPERVISOR') return [...common, ...adminNav];
        if (role === 'OWNER' || role === 'ADMIN') return [...common, ...ownerNav];
        return common;
    };

    const navigation = getNavigation();

    const isActive = (href: string) => location.pathname === href;

    const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-4 pb-4">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center px-2 border-b border-slate-100">
                <Link to="/admin" className="text-xl font-display font-bold text-slate-900 tracking-tight">
                    Show<span className="text-brand-500">Room</span>
                </Link>
            </div>

            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-1">
                    {navigation.map((item) => (
                        <li key={item.name}>
                            <Link
                                to={item.href}
                                onClick={onLinkClick}
                                className={cn(
                                    isActive(item.href)
                                        ? 'bg-brand-50 text-brand-600 font-semibold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                    'group flex gap-x-3 rounded-lg px-3 py-2.5 text-sm leading-6 transition-colors'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive(item.href) ? 'text-brand-500' : 'text-slate-400 group-hover:text-slate-600',
                                        'h-5 w-5 shrink-0 transition-colors'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* User info at bottom of sidebar */}
                <div className="mt-auto border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-sm font-bold">
                            {(user?.name || user?.email || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || user?.email || 'Usuario'}</p>
                            <p className="text-xs text-slate-400">{user?.role || 'OWNER'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                        Cerrar sesión
                    </button>
                </div>
            </nav>
        </div>
    );

    return (
        <>
            <div>
                {/* Mobile sidebar */}
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
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
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
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                            <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </Transition.Child>
                                    <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Desktop sidebar */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                    <div className="flex grow flex-col border-r border-slate-200 bg-white">
                        <SidebarContent />
                    </div>
                </div>

                {/* Main content area */}
                <div className="lg:pl-64">
                    {/* Top bar */}
                    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-slate-500 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Abrir menú</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="h-5 w-px bg-slate-200 lg:hidden" aria-hidden="true" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="flex flex-1" />
                            <div className="flex items-center gap-x-3">
                                {/* Cart */}
                                <Link to="/cart" className="group relative p-2 text-slate-400 hover:text-brand-500 rounded-lg hover:bg-slate-50 transition-colors">
                                    <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                                            {itemCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Showroom link */}
                                <Link
                                    to="/"
                                    className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
                                >
                                    <ShoppingBagIcon className="h-4 w-4" />
                                    Ver Showroom
                                </Link>
                            </div>
                        </div>
                    </div>

                    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
                        <div className="px-4 py-8 sm:px-6 lg:px-8">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}
