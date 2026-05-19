import type { APIRoute } from 'astro';
import { getExistenciasPorProducto } from '../../../server/queries';

export const GET: APIRoute = async ({ params }) => {
    const id = params.id;
    if (!id) {
        return new Response(JSON.stringify({ error: 'missing id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const data = await getExistenciasPorProducto(id);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error en API existencias:', error);
        return new Response(JSON.stringify({ error: 'internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
