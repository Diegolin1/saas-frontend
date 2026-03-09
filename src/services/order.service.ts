import api from './api';

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface OrderItemInput {
    productId: string;
    variantId?: string;
    size?: string;
    color?: string;
    quantity: number;
}

export interface CreateOrderData {
    customerId?: string;
    items: OrderItemInput[];
    notes?: string;
    promotionCode?: string;
    cartId?: string;
}

export interface OrderItem {
    id: string;
    productId: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product?: { name: string; images?: { url: string }[] };
}

export interface Order {
    id: string;
    orderNumber: number;
    companyId: string;
    customerId: string;
    status: string;
    subtotal: number;
    promotionCode?: string | null;
    discountType?: string | null;
    discountValue?: number | null;
    discountAmount: number;
    total: number;
    notes?: string | null;
    items: OrderItem[];
    customer?: { businessName: string; email?: string };
    promotion?: { code: string; type: string; discount: number } | null;
    createdAt: string;
    updatedAt: string;
}

export const createOrder = async (orderData: CreateOrderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const getOrders = async (params?: { page?: number; limit?: number; status?: string }): Promise<{ orders: Order[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    const response = await api.get(`/orders${qs ? '?' + qs : ''}`);
    return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
};
