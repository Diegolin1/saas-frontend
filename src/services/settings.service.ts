import api from './api';

export interface CompanySettings {
    id: string;
    name: string;
    taxId: string | null;
    slugName: string | null;
    address: {
        street?: string;
        extNumber?: string;
        intNumber?: string;
        neighborhood?: string;
        zipCode?: string;
        city?: string;
        state?: string;
    } | null;
    settings: {
        whatsappPhone?: string;
        logoUrl?: string;
        categories?: string[];
        city?: string;
        state?: string;
        currency?: string;
        brandColor?: string;
    } | null;
}

export interface PublicCompanyInfo {
    id: string;
    name: string;
    logoUrl: string | null;
    whatsappPhone: string | null;
    city: string | null;
    state: string | null;
    currency: string;
    categories: string[];
    brandColor: string | null;
}

export const getSettings = async (): Promise<CompanySettings> => {
    const response = await api.get('/settings');
    return response.data;
};

export const updateSettings = async (data: {
    name?: string;
    taxId?: string | null;
    address?: Record<string, string>;
    settings?: Record<string, unknown>;
}): Promise<CompanySettings> => {
    const response = await api.put('/settings', data);
    return response.data;
};

export const getPublicCompanyInfo = async (companyId: string): Promise<PublicCompanyInfo> => {
    const response = await api.get(`/settings/public/${companyId}`);
    return response.data;
};

export const getCompanyBySlug = async (slug: string): Promise<PublicCompanyInfo & { id: string }> => {
    const response = await api.get(`/settings/public/by-slug/${encodeURIComponent(slug)}`);
    return response.data;
};

export const updateSlug = async (slugName: string): Promise<{ slugName: string | null }> => {
    const response = await api.patch('/settings/slug', { slugName });
    return response.data;
};
