import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-brand-500 mx-auto"></div>
                    <p className="text-sm text-slate-500 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'BUYER') return <Navigate to="/" replace />;
        if (user.role === 'SELLER') return <Navigate to="/admin/orders" replace />;
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
