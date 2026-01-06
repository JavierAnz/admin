import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
    // Eliminamos las cookies de sesión y agencia
    cookies.delete("ofit_session", { path: "/" });
    cookies.delete("agencia_id", { path: "/" });

    // Redirigimos al login con un mensaje de éxito
    return redirect('/login?success=Sesion-Cerrada');
};