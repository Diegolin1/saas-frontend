import api from './api';

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'SUPERVISOR' | 'SELLER' | 'BUYER';
    createdAt: string;
}

export const getUsers = async (params?: { page?: number; limit?: number }): Promise<{ users: User[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    const response = await api.get(`/users${qs ? '?' + qs : ''}`);
    return response.data;
};

export interface CreateUserData {
    fullName: string;
    email: string;
    password: string;
    role: 'OWNER' | 'ADMIN' | 'SUPERVISOR' | 'SELLER' | 'BUYER';
}

export interface UpdateUserData {
    fullName?: string;
    role?: 'OWNER' | 'ADMIN' | 'SUPERVISOR' | 'SELLER' | 'BUYER';
    password?: string;
}

export const createUser = async (userData: CreateUserData) => {
    const response = await api.post('/users', userData);
    return response.data;
};

export const updateUser = async (id: string, userData: UpdateUserData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};
