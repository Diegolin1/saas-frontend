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

export interface CreateInvoiceData {
    orderId: string;
    paymentForm: string;
    paymentMethod: string;
    cfdiUse: string;
}

export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
    try {
        const response = await api.post('/invoices', data);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

export const getInvoices = async (): Promise<Invoice[]> => {
    try {
        const response = await api.get('/invoices');
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

export const downloadInvoicePdf = async (id: string, uuid?: string): Promise<void> => {
    try {
        const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Factura_${uuid || id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error) {
        throw new Error('Error al descargar el PDF de la factura.');
    }
};

export const downloadInvoiceXml = async (id: string, uuid?: string): Promise<void> => {
    try {
        const response = await api.get(`/invoices/${id}/xml`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Factura_${uuid || id}.xml`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error) {
        throw new Error('Error al descargar el XML de la factura.');
    }
};
