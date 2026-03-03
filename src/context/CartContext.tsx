import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface CartItem {
    productId: string;
    variantId?: string; // Added for specific variant tracking
    name: string;
    price: number;
    image: string;
    size: string;
    color: string;
    quantity: number;
    subtotal: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (index: number) => void;
    updateQuantity: (index: number, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
    isB2BUnlocked: boolean;
    b2bLead: { id: string; name: string; phone: string } | null;
    unlockB2B: (lead: { id: string; name: string; phone: string }) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'saas_cart_items';

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        // Cargar carrito desde localStorage al inicializar
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    });

    const [b2bLead, setB2BLead] = useState<{ id: string; name: string; phone: string } | null>(() => {
        try {
            const saved = localStorage.getItem('b2b_lead');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const isB2BUnlocked = !!b2bLead;

    // Persistir carrito en localStorage cada vez que cambie
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

            // Sync con backend de forma optimista
            if (items.length > 0) {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                const cartId = localStorage.getItem('saas_cart_id');
                const companyId = import.meta.env.VITE_COMPANY_ID || 'demo';

                fetch(`${API_URL}/carts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: cartId,
                        companyId,
                        leadId: b2bLead?.id,
                        items: items
                    })
                }).then(res => res.json())
                    .then(data => {
                        if (data?.id && !cartId) {
                            localStorage.setItem('saas_cart_id', data.id);
                        }
                    }).catch(err => console.error('Background cart sync failed:', err));
            }
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }, [items, b2bLead]);

    const unlockB2B = (lead: { id: string; name: string; phone: string }) => {
        setB2BLead(lead);
        localStorage.setItem('b2b_lead', JSON.stringify(lead));
    };

    const addToCart = (newItem: CartItem) => {
        setItems((prevItems) => {
            // Simple logic: just push for now, or merge if exact same product/size/color
            const existingIndex = prevItems.findIndex(
                (i) => i.productId === newItem.productId && i.size === newItem.size && i.color === newItem.color
            );

            if (existingIndex > -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingIndex].quantity += newItem.quantity;
                updatedItems[existingIndex].subtotal += newItem.subtotal;
                return updatedItems;
            }
            return [...prevItems, newItem];
        });
    };

    const removeFromCart = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(index);
            return;
        }
        setItems((prev) => {
            const updated = [...prev];
            updated[index].quantity = quantity;
            updated[index].subtotal = quantity * updated[index].price;
            return updated;
        });
    };

    const clearCart = () => {
        setItems([]);
    };

    const total = items.reduce((acc, item) => acc + item.subtotal, 0);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount, isB2BUnlocked, b2bLead, unlockB2B }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
