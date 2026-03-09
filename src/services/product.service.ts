import api from './api';

const DEFAULT_COMPANY_ID = import.meta.env.VITE_COMPANY_ID || 'demo';

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

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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
    tags?: string[]; // Opcional para insignias premium
}

export const getProducts = async (params?: { page?: number; limit?: number; search?: string }): Promise<{ products: Product[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    const response = await api.get(`/products${qs ? '?' + qs : ''}`);
    return response.data;
};

export const getProduct = async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export interface CreateProductData {
    name: string;
    sku: string;
    description?: string;
    category?: string;
    materials?: string;
    variants: { size: string; color: string; stock: number }[];
    images?: string[];
    price?: number;
}

export const createProduct = async (productData: CreateProductData) => {
    const response = await api.post('/products', productData);
    return response.data;
};

export const updateProduct = async (id: string, productData: Partial<CreateProductData> & { isActive?: boolean }) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const updateStock = async (variantId: string, stock: number) => {
    const response = await api.post('/products/stock', { variantId, stock });
    return response.data;
};

export const getPublicCatalog = async (companyId: string = DEFAULT_COMPANY_ID, params?: { search?: string; category?: string; page?: number; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    const response = await api.get(`/products/public/${companyId}${qs ? '?' + qs : ''}`);
    return response.data;
};

export const importProductsCsv = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/bulk-import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
