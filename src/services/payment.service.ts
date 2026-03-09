import api, { getErrorMessage } from './api';

export const createCheckoutSession = async (orderId: string): Promise<{ url: string }> => {
    try {
        const response = await api.post('/payments/create-checkout-session', { orderId });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};
