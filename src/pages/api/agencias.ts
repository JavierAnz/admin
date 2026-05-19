import type { APIRoute } from 'astro';
import { listAgencias } from '../../server/queries';

export const GET: APIRoute = async () => {
    try {
        const recordset = await listAgencias();
        return new Response(JSON.stringify(recordset), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('API agencias error:', err);
        return new Response(JSON.stringify({ error: 'DB_ERROR' }), { status: 500 });
    }
};
