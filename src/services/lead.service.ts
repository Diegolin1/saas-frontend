import api from './api';

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface Lead {
    id: string;
    phone: string;
    name?: string;
    status: LeadStatus;
    source?: string;
    notes?: string;
    assignedToId?: string;
    assignedTo?: { id: string; fullName: string };
    createdAt: string;
    updatedAt: string;
    carts: {
        id: string;
        items: {
            quantity: number;
            subtotal: number;
        }[];
        updatedAt: string;
    }[];
}

export const getLeads = async (params?: {
    page?: number;
    limit?: number;
    status?: LeadStatus;
    search?: string;
    assignedToId?: string;
}): Promise<{ leads: Lead[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.assignedToId) searchParams.set('assignedToId', params.assignedToId);
    const qs = searchParams.toString();
    const response = await api.get(`/leads${qs ? '?' + qs : ''}`);
    return response.data;
};

export const updateLead = async (id: string, data: {
    status?: LeadStatus;
    assignedToId?: string | null;
    notes?: string;
    source?: string;
}): Promise<Lead> => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
};

export const deleteLead = async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
};
