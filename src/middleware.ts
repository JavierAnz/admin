import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;

    const sesion = cookies.get("ofit_session");
    const esPrivado = url.pathname.startsWith("/inventario") || url.pathname.startsWith("/api/productos");

    if (esPrivado && !sesion) {
        return redirect("/login?error=no-auth");
    }

    if (url.pathname === "/login" && sesion) {
        return redirect("/inventario");
    }

    return next();
});