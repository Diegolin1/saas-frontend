import api from './api';

export const getDashboardStats = async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};

export const getTopProducts = async () => {
    const response = await api.get('/dashboard/top-products');
    return response.data;
};

export const getLowStockProducts = async () => {
    const response = await api.get('/dashboard/low-stock');
    return response.data;
};

export const getSalesByDay = async (): Promise<{ date: string; total: number }[]> => {
    const response = await api.get('/dashboard/sales-by-day');
    return response.data;
};
