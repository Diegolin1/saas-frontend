import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import PriceLists from './pages/PriceLists'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Catalog from './pages/Shop/Catalog'
import ProductDetail from './pages/Shop/ProductDetail'
import Cart from './pages/Shop/Cart'
import Orders from './pages/Orders'
import SettingsLayout from './pages/Settings/Layout'

import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* PUBLIC ROUTES (Showroom) */}
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<Catalog />} />
                            <Route path="/product/:id" element={<ProductDetail />} />
                            <Route path="/cart" element={<Cart />} />
                        </Route>

                        {/* PROTECTED ADMIN / BUYER ROUTES */}
                        <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER', 'BUYER']} />}>
                            <Route path="/admin" element={<Layout />}>

                                {/* Common / Redirect Dashboard */}
                                <Route index element={<Dashboard />} />

                                {/* Admin / Seller Routes */}
                                <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER']} />}>
                                    <Route path="customers" element={<Customers />} />
                                    <Route path="orders" element={<Orders />} />
                                </Route>

                                <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUPERVISOR']} />}>
                                    <Route path="price-lists" element={<PriceLists />} />
                                    <Route path="products" element={<Products />} />
                                    <Route path="products/new" element={<ProductForm />} />
                                    <Route path="settings" element={<SettingsLayout />} />
                                </Route>

                                {/* Buyer Routes if they log in to see specific history */}
                                <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
                                    <Route path="my-orders" element={<Orders />} />
                                </Route>

                            </Route>
                        </Route>

                        {/* Redirect legacy /shop to / */}
                        <Route path="/shop" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    )
}

export default App
