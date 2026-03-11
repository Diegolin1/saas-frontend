import { useOutletContext } from 'react-router-dom';

interface CompanyInfo {
    name: string;
    logoUrl: string | null;
    whatsappPhone: string | null;
}

export default function TermsAndConditions() {
    const { companyInfo } = useOutletContext<{ companyInfo: CompanyInfo | null }>();
    const companyName = companyInfo?.name || 'la empresa';

    return (
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
                Términos y Condiciones
            </h1>

            <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aspectos Generales</h2>
                    <p>
                        Este documento establece los términos y condiciones de uso del portal B2B proporcionado por {companyName}.
                        Al acceder y utilizar este catálogo digital para la realización de pedidos de mayoreo, el cliente
                        acepta estar sujeto a las presentes políticas comerciales y operativas.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Elegibilidad y Cuentas</h2>
                    <p>
                        Este es un portal exclusivo para operaciones B2B (Business to Business). El acceso a la
                        plataforma y la visibilidad de los precios preferenciales están condicionados a la aprobación
                        y asignación de una lista de precios por parte del equipo de ventas de {companyName}.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Pedidos y Precios</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Los precios mostrados están sujetos a cambios sin previo aviso derivados de ajustes del mercado.</li>
                        <li>La colocación de un pedido en la plataforma no garantiza el apartado del inventario hasta recibir
                            la confirmación formal y el depósito correspondiente (cuando aplique).</li>
                        <li>Las cantidades mínimas de orden (MOQ), así como los márgenes de descuento, se regirán conforme a la configuración de la lista de precio asignada a su cuenta.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Políticas de Envío</h2>
                    <p>
                        Los envíos de mercancía al mayoreo son coordinados mediante nuestro departamento de logística.
                        Los costos de envío, así como los tiempos de entrega, varían según la ubicación geográfica del
                        comprador y el volumen del pedido. {companyName} proporcionará la guía de rastreo y no se hace
                        responsable por retrasos extraordinarios originados por las empresas de paquetería una vez
                        recolectado el producto.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Devoluciones y Garantías</h2>
                    <p>
                        Sólo se aceptarán reclamaciones por defectos de fabricación evidentes o errores en el surtido (ej. color o talla incorrecta).
                        El cliente cuenta con un plazo máximo de 5 días hábiles a partir de la recepción de la mercancía para
                        notificar la incidencia a su vendedor asignado, acompañando la notificación de evidencia fotográfica.
                        No aplicarán cambios sobre mercancía que haya sido utilizada o modificada.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Confidencialidad y Uso del Portal</h2>
                    <p>
                        La información de catálogos, estructuras de precios y materiales visuales proporcionados en este
                        portal son propiedad exclusiva de {companyName}. Queda estrictamente prohibida la extracción,
                        distribución no autorizada a terceros o el uso comercial indebido de los datos presentados.
                    </p>
                </section>

                <p className="text-sm text-gray-400 mt-12 pt-8 border-t border-gray-100">
                    Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        </div>
    );
}
