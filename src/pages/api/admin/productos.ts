import type { APIRoute } from 'astro';
import { buscarAdminCatalogo } from '../../../server/queries';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim() || '';

    if (!query) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const recordset = await buscarAdminCatalogo(query);
        return new Response(JSON.stringify(recordset), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error searching admin productos:', error);
        return new Response(JSON.stringify({ error: 'Error al buscar productos' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
