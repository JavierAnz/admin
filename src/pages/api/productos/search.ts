import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';
import { getIntcomexData } from '../../../lib/providers/intcomex';
import { getDummyData } from '../../../lib/providers/dummyjson';

export const GET: APIRoute = async ({ url }) => {
    const queryRaw = url.searchParams.get('q') || '';
    const agencia = url.searchParams.get('agencia') || '';
    const soloLocal = url.searchParams.get('soloLocal') === 'true';

    if (queryRaw.trim().length < 2) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        const [resLocal, resIntcomex, resDummy] = await Promise.all([
            buscarLocal(queryRaw, agencia, soloLocal).catch(err => {
                console.error("Error SQL Local:", err);
                return [];
            }),
            soloLocal ? Promise.resolve([]) : getIntcomexData(queryRaw).catch(() => []),
            soloLocal ? Promise.resolve([]) : getDummyData(queryRaw).catch(() => []),
        ]);

        const resultados = [...resLocal, ...resIntcomex, ...resDummy];

        return new Response(JSON.stringify(resultados), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60'
            }
        });
    } catch (e) {
        console.error('Error crítico en búsqueda:', e);
        return new Response(
            JSON.stringify({ error: 'Error al procesar la búsqueda multicanal' }),
            { status: 500 }
        );
    }
};

async function buscarLocal(queryRaw: string, agencia: string, soloLocal: boolean) {
    const pool = await getDbConnection();
    const request = pool.request();
    const palabras = queryRaw.trim().split(/\s+/).filter(p => p.length > 0);

    const condicionesBusqueda = palabras.map((palabra, index) => {
        const param = `p${index}`;
        request.input(param, sql.VarChar, `%${palabra}%`);
        return `(v.Nombre LIKE @${param} OR v.Codigo LIKE @${param} OR v.Marca LIKE @${param} OR v.Modelo LIKE @${param} or v.Barras LIKE @${param} )`;
    }).join(' AND ');

    let query: string;

    if (soloLocal && parseInt(agencia) > 0) {
        request.input('agencia', sql.Int, parseInt(agencia));
        query = `
            SELECT TOP 50 
                v.Codigo as id, 
                v.Nombre as nombre, 
                r.existencia, 
                v.Marca as marca, 
                v.Modelo as modelo,
                v.[Precio P] as precioP,
                v.[Precio A] as precioA,
                'PROPIO' as origen
            FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
            INNER JOIN rel_productos_agencias r WITH (NOLOCK) 
                ON v.Codigo = r.cod_prod 
                AND r.COD_AGEN = @agencia 
                AND r.existencia > 0
            WHERE ${condicionesBusqueda}
            ORDER BY v.Nombre ASC
        `;
    } else {
        query = `
           SELECT TOP 50 
                    v.Codigo as id, 
                    v.Nombre as nombre, 
                    (SELECT SUM(r2.existencia) 
                     FROM rel_productos_agencias r2
                     INNER JOIN agencias a ON r2.cod_agen = a.cod_agen
                     WHERE r2.cod_prod = v.Codigo 
                       AND (a.ES_SALA_VENTAS = 1 OR a.RECIBE_COMPRAS = 1)) as existencia, 
                    v.Marca as marca, 
                    v.Modelo as modelo,
                    v.[Precio P] as precioP, 
                    v.[Precio A] as precioA,
                    'PROPIO' as origen
                FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
                WHERE ${condicionesBusqueda}
                  AND EXISTS (
                      SELECT 1 FROM rel_productos_agencias r3
                      INNER JOIN agencias a2 ON r3.cod_agen = a2.cod_agen
                      WHERE r3.cod_prod = v.Codigo 
                        AND r3.existencia > 0
                        AND (a2.ES_SALA_VENTAS = 1 OR a2.RECIBE_COMPRAS = 1)
                  )
                ORDER BY v.Nombre ASC
        `;
    }

    const result = await request.query(query);
    return result.recordset;
}