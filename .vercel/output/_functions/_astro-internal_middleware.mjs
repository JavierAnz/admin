import { d as defineMiddleware, s as sequence } from './chunks/index_DiIKJbqf.mjs';
import './chunks/astro-designed-error-pages_7JyYr5h-.mjs';
import './chunks/astro/server_jlQkI_Ol.mjs';

const onRequest$1 = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const sesionRaw = cookies.get("ofit_session")?.value;
  url.pathname === "/login" || url.pathname.startsWith("/api/agencias") || url.pathname.startsWith("/api/auth");
  const esPrivado = url.pathname.startsWith("/inventario") || url.pathname.startsWith("/api/productos");
  const esAdmin = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");
  if (sesionRaw) {
    try {
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
      cookies.delete("ofit_session", { path: "/" });
    }
  }
  if ((esPrivado || esAdmin) && !locals.user) {
    return redirect("/login?error=no-auth");
  }
  if (esAdmin && !locals.user?.adminPrecios) {
    return redirect("/inventario?error=no-admin");
  }
  if (url.pathname === "/login" && locals.user) {
    return redirect("/inventario");
  }
  return next();
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
