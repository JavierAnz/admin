// src/pages/api/marcas.ts
import type { APIRoute } from 'astro';
import { getDbConnection } from '../../lib/db';

export const GET: APIRoute = async () => {
    try {
        const pool = await getDbConnection();

        const result = await pool.request().query(`
            SELECT m.ID_MARCA as id, m.NOMBRE as nombre, COUNT(p.Nombre_Prod) AS prod_x_marca
            FROM altekdb.Cat_marca as m
            INNER JOIN altekdb.Productos as p ON m.id_marca = p.ID_MARCA
            WHERE p.existencia > 0
            GROUP BY m.ID_MARCA, m.NOMBRE
            ORDER BY m.NOMBRE ASC
        `);

        return new Response(JSON.stringify(result.recordset), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching marcas:', error);
        return new Response(JSON.stringify({ error: 'Error al cargar marcas' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
