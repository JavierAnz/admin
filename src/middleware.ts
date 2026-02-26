import { defineMiddleware } from "astro:middleware";
import { PERMS } from "./brand/brand";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect, locals } = context;
    const sesionRaw = cookies.get("ofit_session")?.value;

    const esPublico =
        url.pathname === "/login" ||
        url.pathname.startsWith("/api/agencias") ||
        url.pathname.startsWith("/api/auth"); // Permitir login/logout

    const esPrivado =
        url.pathname.startsWith("/inventario") ||
        url.pathname.startsWith("/api/productos");

    const esReportes =
        url.pathname.startsWith("/admin/reportes");

    const esAdmin =
        (url.pathname.startsWith("/admin") && !esReportes) ||
        url.pathname.startsWith("/api/admin");

    // 1. Si hay sesión, hidratamos locals.user
    if (sesionRaw) {
        try {
            // Asumiendo que guardaste el objeto usuario como JSON en la cookie
            // Si usas un ID de sesión, aquí deberías buscar en tu DB o Cache
            const userData = JSON.parse(sesionRaw);

            locals.user = {
                id: userData.id,
                nick: userData.nick,
                permissions: userData.permissions || [],
                agenciaId: cookies.get("agencia_id")?.value,
                adminPrecios: userData.adminPrecios || false
            };
        } catch (e) {
            console.error("Error al parsear sesión:", e);
            // Si la cookie está corrupta, la borramos para que no estorbe
            cookies.delete("ofit_session", { path: "/" });
        }
    }

    // 2. Guardias de seguridad
    if ((esPrivado || esAdmin || esReportes) && !locals.user) {
        return redirect("/login?error=no-auth");
    }

    // 3. Verificar permiso admin (rutas admin generales)
    if (esAdmin && !locals.user?.adminPrecios) {
        return redirect("/inventario?error=no-admin");
    }

    // 4. Verificar permiso para ver reportes (permiso 704)
    if (esReportes && !locals.user?.permissions.includes(PERMS.VIEW_REPORTS)) {
        return redirect("/inventario?error=no-admin");
    }

    // 5. Evitar que un logueado vuelva al login
    if (url.pathname === "/login" && locals.user) {
        return redirect("/inventario");
    }

    return next();
});