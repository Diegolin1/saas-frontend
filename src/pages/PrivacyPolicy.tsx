import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    const companyName = import.meta.env.VITE_COMPANY_NAME || 'ShowRoom B2B';
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'privacidad@showroomapp.mx';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="text-xl font-display font-bold text-brand-900">
                        Show<span className="text-gold-500">Room</span>
                    </Link>
                    <Link to="/" className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">
                        ← Volver al inicio
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 prose prose-slate max-w-none">
                    <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
                        Aviso de Privacidad
                    </h1>
                    <p className="text-sm text-slate-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">1. Responsable del tratamiento de sus datos personales</h2>
                        <p className="text-slate-600 leading-relaxed">
                            <strong>{companyName}</strong> (en adelante, "la Empresa"), con domicilio en la República Mexicana, es responsable del tratamiento de sus datos personales conforme a lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
                        </p>
                        <p className="text-slate-600 leading-relaxed mt-2">
                            Para cualquier asunto relacionado con sus datos personales, puede contactarnos en: <a href={`mailto:${contactEmail}`} className="text-brand-500 hover:underline">{contactEmail}</a>
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">2. Datos personales que recabamos</h2>
                        <p className="text-slate-600 leading-relaxed mb-2">Recabamos los siguientes datos personales de manera directa a través de nuestra plataforma:</p>
                        <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4">
                            <li>Nombre completo</li>
                            <li>Correo electrónico</li>
                            <li>Nombre de la empresa o razón social</li>
                            <li>Contraseña (almacenada de forma cifrada; nunca en texto plano)</li>
                            <li>Datos de actividad dentro de la plataforma (pedidos, catálogo consultado)</li>
                        </ul>
                        <p className="text-slate-600 leading-relaxed mt-3">
                            No recabamos datos personales sensibles según la definición del artículo 3, fracción VI de la LFPDPPP.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">3. Finalidades del tratamiento</h2>
                        <p className="text-slate-600 leading-relaxed mb-2"><strong>Finalidades primarias</strong> (necesarias para la prestación del servicio):</p>
                        <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4">
                            <li>Crear y administrar su cuenta de usuario.</li>
                            <li>Gestionar pedidos, catálogos y listas de precios.</li>
                            <li>Enviar notificaciones transaccionales (confirmaciones, alertas de seguridad).</li>
                            <li>Proveer soporte técnico y atención al usuario.</li>
                        </ul>
                        <p className="text-slate-600 leading-relaxed mt-3 mb-2"><strong>Finalidades secundarias</strong> (no necesarias para el servicio; puede negarlas):</p>
                        <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4">
                            <li>Envío de comunicaciones de marketing, novedades y actualizaciones de la plataforma.</li>
                            <li>Análisis estadístico del uso de la plataforma para mejora del servicio.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">4. Transferencia de datos personales</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Sus datos personales pueden ser transferidos a los siguientes proveedores de servicios con quienes tenemos relación jurídica, exclusivamente para las finalidades descritas en este aviso:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4 mt-2">
                            <li><strong>Supabase Inc.</strong> — almacenamiento de base de datos e imágenes (Estados Unidos).</li>
                            <li><strong>Resend Inc.</strong> — envío de correos electrónicos transaccionales.</li>
                            <li><strong>Render Inc.</strong> — hospedaje del servidor de aplicaciones.</li>
                            <li><strong>Cloudflare Inc.</strong> — hospedaje del sitio web y red de distribución de contenido.</li>
                        </ul>
                        <p className="text-slate-600 leading-relaxed mt-3">
                            Dichas transferencias son necesarias para la prestación del servicio contratado (artículo 37, fracción I de la LFPDPPP) y se realizan bajo compromisos contractuales de confidencialidad.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">5. Derechos ARCO</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse</strong> al tratamiento de sus datos personales (derechos ARCO). Para ejercer estos derechos, envíe una solicitud a <a href={`mailto:${contactEmail}`} className="text-brand-500 hover:underline">{contactEmail}</a> con la siguiente información:
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4 mt-2">
                            <li>Nombre completo y correo electrónico registrado.</li>
                            <li>Descripción clara del derecho que desea ejercer.</li>
                            <li>Copia de identificación oficial.</li>
                        </ul>
                        <p className="text-slate-600 leading-relaxed mt-3">
                            Responderemos en un plazo máximo de 20 días hábiles a partir de la recepción de su solicitud, conforme al artículo 32 de la LFPDPPP.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">6. Uso de cookies y tecnologías similares</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Utilizamos <strong>localStorage</strong> del navegador para mantener su sesión activa. No utilizamos cookies de terceros con fines publicitarios. Los datos de sesión se eliminan al cerrar sesión o al vencer el periodo de inactividad.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">7. Cambios al aviso de privacidad</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Nos reservamos el derecho de modificar este aviso en cualquier momento. Los cambios serán publicados en esta página. Le recomendamos revisarlo periódicamente. El uso continuado de la plataforma después de la publicación de cambios constituye su aceptación de los mismos.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-3">8. Autoridad competente</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Si considera que sus derechos han sido vulnerados, puede presentar una queja ante el <strong>Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)</strong> en <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">www.inai.org.mx</a>.
                        </p>
                    </section>

                    <div className="border-t border-slate-100 pt-6 mt-8">
                        <p className="text-xs text-slate-400 text-center">
                            © {new Date().getFullYear()} {companyName}. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
