import api from './api';

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Lead {
    id: string;
    phone: string;
    name?: string;
    createdAt: string;
    carts: {
        id: string;
        items: {
            quantity: number;
            subtotal: number;
        }[];
        updatedAt: string;
    }[];
}

export const getLeads = async (params?: { page?: number; limit?: number }): Promise<{ leads: Lead[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    const response = await api.get(`/leads${qs ? '?' + qs : ''}`);
    return response.data;
};
