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
    XMarkIcon,
    ShoppingCartIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    CreditCardIcon
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
            { name: 'Dashboard', href: '/', icon: HomeIcon },
        ];

        const buyerNav = [
            { name: 'Catálogo', href: '/shop', icon: ShoppingBagIcon },
            { name: 'Mis Pedidos', href: '/orders', icon: ClipboardDocumentListIcon },
        ];

        const sellerNav = [
            { name: 'Catálogo (Venta)', href: '/shop', icon: ShoppingBagIcon },
            { name: 'Mis Pedidos (Todos)', href: '/orders', icon: ClipboardDocumentListIcon },
            { name: 'Conversaciones', href: '/conversations', icon: ChatBubbleLeftRightIcon },
        ];

        const adminNav = [ // Owner & Supervisor
            ...sellerNav,
            { name: 'Admin Productos', href: '/products', icon: TagIcon },
            { name: 'Clientes', href: '/customers', icon: UsersIcon },
            { name: 'Listas Precio', href: '/price-lists', icon: CurrencyDollarIcon },
        ];

        const ownerNav = [ // Only for Owner/Admin
            ...adminNav,
            { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon },
            { name: 'Facturación', href: '/billing', icon: CreditCardIcon },
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
                                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4 ring-1 ring-white/10">
                                        <div className="flex h-16 shrink-0 items-center">
                                            <h1 className="text-white text-xl font-bold tracking-tight">SaaS <span className="text-indigo-500">B2B</span></h1>
                                        </div>
                                        <nav className="flex flex-1 flex-col">
                                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                                <li>
                                                    <ul role="list" className="-mx-2 space-y-1">
                                                        {navigation.map((item) => (
                                                            <li key={item.name}>
                                                                <Link
                                                                    to={item.href}
                                                                    className={classNames(
                                                                        location.pathname === item.href
                                                                            ? 'bg-slate-800 text-white border-l-4 border-indigo-500'
                                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800',
                                                                        'group flex gap-x-3 rounded-r-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                                                                    )}
                                                                >
                                                                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
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
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4 border-r border-slate-800">
                        <div className="flex h-16 shrink-0 items-center">
                            <h1 className="text-white text-xl font-bold tracking-tight">SaaS <span className="text-indigo-500">B2B</span></h1>
                        </div>
                        <nav className="flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {navigation.map((item) => (
                                            <li key={item.name}>
                                                <Link
                                                    to={item.href}
                                                    className={classNames(
                                                        location.pathname === item.href
                                                            ? 'bg-slate-800 text-white border-l-4 border-indigo-500'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800',
                                                        'group flex gap-x-3 rounded-r-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                                                    )}
                                                >
                                                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
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
                    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="flex flex-1" />
                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                {/* Cart Icon */}
                                <Link to="/cart" className="group -m-2.5 p-2.5 flex items-center relative">
                                    <ShoppingCartIcon
                                        className="h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-indigo-600 transition-colors"
                                        aria-hidden="true"
                                    />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                            {itemCount}
                                        </span>
                                    )}
                                    <span className="sr-only">items in cart, view bag</span>
                                </Link>

                                <div className="h-6 w-px bg-gray-200" aria-hidden="true" />

                                <div className="flex items-center gap-x-4">
                                    <span className="hidden lg:flex lg:flex-col lg:items-end">
                                        <span className="text-sm font-semibold leading-6 text-gray-900">{user?.email}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">{user?.role}</span>
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors bg-red-50 px-3 py-1 rounded-full hover:bg-red-100"
                                    >
                                        Salir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <main className="py-10 bg-slate-50 min-h-[calc(100vh-4rem)]">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}
