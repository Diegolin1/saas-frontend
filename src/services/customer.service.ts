import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/customers`;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface Customer {
    id: string;
    businessName: string;
    taxId?: string;
    code?: string;
    creditLimit: number;
    currentBalance: number;
    shippingAddress?: any;
    priceList?: { id: string, name: string };
    priceListId?: string;
    sellerId?: string;
    seller?: { fullName: string };
}

export const getCustomers = async () => {
    const response = await axios.get(API_URL, getAuthHeader());
    return response.data;
};

export const getCustomer = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
    return response.data;
};

export const createCustomer = async (data: Partial<Customer>) => {
    const response = await axios.post(API_URL, data, getAuthHeader());
    return response.data;
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeader());
    return response.data;
};

export const deleteCustomer = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    return response.data;
};
