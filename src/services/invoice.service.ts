import api, { getErrorMessage } from './api';

export interface Invoice {
    id: string;
    companyId: string;
    customerId: string;
    orderId?: string;
    facturapiId: string;
    status: string;
    uuid?: string;
    paymentForm: string;
    paymentMethod: string;
    cfdiUse: string;
    total: number | string;
    verificationUrl?: string;
    createdAt: string;
}

export interface InvoicePagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface CreateInvoiceData {
    orderId: string;
    paymentForm: string;
    paymentMethod: string;
    cfdiUse: string;
}

export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
    try {
        const response = await api.post(`/orders/${data.orderId}/invoice`, {
            paymentForm: data.paymentForm,
            paymentMethod: data.paymentMethod,
            cfdiUse: data.cfdiUse
        });
        return response.data.invoice; // Backend returns { message, invoice }
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

export interface GetInvoicesParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'createdAt' | 'total' | 'status';
    sortDir?: 'asc' | 'desc';
}

export const getInvoices = async (params?: GetInvoicesParams): Promise<{ invoices: Invoice[]; pagination: InvoicePagination }> => {
    try {
        const qs = new URLSearchParams();
        if (params?.page) qs.set('page', String(params.page));
        if (params?.limit) qs.set('limit', String(params.limit));
        if (params?.search?.trim()) qs.set('search', params.search.trim());
        if (params?.status?.trim()) qs.set('status', params.status.trim());
        if (params?.dateFrom?.trim()) qs.set('dateFrom', params.dateFrom.trim());
        if (params?.dateTo?.trim()) qs.set('dateTo', params.dateTo.trim());
        if (params?.sortBy) qs.set('sortBy', params.sortBy);
        if (params?.sortDir) qs.set('sortDir', params.sortDir);
        const response = await api.get(`/invoices${qs.toString() ? '?' + qs : ''}`);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

export const downloadInvoicePdf = async (invoiceId: string, uuid?: string): Promise<void> => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Factura_${uuid || invoiceId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error) {
        throw new Error('Error al descargar el PDF de la factura.');
    }
};

export const downloadInvoiceXml = async (invoiceId: string, uuid?: string): Promise<void> => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/xml`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Factura_${uuid || invoiceId}.xml`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error) {
        throw new Error('Error al descargar el XML de la factura.');
    }
};

export const downloadInvoicesCsv = async (params?: Omit<GetInvoicesParams, 'page' | 'limit'>): Promise<void> => {
    try {
        const qs = new URLSearchParams();
        if (params?.search?.trim()) qs.set('search', params.search.trim());
        if (params?.status?.trim()) qs.set('status', params.status.trim());
        if (params?.dateFrom?.trim()) qs.set('dateFrom', params.dateFrom.trim());
        if (params?.dateTo?.trim()) qs.set('dateTo', params.dateTo.trim());
        if (params?.sortBy) qs.set('sortBy', params.sortBy);
        if (params?.sortDir) qs.set('sortDir', params.sortDir);

        const response = await api.get(`/invoices/export/csv${qs.toString() ? '?' + qs : ''}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Facturas_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Error al exportar facturas a CSV.'));
    }
};
