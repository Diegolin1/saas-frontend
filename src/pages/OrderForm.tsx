import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrashIcon, MagnifyingGlassIcon, ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatMXN } from '../utils/format';

interface Product {
    id: string;
    name: string;
    variants: any[];
    prices: any[];
}

interface Customer {
    id: string;
    businessName: string;
    priceListId: string | null;
}

interface OrderItemEntry {
    productId: string;
    variantId: string;
    name: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    variantStock: number;
}

export default function OrderForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [customerPriceListId, setCustomerPriceListId] = useState<string | null>(null);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');

    // Fetch customers
    useEffect(() => {
        api.get('/customers?limit=100').then(res => {
            const list = res.data.customers || [];
            setCustomers(list);
            
            // Handle pre-selected customer from query param
            const customerId = searchParams.get('customer');
            if (customerId) {
                const found = list.find((c: any) => c.id === customerId);
                if (found) {
                    setSelectedCustomer(customerId);
                    setCustomerPriceListId(found.priceListId || null);
                }
            }
        }).catch(() => {});
    }, [searchParams]);

    // Fetch products (initial)
    useEffect(() => {
        api.get('/products?limit=10').then(res => setProducts(res.data.products || [])).catch(() => {});
    }, []);

    const handleCustomerChange = (customerId: string) => {
        setSelectedCustomer(customerId);
        const customer = customers.find(c => c.id === customerId);
        setCustomerPriceListId(customer?.priceListId || null);
        // If items already added, units prices might need refresh (out of scope for P0)
    };

    const searchProducts = async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await api.get(`/products?search=${term}&limit=10`);
            setSearchResults(res.data.products || []);
        } catch {
            showToast('Error buscando productos', 'error');
        } finally {
            setSearching(false);
        }
    };

    const addProductToOrder = (product: Product, variantIndex = 0) => {
        const variant = product.variants[variantIndex];
        if (!variant) return;

        // Find unit price according to customer price list
        let unitPrice = 0;
        const specificPrice = customerPriceListId ? product.prices.find(p => p.priceListId === customerPriceListId) : null;
        const defaultPrice = product.prices.find(p => p.isDefault) || product.prices[0];
        unitPrice = Number(specificPrice?.price || defaultPrice?.price || 0);

        const newItem: OrderItemEntry = {
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            size: variant.size,
            color: variant.color,
            quantity: 1,
            unitPrice,
            subtotal: unitPrice,
            variantStock: variant.stock
        };

        setOrderItems([...orderItems, newItem]);
        setSearchResults([]);
        setSearchTerm('');
    };

    const updateItemQuantity = (index: number, qty: number) => {
        const newItems = [...orderItems];
        const item = newItems[index];
        const safeQty = Math.max(1, Math.min(qty, item.variantStock));
        item.quantity = safeQty;
        item.subtotal = safeQty * item.unitPrice;
        setOrderItems(newItems);
    };

    const removeItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const subtotalOrder = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
    const taxAmount = subtotalOrder * 0.16;
    const totalOrder = subtotalOrder + taxAmount;

    const handleSubmit = async () => {
        if (!selectedCustomer) {
            showToast('Selecciona un cliente', 'error');
            return;
        }
        if (orderItems.length === 0) {
            showToast('Agrega al menos un producto', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/orders', {
                customerId: selectedCustomer,
                items: orderItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color
                })),
                notes
            });
            showToast('Pedido creado exitosamente', 'success');
            navigate('/admin/orders');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al crear pedido', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900">Nuevo Pedido Manual</h1>
                    <p className="mt-1 text-sm text-slate-500">Crea un pedido directamente para uno de tus clientes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Selection */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Seleccionar Cliente
                        </label>
                        <select
                            value={selectedCustomer}
                            onChange={(e) => handleCustomerChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 py-2.5 px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">-- Elige un cliente --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.businessName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Product Search */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <ShoppingBagIcon className="h-4 w-4" />
                            Agregar Productos
                        </label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o SKU..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    searchProducts(e.target.value);
                                }}
                                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 border border-slate-100 rounded-lg shadow-lg bg-white overflow-hidden z-10">
                                {searchResults.map(p => (
                                    <div key={p.id} className="p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {p.variants.map((v, i) => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => addProductToOrder(p, i)}
                                                    className="text-xs bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 px-2 py-1 rounded transition-colors"
                                                >
                                                    {v.color} - {v.size} ({v.stock} disp)
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searching && <p className="mt-2 text-xs text-slate-400 animate-pulse">Buscando...</p>}
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Producto</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Cantidad</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">P. Unit</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Subtotal</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orderItems.map((item, idx) => (
                                    <tr key={`${item.variantId}-${idx}`}>
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.color} / {item.size}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value))}
                                                    className="w-16 rounded border border-slate-200 p-1 text-center text-sm"
                                                />
                                                <span className="text-[10px] text-slate-400">/ {item.variantStock}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm text-slate-600">
                                            {formatMXN(item.unitPrice)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                                            {formatMXN(item.subtotal)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {orderItems.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                                            No hay productos en el pedido.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Summary & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold uppercase text-slate-500">Resumen</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="text-slate-900">{formatMXN(subtotalOrder)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">IVA (16%)</span>
                                <span className="text-slate-900">{formatMXN(taxAmount)}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="font-bold text-indigo-600 text-lg">{formatMXN(totalOrder)}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas del pedido</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="Escribe aquí observaciones o detalles de envío..."
                            />
                        </div>

                        <button
                            disabled={submitting || orderItems.length === 0 || !selectedCustomer}
                            onClick={handleSubmit}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
                                submitting || orderItems.length === 0 || !selectedCustomer
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 active:transform active:scale-95'
                            }`}
                        >
                            {submitting ? 'Creando...' : 'Crear Pedido'}
                        </button>
                        
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <p className="text-xs text-indigo-700 leading-relaxed">
                            <strong>Tip:</strong> Al seleccionar un cliente, se aplicará automáticamente su lista de precios asignada. Si no tiene una, se usará la lista predeterminada.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
