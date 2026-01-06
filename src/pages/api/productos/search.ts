import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
    const queryRaw = url.searchParams.get('q') || '';
    const agencia = url.searchParams.get('agencia') || '';
    const soloLocal = url.searchParams.get('soloLocal') === 'true';

    // Dividimos la búsqueda en palabras para que no importe el orden
    const palabras = queryRaw.trim().split(/\s+/).filter(p => p.length > 0);

    try {
        let pool = await getDbConnection();
        let request = pool.request();

        // Si es soloLocal y tenemos agencia, filtramos por la sucursal.
        // EVITAR JOIN si no hay agencia para prevenir duplicados masivos.
        const usarFiltroSucursal = soloLocal && agencia && parseInt(agencia) > 0;

        let baseQuery = `
            SELECT DISTINCT TOP 50 
                v.Codigo as id, 
                v.Nombre as nombre, 
                ${usarFiltroSucursal ? 'r.existencia' : 'v.Total'} as existencia, 
                v.Marca as marca, 
                v.Modelo as modelo,
                v.[Precio P] as preciop, 
                v.[Precio A] as precioa
            FROM dbo.VW_PRODUCTOS_LISTADO_WEB v
            ${usarFiltroSucursal ? 'INNER JOIN rel_productos_agencias r ON v.Codigo = r.cod_prod' : ''}
            WHERE 1=1
        `;

        palabras.forEach((palabra, index) => {
            const param = `p${index}`;
            request.input(param, sql.VarChar, `%${palabra}%`);
            // NOTA IMPORTANTE: Los paréntesis adicionales son CRÍTICOS para que el AND (del filtro de agencia) aplique a todo.
            // Ahora: AND ( (...) OR ... ) -> Todo el bloque debe cumplir, y luego el AND de agencia también.
            baseQuery += ` AND ((v.Nombre LIKE @${param} OR v.Codigo LIKE @${param} OR v.Marca LIKE @${param} or v.modelo LIKE @${param}) OR v.Barras = @${param}) `;
        });

        if (usarFiltroSucursal) {
            baseQuery += ` AND r.COD_AGEN = @agencia AND r.existencia > 0`;
            request.input('agencia', sql.Int, parseInt(agencia));
        }

        const result = await request.query(baseQuery + ` ORDER BY v.Nombre ASC`);
        return new Response(JSON.stringify(result.recordset), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Error" }), { status: 500 });
    }
};