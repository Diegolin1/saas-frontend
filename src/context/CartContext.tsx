import { createContext, useContext, useState, ReactNode } from 'react';

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
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);

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

    const clearCart = () => {
        setItems([]);
    };

    const total = items.reduce((acc, item) => acc + item.subtotal, 0);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, itemCount }}>
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
