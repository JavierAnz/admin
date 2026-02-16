// src/pages/api/admin/productos.ts
import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim() || '';

    if (!query) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const pool = await getDbConnection();
        const req = pool.request();

        // Split query into words for multi-term search
        const palabras = query.split(/\s+/).filter(p => p.length > 0);
        const conditions = palabras.map((p, i) => {
            req.input(`p${i}`, sql.VarChar, `%${p}%`);
            return `(Nombre_Prod LIKE @p${i} OR Cod_Prod LIKE @p${i} OR Mod_Prod LIKE @p${i})`;
        }).join(' AND ');

        const result = await req.query(`
            SELECT  
                Cod_Prod as id, 
                Nombre_Prod as nombre, 
                Descr_Prod as descripcion, 
                Mod_Prod as modelo
            FROM altekdb.Productos WITH (NOLOCK)
            WHERE ${conditions}
            ORDER BY Nombre_Prod ASC
        `);

        return new Response(JSON.stringify(result.recordset), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error searching admin productos:', error);
        return new Response(JSON.stringify({ error: 'Error al buscar productos' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
