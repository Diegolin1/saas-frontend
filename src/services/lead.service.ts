import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Lead {
    id: string;
    phone: string;
    name?: string;
    createdAt: string;
    carts: {
        id: string;
        items: {
            quantity: number;
            subtotal: number;
        }[];
        updatedAt: string;
    }[];
}

export const getLeads = async (): Promise<Lead[]> => {
    const response = await axios.get(`${API_URL}/leads`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.data;
};
