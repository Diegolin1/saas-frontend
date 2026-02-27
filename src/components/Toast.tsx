import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
        error: <XCircleIcon className="w-6 h-6 text-red-500" />,
        warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />,
        info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200'
    };

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-glow border-2 ${bgColors[type]} animate-fade-in`}>
            {icons[type]}
            <span className="font-bold text-brand-900">{message}</span>
            <button
                onClick={onClose}
                className="ml-4 text-brand-500 hover:text-brand-700 transition-colors"
            >
                ×
            </button>
        </div>
    );
};
