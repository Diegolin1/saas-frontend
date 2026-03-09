import api from './api';

/**
 * Upload an image file to the server (backed by Supabase Storage).
 * Returns the public URL of the uploaded image.
 */
export async function uploadProductImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.url;
}

/**
 * Upload a company logo file.
 * Returns the public URL of the uploaded logo.
 */
export async function uploadLogo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ url: string }>('/upload/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.url;
}

/**
 * Delete an image from storage by its public URL.
 */
export async function deleteUploadedImage(url: string): Promise<void> {
    await api.delete('/upload/image', { data: { url } });
}
