import { useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { uploadProductImage, deleteUploadedImage } from '../services/upload.service';

interface UploadedImage {
    url: string;
    /** true while uploading */
    uploading?: boolean;
    /** error message if upload failed */
    error?: string;
}

interface ImageUploaderProps {
    /** Current image URLs (from existing product or completed uploads) */
    value: string[];
    /** Called whenever the list of URLs changes */
    onChange: (urls: string[]) => void;
    /** Max number of images allowed (default: 8) */
    maxImages?: number;
    /** Whether to show a "primary" badge on the first image */
    showPrimaryBadge?: boolean;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ImageUploader({
    value,
    onChange,
    maxImages = 8,
    showPrimaryBadge = true
}: ImageUploaderProps) {
    const [items, setItems] = useState<UploadedImage[]>(() =>
        value.map(url => ({ url }))
    );
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const syncUrls = useCallback((newItems: UploadedImage[]) => {
        const urls = newItems
            .filter(i => !i.uploading && !i.error)
            .map(i => i.url);
        onChange(urls);
    }, [onChange]);

    const processFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files).slice(0, maxImages - items.length);
        if (fileArray.length === 0) return;

        // Validate before adding to list
        const valid = fileArray.filter(f => {
            if (!ACCEPTED.includes(f.type)) return false;
            if (f.size > MAX_SIZE) return false;
            return true;
        });
        if (valid.length === 0) return;

        // Add placeholders while uploading
        const placeholders: UploadedImage[] = valid.map(() => ({
            url: '',
            uploading: true
        }));
        const startIndex = items.length;
        const updated = [...items, ...placeholders];
        setItems(updated);

        // Upload each file
        const results = await Promise.allSettled(
            valid.map(f => uploadProductImage(f))
        );

        setItems(prev => {
            const next = [...prev];
            results.forEach((result, i) => {
                const idx = startIndex + i;
                if (result.status === 'fulfilled') {
                    next[idx] = { url: result.value, uploading: false };
                } else {
                    next[idx] = { url: '', uploading: false, error: 'Error al subir' };
                }
            });
            syncUrls(next);
            return next;
        });
    }, [items, maxImages, syncUrls]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const handleRemove = useCallback(async (index: number) => {
        const item = items[index];
        const next = items.filter((_, i) => i !== index);
        setItems(next);
        syncUrls(next);
        // Attempt to delete from storage (non-blocking, best effort)
        if (item.url) {
            deleteUploadedImage(item.url).catch(() => { /* ignore */ });
        }
    }, [items, syncUrls]);

    const hasUploading = items.some(i => i.uploading);
    const canAddMore = items.length < maxImages && !hasUploading;

    return (
        <div className="space-y-3">
            {/* Image grid */}
            {items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {items.map((item, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
                            {item.uploading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                    <span className="text-xs text-slate-400">Subiendo...</span>
                                </div>
                            ) : item.error ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                                    <ExclamationCircleIcon className="h-8 w-8 text-red-400" />
                                    <span className="text-xs text-red-500">{item.error}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(index)}
                                        className="text-xs text-slate-500 underline"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={item.url}
                                        alt={`Imagen ${index + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).src = ''; }}
                                    />
                                    {showPrimaryBadge && index === 0 && (
                                        <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                                            <CheckCircleIcon className="h-3 w-3" />
                                            Principal
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(index)}
                                        className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center rounded-full bg-white/90 p-1 shadow hover:bg-red-50 hover:text-red-600 transition-colors"
                                        title="Eliminar imagen"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Drop zone */}
            {canAddMore && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${
                        dragging
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/50'
                    }`}
                >
                    {dragging ? (
                        <CloudArrowUpIcon className="h-10 w-10 text-brand-500" />
                    ) : (
                        <PhotoIcon className="h-10 w-10 text-slate-300" />
                    )}
                    <div className="text-center">
                        <p className="text-sm font-medium text-slate-700">
                            {dragging ? 'Suelta las imágenes aquí' : 'Arrastra imágenes o haz clic para seleccionar'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            JPG, PNG, WEBP o GIF · Máx. 5 MB · Hasta {maxImages} imágenes
                        </p>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        className="sr-only"
                        accept={ACCEPTED.join(',')}
                        multiple
                        onChange={e => e.target.files && processFiles(e.target.files)}
                    />
                </div>
            )}

            {items.length >= maxImages && (
                <p className="text-xs text-slate-400 text-center">Límite de {maxImages} imágenes alcanzado.</p>
            )}
        </div>
    );
}
