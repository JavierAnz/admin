import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
    cookies.delete("ofit_session", { path: "/" });
    cookies.delete("agencia_id", { path: "/" });
    cookies.delete("agencia_nombre", { path: "/" });
    return redirect('/login?success=Sesion-Cerrada');
};