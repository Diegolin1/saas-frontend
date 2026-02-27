import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'SUPERVISOR' | 'SELLER' | 'BUYER';
    createdAt: string;
}

export const getUsers = async () => {
    const response = await axios.get(`${API_URL}/users`, getAuthHeader());
    return response.data;
};

export const createUser = async (userData: any) => {
    const response = await axios.post(`${API_URL}/users`, userData, getAuthHeader());
    return response.data;
};

export const updateUser = async (id: string, userData: any) => {
    const response = await axios.put(`${API_URL}/users/${id}`, userData, getAuthHeader());
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await axios.delete(`${API_URL}/users/${id}`, getAuthHeader());
    return response.data;
};
