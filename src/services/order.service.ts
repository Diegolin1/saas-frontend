import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createOrder = async (orderData: { customerId?: string; items: any[]; notes?: string }) => {
    const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const getOrders = async () => {
    const response = await axios.get(`${API_URL}/orders`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
    const response = await axios.put(`${API_URL}/orders/${id}/status`, { status }, {
        headers: getAuthHeader()
    });
    return response.data;
};
