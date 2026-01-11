import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
    const sesion = cookies.get("ofit_session");

    const esPublico =
        url.pathname === "/login" ||
        url.pathname.startsWith("/api/agencias");

    const esPrivado =
        url.pathname.startsWith("/inventario") ||
        url.pathname.startsWith("/api/productos");

    if (esPrivado && !sesion) {
        return redirect("/login?error=no-auth");
    }

    if (esPublico) {
        return next();
    }

    return next();
});
