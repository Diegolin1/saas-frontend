import api from './api';

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Customer {
    id: string;
    businessName: string;
    taxId?: string;
    code?: string;
    creditLimit: number;
    currentBalance: number;
    shippingAddress?: Record<string, unknown>;
    priceList?: { id: string, name: string };
    priceListId?: string;
    sellerId?: string;
    seller?: { fullName: string };
}

export const getCustomers = async (params?: { page?: number; limit?: number; search?: string }): Promise<{ customers: Customer[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    const response = await api.get(`/customers${qs ? '?' + qs : ''}`);
    return response.data;
};

export const getCustomer = async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
};

export const createCustomer = async (data: Partial<Customer>) => {
    const response = await api.post('/customers', data);
    return response.data;
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
};

export const deleteCustomer = async (id: string) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
};
