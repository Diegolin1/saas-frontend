import api from './api';

export interface PriceList {
    id: string;
    name: string;
    currency: string;
    isDefault: boolean;
}

export const getPriceLists = async () => {
    const response = await api.get('/price-lists');
    return response.data;
};

export const createPriceList = async (data: { name: string, currency: string }) => {
    const response = await api.post('/price-lists', data);
    return response.data;
};

export const deletePriceList = async (id: string) => {
    const response = await api.delete(`/price-lists/${id}`);
    return response.data;
};

export const updatePriceList = async (id: string, data: { name?: string; currency?: string; isDefault?: boolean }) => {
    const response = await api.put(`/price-lists/${id}`, data);
    return response.data;
};

export const getPriceListItems = async (priceListId: string) => {
    const response = await api.get(`/price-lists/${priceListId}/items`);
    return response.data;
};

export const upsertProductPrice = async (priceListId: string, productId: string, price: number) => {
    const response = await api.post(`/price-lists/${priceListId}/items`, { productId, price });
    return response.data;
};

export const removeProductPrice = async (priceListId: string, productId: string) => {
    const response = await api.delete(`/price-lists/${priceListId}/items/${productId}`);
    return response.data;
};
