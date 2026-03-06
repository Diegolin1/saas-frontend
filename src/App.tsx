import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import LeadsCRM from './pages/LeadsCRM'
import PriceLists from './pages/PriceLists'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Catalog from './pages/Shop/Catalog'
import ProductDetail from './pages/Shop/ProductDetail'
import Cart from './pages/Shop/Cart'
import Orders from './pages/Orders'
import Promotions from './pages/Promotions'
import SettingsLayout from './pages/Settings/Layout'

import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

// Simple 404 page
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
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* PUBLIC ROUTES (Showroom) */}
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                            <Route path="/product/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
                            <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
                        </Route>

                        {/* PROTECTED ADMIN / BUYER ROUTES */}
                        <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER', 'BUYER']} />}>
                            <Route path="/admin" element={<Layout />}>

                                {/* Common / Redirect Dashboard */}
                                <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />

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
                                    <Route path="settings" element={<ErrorBoundary><SettingsLayout /></ErrorBoundary>} />
                                </Route>

                                {/* Buyer Routes if they log in to see specific history */}
                                <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
                                    <Route path="my-orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
                                </Route>

                            </Route>
                        </Route>

                        {/* Redirect legacy /shop to / */}
                        <Route path="/shop" element={<Navigate to="/" replace />} />

                        {/* 404 catch-all */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    </ErrorBoundary>
                </BrowserRouter>
                </ToastProvider>
            </CartProvider>
        </AuthProvider>
    )
}

export default App
