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

export const getInvoices = async (params?: { page?: number; limit?: number }): Promise<{ invoices: Invoice[]; pagination: InvoicePagination }> => {
    try {
        const qs = new URLSearchParams();
        if (params?.page) qs.set('page', String(params.page));
        if (params?.limit) qs.set('limit', String(params.limit));
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
