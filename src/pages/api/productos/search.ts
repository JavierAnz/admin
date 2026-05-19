import type { APIRoute } from 'astro';
import { getAllInventory } from '../../../server/inventory';
import { checkRateLimit } from '../../../server/auth';
import { BRAND_CONFIG } from '../../../brand/brand';

export const GET: APIRoute = async ({ url, locals, request }) => {
    const ip =
        request.headers.get('x-forwarded-for') ??
        request.headers.get('cf-connecting-ip') ??
        'anonymous';
    const { allowed, remaining, resetAt } = checkRateLimit(ip, 30, 60_000);

    if (!allowed) {
        return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento.' }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
                'X-RateLimit-Remaining': '0',
            },
        });
    }

    const queryRaw = url.searchParams.get('q') || '';
    const agencia = url.searchParams.get('agencia') || '';
    const soloLocal = url.searchParams.get('soloLocal') === 'true';

    if (queryRaw.trim().length < 2) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        const userPerms = locals.user?.permissions || [];
        const resultados = await getAllInventory(queryRaw, agencia, soloLocal, userPerms);

        return new Response(JSON.stringify(resultados), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': String(remaining),
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (e) {
        console.error('Error en endpoint de búsqueda:', e);
        return new Response(JSON.stringify({ error: BRAND_CONFIG.copy.search.error }), {
            status: 500,
        });
    }
};
