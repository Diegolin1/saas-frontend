import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api/price-lists' : 'http://localhost:3000/api/price-lists';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface PriceList {
    id: string;
    name: string;
    currency: string;
    isDefault: boolean;
}

// ... existing imports

export const getPriceLists = async () => {
    const response = await axios.get(API_URL, getAuthHeader());
    return response.data;
};

export const createPriceList = async (data: { name: string, currency: string }) => {
    const response = await axios.post(API_URL, data, getAuthHeader());
    return response.data;
};

export const getPriceListItems = async (priceListId: string) => {
    const response = await axios.get(`${API_URL}/${priceListId}/items`, getAuthHeader());
    return response.data;
};

export const upsertProductPrice = async (priceListId: string, productId: string, price: number) => {
    const response = await axios.post(`${API_URL}/${priceListId}/items`, { productId, price }, getAuthHeader());
    return response.data;
};

export const removeProductPrice = async (priceListId: string, productId: string) => {
    const response = await axios.delete(`${API_URL}/${priceListId}/items/${productId}`, getAuthHeader());
    return response.data;
};
