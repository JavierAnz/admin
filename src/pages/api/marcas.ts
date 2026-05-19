import type { APIRoute } from 'astro';
import { listMarcas } from '../../server/queries';

export const GET: APIRoute = async () => {
    try {
        const recordset = await listMarcas();
        return new Response(JSON.stringify(recordset), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching marcas:', error);
        return new Response(JSON.stringify({ error: 'Error al cargar marcas' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
