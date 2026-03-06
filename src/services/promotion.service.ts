import api from './api';

export interface Promotion {
    id: string;
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
    expiresAt?: string | null;
    isActive: boolean;
    createdAt: string;
}

export const getPromotions = async (): Promise<Promotion[]> => {
    const response = await api.get('/promotions');
    return response.data;
};

export const createPromotion = async (data: { code: string; discount: number; type: string; expiresAt?: string }) => {
    const response = await api.post('/promotions', data);
    return response.data;
};

export const updatePromotion = async (id: string, data: Partial<Promotion>) => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data;
};

export const deletePromotion = async (id: string) => {
    const response = await api.delete(`/promotions/${id}`);
    return response.data;
};

export const validatePromoCode = async (code: string, companyId: string) => {
    const response = await api.post('/promotions/validate', { code, companyId });
    return response.data;
};
