import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../services/settings.service';

export default function BuyerCatalog() {
    const { user } = useAuth();
    const companyId = user?.companyId || '';
    const [catalogUrl, setCatalogUrl] = useState(`/?companyId=${companyId}`);

    useEffect(() => {
        if (!companyId) return;
        getSettings()
            .then((settings) => {
                if (settings.slugName) {
                    setCatalogUrl(`/?slug=${encodeURIComponent(settings.slugName)}`);
                } else {
                    setCatalogUrl(`/?companyId=${companyId}`);
                }
            })
            .catch(() => {
                setCatalogUrl(`/?companyId=${companyId}`);
            });
    }, [companyId]);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-display font-bold text-slate-900">Catálogo de tu proveedor</h1>
            <p className="mt-2 text-sm text-slate-500">
                Explora el catálogo público de tu empresa y agrega productos al carrito para crear nuevos pedidos.
            </p>

            <div className="mt-6">
                <Link
                    to={catalogUrl}
                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                    Ir al catálogo
                </Link>
            </div>
        </div>
    );
}
