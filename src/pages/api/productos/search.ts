import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
    const queryRaw = url.searchParams.get('q') || '';
    const agencia = url.searchParams.get('agencia') || '';
    const soloLocal = url.searchParams.get('soloLocal') === 'true';

    const palabras = queryRaw.trim().split(/\s+/).filter(p => p.length > 0);

    // Si no hay búsqueda, retornar vacío
    if (palabras.length === 0) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        const pool = await getDbConnection();
        const request = pool.request();
        const usarFiltroSucursal = soloLocal && agencia && parseInt(agencia) > 0;

        // Construir condiciones de búsqueda dinámicamente
        const condicionesBusqueda = palabras.map((palabra, index) => {
            const param = `p${index}`;
            request.input(param, sql.VarChar, `%${palabra}%`);
            return `(v.Nombre LIKE @${param} OR v.Codigo LIKE @${param} OR v.Marca LIKE @${param} OR v.Modelo LIKE @${param} OR v.Barras = @${param})`;
        }).join(' AND ');

        let query: string;

        if (usarFiltroSucursal) {
            request.input('agencia', sql.Int, parseInt(agencia));

            // Versión optimizada con JOIN solo cuando es necesario
            query = `
                SELECT TOP 50 
                    v.Codigo as id, 
                    v.Nombre as nombre, 
                    r.existencia, 
                    v.Marca as marca, 
                    v.Modelo as modelo,
                    v.[Precio P] as preciop, 
                    v.[Precio A] as precioa
                FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
                INNER JOIN rel_productos_agencias r WITH (NOLOCK) 
                    ON v.Codigo = r.cod_prod 
                    AND r.COD_AGEN = @agencia 
                    AND r.existencia > 0
                WHERE ${condicionesBusqueda}
                ORDER BY v.Nombre ASC
            `;
        } else {
            // Sin JOIN cuando no se necesita filtro de agencia
            query = `
                SELECT TOP 50 
                    v.Codigo as id, 
                    v.Nombre as nombre, 
                    v.Total as existencia, 
                    v.Marca as marca, 
                    v.Modelo as modelo,
                    v.[Precio P] as preciop, 
                    v.[Precio A] as precioa
                FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
                WHERE ${condicionesBusqueda}
                ORDER BY v.Nombre ASC
            `;
        }

        const result = await request.query(query);

        return new Response(
            JSON.stringify(result.recordset),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60'
                }
            }
        );
    } catch (e) {
        console.error('Error en búsqueda de productos:', e);
        return new Response(
            JSON.stringify({ error: 'Error al buscar productos' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};