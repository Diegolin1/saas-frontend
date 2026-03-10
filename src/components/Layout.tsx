import { Fragment, useState, useEffect, useRef } from 'react'
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
    DocumentTextIcon,
    MagnifyingGlassIcon,
    ChevronDoubleLeftIcon,
    BellIcon,
    ChevronRightIcon,
    ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

// Breadcrumb labels for known routes
const ROUTE_LABELS: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/leads': 'CRM Leads',
    '/admin/orders': 'Pedidos',
    '/admin/products': 'Productos',
    '/admin/products/new': 'Nuevo Producto',
    '/admin/customers': 'Clientes',
    '/admin/price-lists': 'Listas de Precio',
    '/admin/promotions': 'Promociones',
    '/admin/invoices': 'Facturación',
    '/admin/settings': 'Configuración',
    '/admin/my-orders': 'Mis Pedidos',
}

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const { itemCount } = useCart()
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [globalSearch, setGlobalSearch] = useState('')
    const [collapsed, setCollapsed] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [avatarOpen, setAvatarOpen] = useState(false)
    const avatarRef = useRef<HTMLDivElement>(null)

    // Fetch pending orders count for notification bell (solo roles de gestión)
    useEffect(() => {
        const role = user?.role;
        if (!role || role === 'BUYER') return; // BUYER no llama a dashboard/stats
        const fetchPending = async () => {
            try {
                const res = await api.get('/dashboard/stats')
                setPendingCount(res.data?.pendingOrders || 0)
            } catch { /* silent */ }
        }
        fetchPending()
        const interval = setInterval(fetchPending, 60000)
        return () => clearInterval(interval)
    }, [user?.role])

    // Close avatar dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setAvatarOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Build breadcrumbs
    const breadcrumbs = (() => {
        const path = location.pathname
        if (path === '/admin') return [{ label: 'Dashboard', href: '/admin' }]

        const crumbs = [{ label: 'Dashboard', href: '/admin' }]

        // Check for exact route match
        if (ROUTE_LABELS[path]) {
            crumbs.push({ label: ROUTE_LABELS[path], href: path })
        } else {
            // Handle dynamic routes like /admin/products/:id/edit
            const segments = path.replace('/admin/', '').split('/')
            let built = '/admin'
            for (const seg of segments) {
                built += '/' + seg
                if (ROUTE_LABELS[built]) {
                    crumbs.push({ label: ROUTE_LABELS[built], href: built })
                } else if (seg === 'edit') {
                    crumbs.push({ label: 'Editar', href: built })
                }
            }
        }
        return crumbs
    })()

    const getNavigation = () => {
        const role = user?.role;

        const common = [
            { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        ];
        const buyerNav = [
            { name: 'Ir al Catálogo', href: '/', icon: ShoppingBagIcon },
            { name: 'Mis Pedidos', href: '/admin/my-orders', icon: ClipboardDocumentListIcon },
        ];
        const sellerNav = [
            { name: 'Ir al Catálogo', href: '/', icon: ShoppingBagIcon },
            { name: 'CRM Leads', href: '/admin/leads', icon: UsersIcon },
            { name: 'Pedidos', href: '/admin/orders', icon: ClipboardDocumentListIcon },
        ];
        const adminNav = [
            ...sellerNav,
            { name: 'Productos', href: '/admin/products', icon: TagIcon },
            { name: 'Clientes', href: '/admin/customers', icon: UsersIcon },
            { name: 'Listas de Precio', href: '/admin/price-lists', icon: CurrencyDollarIcon },
            { name: 'Promociones', href: '/admin/promotions', icon: GiftIcon },
            { name: 'Facturación', href: '/admin/invoices', icon: DocumentTextIcon },
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

    const userInitial = (user?.name || user?.email || 'U')[0].toUpperCase()

    const SidebarContent = ({ onLinkClick, isCollapsed = false }: { onLinkClick?: () => void; isCollapsed?: boolean }) => (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-stone-900 px-4 pb-4">
            {/* Logo */}
            <div className={`flex h-20 shrink-0 items-center border-b border-stone-700/50 ${isCollapsed ? 'justify-center px-0' : 'justify-center px-2'}`}>
                <Link to="/admin" className="hover:opacity-80 transition-opacity flex items-center justify-center w-full">
                    {isCollapsed ? (
                        <span className="text-lg font-display font-black text-white">CF</span>
                    ) : (
                        <img src="/assets/logo-light.png" alt="Cuero Firme" className="h-[3.25rem] w-auto object-contain" />
                    )}
                </Link>
            </div>

            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-1">
                    {navigation.map((item) => (
                        <li key={item.name}>
                            <Link
                                to={item.href}
                                onClick={onLinkClick}
                                title={isCollapsed ? item.name : undefined}
                                className={cn(
                                    isActive(item.href)
                                        ? 'bg-white/10 text-white font-semibold'
                                        : 'text-stone-400 hover:bg-white/5 hover:text-stone-200',
                                    'group flex gap-x-3 rounded-lg text-sm leading-6 transition-colors',
                                    isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive(item.href) ? 'text-white' : 'text-stone-500 group-hover:text-stone-300',
                                        'h-5 w-5 shrink-0 transition-colors'
                                    )}
                                    aria-hidden="true"
                                />
                                {!isCollapsed && item.name}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Sidebar bottom — only logout, user moved to top bar avatar */}
                <div className="mt-auto border-t border-stone-700/50 pt-4">
                    <button
                        onClick={logout}
                        title={isCollapsed ? 'Cerrar sesión' : undefined}
                        className={cn(
                            'flex w-full items-center gap-2 rounded-lg text-sm text-stone-400 hover:bg-red-500/10 hover:text-red-400 transition-colors',
                            isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
                        )}
                    >
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                        {!isCollapsed && 'Cerrar sesión'}
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
                            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" />
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
                <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}>
                    <div className="flex grow flex-col bg-stone-900">
                        <SidebarContent isCollapsed={collapsed} />
                        {/* Collapse toggle */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-stone-300 bg-white shadow-sm hover:bg-stone-50 transition-all"
                        >
                            <ChevronDoubleLeftIcon className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Main content area */}
                <div className={`transition-all duration-300 flex flex-col h-screen overflow-hidden ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
                    {/* Top bar */}
                    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-stone-500 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Abrir menú</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="h-5 w-px bg-slate-200 lg:hidden" aria-hidden="true" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            {/* Breadcrumbs — hidden on mobile */}
                            <nav className="hidden lg:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                                {breadcrumbs.map((crumb, i) => (
                                    <Fragment key={crumb.href}>
                                        {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-stone-300 flex-shrink-0" />}
                                        <Link
                                            to={crumb.href}
                                            className={cn(
                                                i === breadcrumbs.length - 1
                                                    ? 'text-stone-900 font-semibold'
                                                    : 'text-stone-400 hover:text-stone-600',
                                                'transition-colors whitespace-nowrap'
                                            )}
                                        >
                                            {crumb.label}
                                        </Link>
                                    </Fragment>
                                ))}
                            </nav>

                            {/* Spacer */}
                            <div className="flex-1 lg:hidden" />

                            {/* Global search */}
                            <div className="relative flex items-center max-w-xs ml-auto">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={globalSearch}
                                    onChange={e => setGlobalSearch(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && globalSearch.trim()) {
                                            const q = globalSearch.trim().toLowerCase();
                                            if (q.startsWith('#') || q.startsWith('ped')) navigate('/admin/orders');
                                            else if (q.includes('lead') || q.includes('prospecto')) navigate('/admin/leads');
                                            else navigate('/admin/products');
                                            setGlobalSearch('');
                                        }
                                    }}
                                    className="h-9 w-44 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-stone-700 placeholder:text-stone-400 focus:w-64 focus:border-stone-400 focus:bg-white focus:ring-1 focus:ring-stone-400 transition-all duration-300"
                                />
                            </div>

                            <div className="flex items-center gap-x-2">
                                {/* Notification bell — solo para roles de gestión */}
                                {user?.role !== 'BUYER' && (
                                    <Link
                                        to="/admin/orders"
                                        className="group relative p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-slate-50 transition-colors"
                                        title="Pedidos pendientes"
                                    >
                                        <BellIcon className="h-5 w-5" aria-hidden="true" />
                                        {pendingCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                                                {pendingCount > 9 ? '9+' : pendingCount}
                                            </span>
                                        )}
                                    </Link>
                                )}

                                {/* Cart */}
                                <Link to="/cart" className="group relative p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-slate-50 transition-colors">
                                    <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-white">
                                            {itemCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Catálogo link */}
                                <Link
                                    to="/"
                                    className="hidden sm:flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
                                >
                                    <ShoppingBagIcon className="h-4 w-4" />
                                    Catálogo
                                </Link>

                                {/* Separator */}
                                <div className="hidden sm:block h-6 w-px bg-slate-200" />

                                {/* Avatar dropdown */}
                                <div className="relative" ref={avatarRef}>
                                    <button
                                        onClick={() => setAvatarOpen(!avatarOpen)}
                                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-white text-xs font-bold">
                                            {userInitial}
                                        </div>
                                        <span className="hidden sm:block text-sm font-medium text-stone-700 max-w-[100px] truncate">
                                            {user?.name || user?.email?.split('@')[0] || 'Usuario'}
                                        </span>
                                    </button>

                                    {/* Dropdown */}
                                    {avatarOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50 animate-fade-in">
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <p className="text-sm font-semibold text-stone-900">{user?.name || 'Usuario'}</p>
                                                <p className="text-xs text-stone-400 truncate">{user?.email}</p>
                                                <span className="mt-1 inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
                                                    {user?.role}
                                                </span>
                                            </div>
                                            {/* Configuración (solo roles de gestión) */}
                                            {user?.role !== 'BUYER' && (
                                                <Link
                                                    to="/admin/settings"
                                                    onClick={() => setAvatarOpen(false)}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Cog6ToothIcon className="h-4 w-4 text-stone-400" />
                                                    Configuración
                                                </Link>
                                            )}
                                            <Link
                                                to="/"
                                                onClick={() => setAvatarOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-600 hover:bg-slate-50 transition-colors"
                                            >
                                                <ShoppingBagIcon className="h-4 w-4 text-stone-400" />
                                                Ver Catálogo
                                            </Link>
                                            <div className="border-t border-slate-100 mt-1 pt-1">
                                                <button
                                                    onClick={() => { setAvatarOpen(false); logout(); }}
                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                                                    Cerrar sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <main className="flex-1 overflow-y-auto bg-slate-50 relative">
                        <div className="px-4 py-8 sm:px-6 lg:px-8">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}
