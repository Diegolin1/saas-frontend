/**
 * Exporta un arreglo de objetos a un archivo CSV y desencadena su descarga.
 * @param data Arreglo de datos
 * @param filename Nombre del archivo .csv
 */
export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;

    // 1. Extraer cabeceras basado en las llaves del primer objeto
    const headers = Object.keys(data[0]);

    // 2. Construir matriz de CSV
    const csvRows = [];
    csvRows.push(headers.join(','));

    // 3. Iterar y escapar cada fila
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // 4. Crear Blob y forzar descarga local en navegador
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    // Configurar enlace virtual
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);

    document.body.appendChild(link);
    link.click();

    // Limpieza
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
