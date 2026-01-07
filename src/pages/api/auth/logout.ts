import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
    cookies.delete("ofit_session", { path: "/" });
    cookies.delete("agencia_id", { path: "/" });
    return redirect('/login?success=Sesion-Cerrada');
};