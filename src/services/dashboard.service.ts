import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const getDashboardStats = async () => {
    const response = await axios.get(`${API_URL}/dashboard/stats`, getAuthHeader());
    return response.data;
};

export const getTopProducts = async () => {
    const response = await axios.get(`${API_URL}/dashboard/top-products`, getAuthHeader());
    return response.data;
};

export const getLowStockProducts = async () => {
    const response = await axios.get(`${API_URL}/dashboard/low-stock`, getAuthHeader());
    return response.data;
};
