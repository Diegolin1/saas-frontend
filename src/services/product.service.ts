import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface ProductVariant {
    id?: string;
    size: string;
    color: string;
    stock: number;
}

export interface ProductImage {
    id?: string;
    url: string;
    isPrimary?: boolean;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    description: string;
    category: string;
    price?: number; // Virtual field for display from PriceList
    variants: ProductVariant[];
    images: ProductImage[];
    isActive: boolean;
}

export const getProducts = async () => {
    const response = await axios.get(`${API_URL}/products`, getAuthHeader());
    return response.data;
};

export const getProduct = async (id: string) => {
    const response = await axios.get(`${API_URL}/products/${id}`, getAuthHeader());
    return response.data;
};

export const createProduct = async (productData: any) => {
    const response = await axios.post(`${API_URL}/products`, productData, getAuthHeader());
    return response.data;
};

export const updateProduct = async (id: string, productData: any) => {
    const response = await axios.put(`${API_URL}/products/${id}`, productData, getAuthHeader());
    return response.data;
};

export const deleteProduct = async (id: string) => {
    const response = await axios.delete(`${API_URL}/products/${id}`, getAuthHeader());
    return response.data;
};

export const updateStock = async (variantId: string, stock: number) => {
    const response = await axios.post(`${API_URL}/products/stock`, { variantId, stock }, getAuthHeader());
    return response.data;
};

export const getPublicCatalog = async (companyId: string = 'default') => {
    // Truly public without token
    const response = await axios.get(`${API_URL}/products/public/${companyId}`);
    return response.data;
};
