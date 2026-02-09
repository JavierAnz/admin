import type { APIRoute } from 'astro';
import { getAllInventory } from '../../../lib/inventoryService';
import { BRAND_CONFIG } from '../../../brand/brand';

export const GET: APIRoute = async ({ url, locals }) => {
    const queryRaw = url.searchParams.get('q') || '';
    const agencia = url.searchParams.get('agencia') || '';
    const soloLocal = url.searchParams.get('soloLocal') === 'true';

    // Debug log para verificar parámetros
    console.log('[SEARCH] Debug:', { query: queryRaw, agencia, soloLocal });

    // Rigor: Validación temprana
    if (queryRaw.trim().length < 2) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        /**
         * ESTRATEGIA DE PERMISOS:
         * Los permisos vienen de 'locals' (inyectados por tu Middleware/Auth).
         * Si no hay usuario logueado, pasamos un array vacío [].
         */
        const userPerms = locals.user?.permissions || [];

        // Invocamos al servicio unificado que ya maneja SQL, Intcomex y Permisos
        const resultados = await getAllInventory(
            queryRaw,
            agencia,
            soloLocal,
            userPerms
        );

        return new Response(JSON.stringify(resultados), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60' // Cache de 1 min para performance
            }
        });

    } catch (e) {
        console.error('Error crítico en endpoint de búsqueda:', e);

        // Uso de Copy Centralizado desde brand.ts
        return new Response(
            JSON.stringify({ error: BRAND_CONFIG.copy.search.error }),
            { status: 500 }
        );
    }
};