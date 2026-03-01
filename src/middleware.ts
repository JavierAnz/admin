import { defineMiddleware } from "astro:middleware";
import { PERMS } from "./brand/brand";

// Corre en Vercel Edge Runtime: sin cold-starts, 1M invocaciones gratis/mes por separado
export const config = { runtime: 'edge' };

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect, locals } = context;
    const sesionRaw = cookies.get("ofit_session")?.value;

    const esPublico =
        url.pathname === "/login" ||
        url.pathname.startsWith("/api/agencias") ||
        url.pathname.startsWith("/api/auth");

    const esPrivado =
        url.pathname.startsWith("/inventario") ||
        url.pathname.startsWith("/api/productos");

    const esReportes =
        url.pathname.startsWith("/admin/reportes");

    const esAdmin =
        (url.pathname.startsWith("/admin") && !esReportes) ||
        url.pathname.startsWith("/api/admin");

    // 1. Hidratar locals.user desde la cookie de sesión
    if (sesionRaw) {
        try {
            const userData = JSON.parse(sesionRaw);
            locals.user = {
                id: userData.id,
                nick: userData.nick,
                permissions: userData.permissions || [],
                agenciaId: cookies.get("agencia_id")?.value,
            };
        } catch (e) {
            console.error("Error al parsear sesión:", e);
            cookies.delete("ofit_session", { path: "/" });
        }
    }

    // 2. Rutas protegidas requieren sesión
    if ((esPrivado || esAdmin || esReportes) && !locals.user) {
        return redirect("/login?error=no-auth");
    }

    // 3. Rutas /admin (panel de administración) requieren permiso ADMIN_PANEL
    if (esAdmin && !locals.user?.permissions.includes(PERMS.ADMIN_PANEL)) {
        return redirect("/inventario?error=no-admin");
    }

    // 4. Ruta /admin/reportes requiere permiso VIEW_REPORTS
    if (esReportes && !locals.user?.permissions.includes(PERMS.VIEW_REPORTS)) {
        return redirect("/inventario?error=no-admin");
    }

    // 5. Redirigir usuario ya autenticado fuera del login
    if (url.pathname === "/login" && locals.user) {
        return redirect("/inventario");
    }

    return next();
});