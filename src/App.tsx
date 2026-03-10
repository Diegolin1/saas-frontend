import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import BuyerLayout from './components/BuyerLayout'
import PublicLayout from './components/PublicLayout'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// ── Eagerly-loaded pages (public critical path) ──────────────────
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Catalog from './pages/Shop/Catalog'
import ProductDetail from './pages/Shop/ProductDetail'
import Cart from './pages/Shop/Cart'

// ── Lazily-loaded admin pages (only loaded when needed) ──────────
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Customers = lazy(() => import('./pages/Customers'))
const LeadsCRM = lazy(() => import('./pages/LeadsCRM'))
const PriceLists = lazy(() => import('./pages/PriceLists'))
const Products = lazy(() => import('./pages/Products'))
const ProductForm = lazy(() => import('./pages/ProductForm'))
const Orders = lazy(() => import('./pages/Orders'))
const Promotions = lazy(() => import('./pages/Promotions'))
const Invoices = lazy(() => import('./pages/Invoices'))
const SettingsLayout = lazy(() => import('./pages/Settings/Layout'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const BuyerOrders = lazy(() => import('./pages/buyer/BuyerOrders'))
const BuyerInvoices = lazy(() => import('./pages/buyer/BuyerInvoices'))
const BuyerCatalog = lazy(() => import('./pages/buyer/BuyerCatalog'))

// ── Loading fallback ─────────────────────────────────────────────
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-slate-400">Cargando…</span>
            </div>
        </div>
    )
}

// ── Simple 404 page ──────────────────────────────────────────────
function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold text-gray-300">404</h1>
                <p className="text-xl text-gray-600">Página no encontrada</p>
                <Link to="/" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Ir al inicio
                </Link>
            </div>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    {/* Auth routes */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                                    <Route path="/privacidad" element={<PrivacyPolicy />} />

                                    {/* PUBLIC ROUTES (Catálogo) */}
                                    <Route element={<PublicLayout />}>
                                        <Route path="/" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                                        <Route path="/product/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
                                        <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
                                    </Route>

                                    {/* PROTECTED ADMIN / BUYER ROUTES */}
                                    <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER', 'BUYER']} />}>
                                        <Route path="/admin" element={<Layout />}>

                                            {/* Dashboard — solo roles de gestión. BUYER → redirigir a my-orders */}
                                            <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER']} />}>
                                                <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                                            </Route>

                                            {/* Admin / Seller Routes */}
                                            <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER']} />}>
                                                <Route path="customers" element={<ErrorBoundary><Customers /></ErrorBoundary>} />
                                                <Route path="leads" element={<ErrorBoundary><LeadsCRM /></ErrorBoundary>} />
                                                <Route path="orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
                                            </Route>

                                            <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR']} />}>
                                                <Route path="price-lists" element={<ErrorBoundary><PriceLists /></ErrorBoundary>} />
                                                <Route path="products" element={<ErrorBoundary><Products /></ErrorBoundary>} />
                                                <Route path="products/new" element={<ErrorBoundary><ProductForm /></ErrorBoundary>} />
                                                <Route path="products/:id/edit" element={<ErrorBoundary><ProductForm /></ErrorBoundary>} />
                                                <Route path="promotions" element={<ErrorBoundary><Promotions /></ErrorBoundary>} />
                                                <Route path="invoices" element={<ErrorBoundary><Invoices /></ErrorBoundary>} />
                                                <Route path="settings" element={<ErrorBoundary><SettingsLayout /></ErrorBoundary>} />
                                            </Route>

                                            {/* Buyer Portal — rutas exclusivas del comprador */}
                                            <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
                                                <Route path="my-orders" element={<Navigate to="/buyer/orders" replace />} />
                                            </Route>

                                        </Route>
                                    </Route>

                                    {/* BUYER PORTAL */}
                                    <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
                                        <Route path="/buyer" element={<BuyerLayout />}>
                                            <Route index element={<Navigate to="orders" replace />} />
                                            <Route path="orders" element={<ErrorBoundary><BuyerOrders /></ErrorBoundary>} />
                                            <Route path="invoices" element={<ErrorBoundary><BuyerInvoices /></ErrorBoundary>} />
                                            <Route path="catalog" element={<ErrorBoundary><BuyerCatalog /></ErrorBoundary>} />
                                        </Route>
                                    </Route>

                                    {/* Redirect legacy /shop to / */}
                                    <Route path="/shop" element={<Navigate to="/" replace />} />

                                    {/* 404 catch-all */}
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </ErrorBoundary>
                    </BrowserRouter>
                </ToastProvider>
            </CartProvider>
        </AuthProvider>
    )
}

export default App

