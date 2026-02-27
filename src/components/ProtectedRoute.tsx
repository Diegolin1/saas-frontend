import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-50">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'BUYER') return <Navigate to="/shop" replace />;
        if (user.role === 'SELLER') return <Navigate to="/customers" replace />; // Or dashboard
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
