import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

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
    const response = await axios.get(`${API_URL}/promotions`, getAuthHeader());
    return response.data;
};

export const createPromotion = async (data: { code: string; discount: number; type: string; expiresAt?: string }) => {
    const response = await axios.post(`${API_URL}/promotions`, data, getAuthHeader());
    return response.data;
};

export const updatePromotion = async (id: string, data: Partial<Promotion>) => {
    const response = await axios.put(`${API_URL}/promotions/${id}`, data, getAuthHeader());
    return response.data;
};

export const deletePromotion = async (id: string) => {
    const response = await axios.delete(`${API_URL}/promotions/${id}`, getAuthHeader());
    return response.data;
};

export const validatePromoCode = async (code: string, companyId: string) => {
    const response = await axios.post(`${API_URL}/promotions/validate`, { code, companyId });
    return response.data;
};
