import { defineMiddleware } from 'astro:middleware';
import { PERMS } from './brand/brand';

export const config = { runtime: 'edge' };

const PUBLIC = ['/login', '/api/auth', '/api/agencias'];
const SESSION = ['/inventario', '/api/productos', '/api/existencias', '/api/producto-imagen'];
const ADMIN_PREFIXES = ['/api/admin', '/api/marcas'];
const REPORTS = ['/admin/reportes'];

function matchesRoute(pathname: string, routes: string[]) {
    return routes.some((route) => pathname.startsWith(route));
}

function isAdminPage(pathname: string) {
    return pathname.startsWith('/admin') && !pathname.startsWith('/admin/reportes');
}

function hasPermission(permissions: number[] | undefined, perm: number) {
    return permissions?.includes(perm) ?? false;
}

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect, locals, request } = context;
    const pathname = url.pathname;
    const isApiRoute = pathname.startsWith('/api/');

    const sendUnauthorized = () =>
        isApiRoute
            ? new Response(JSON.stringify({ error: 'no-auth' }), {
                  status: 401,
                  headers: { 'Content-Type': 'application/json' },
              })
            : redirect('/login?error=no-auth');

    const sendForbidden = () =>
        isApiRoute
            ? new Response(JSON.stringify({ error: 'forbidden' }), {
                  status: 403,
                  headers: { 'Content-Type': 'application/json' },
              })
            : redirect('/inventario?error=no-admin');

    // 1. Hidratar locals.user desde cookie de sesión
    const sesionRaw = cookies.get('ofit_session')?.value;
    if (sesionRaw) {
        try {
            const userData = JSON.parse(sesionRaw);
            locals.user = {
                id: userData.id,
                nick: userData.nick,
                permissions: userData.permissions || [],
                agenciaId: cookies.get('agencia_id')?.value,
                agenciaNombre: cookies.get('agencia_nombre')?.value,
            };
        } catch (e) {
            console.error('Error al parsear sesión:', e);
            cookies.delete('ofit_session', { path: '/' });
        }
    }

    const isMarcaImagenPut = pathname.startsWith('/api/marca-imagen') && request.method === 'PUT';
    const isMarcaImagenGet = pathname.startsWith('/api/marca-imagen') && request.method === 'GET';

    // 2. Rutas públicas
    if (matchesRoute(pathname, PUBLIC)) {
        if (pathname === '/login' && locals.user) {
            return redirect('/inventario');
        }
        return next();
    }

    // 3. Reportes (antes que admin — /admin/reportes comparte prefijo /admin)
    if (matchesRoute(pathname, REPORTS)) {
        if (!locals.user) return sendUnauthorized();
        if (!hasPermission(locals.user.permissions, PERMS.VIEW_REPORTS)) return sendForbidden();
        return next();
    }

    // 4. Rutas admin
    const isAdminRoute =
        isAdminPage(pathname) || matchesRoute(pathname, ADMIN_PREFIXES) || isMarcaImagenPut;

    if (isAdminRoute) {
        if (!locals.user) return sendUnauthorized();
        if (!hasPermission(locals.user.permissions, PERMS.ADMIN_PANEL)) return sendForbidden();
        return next();
    }

    // 5. Rutas con sesión básica
    if (matchesRoute(pathname, SESSION) || isMarcaImagenGet) {
        if (!locals.user) return sendUnauthorized();
        return next();
    }

    return next();
});
