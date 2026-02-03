import type { APIRoute } from 'astro';
import { getDbConnection } from '../../../lib/db';
import md5 from 'md5';
import sql from 'mssql';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    try {
        const data = await request.formData();
        const nickInput = data.get('nick')?.toString().trim();
        const passInput = data.get('pass')?.toString();
        const agencia = data.get('id_agencia_vendedor')?.toString();

        if (!nickInput || !passInput || !agencia) return redirect('/login?error=campos-vacios');

        const pool = await getDbConnection();
        const hashedPass = md5(passInput);

        // 1. Validar Usuario y obtener su Perfil del sistema core (sysusua)
        const result = await pool.request()
            .input('nick', sql.VarChar, nickInput.toUpperCase())
            .input('pass', sql.VarChar, hashedPass)
            .query(`
                SELECT 
                    wu.ID_USUARIO, 
                    wu.NICK, 
                    su.ID_PERFIL
                FROM dbo.WEB_USUARIO wu
                INNER JOIN altekdb.sysusua su ON wu.ID_USUA = su.id_usua
                WHERE UPPER(LTRIM(RTRIM(wu.NICK))) = @nick 
                AND LTRIM(RTRIM(wu.PASS)) = @pass
                AND wu.estado = 1
            `);

        console.log("Login query result count:", result.recordset.length);
        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            // 2. Obtener los permisos de la tabla SEG_PERMISO usando el ID_PERFIL obtenido
            const permResult = await pool.request()
                .input('idPerfil', sql.Int, user.ID_PERFIL)
                .query(`
                    SELECT DISTINCT ID_OPCION
                    FROM dbo.SEG_PERMISO
                    WHERE ID_PERFIL = @idPerfil
                `);

            const permissions = permResult.recordset.map(r => Number(r.ID_OPCION));

            // 3. Guardar sesión con permisos hidratados
            const sessionData = {
                id: user.ID_USUARIO,
                nick: user.NICK,
                permissions: permissions
            };

            cookies.set("ofit_session", JSON.stringify(sessionData), {
                path: "/",
                httpOnly: true,
                secure: import.meta.env.PROD,
                maxAge: 60 * 60 * 12,
                sameSite: "strict"
            });

            cookies.set("agencia_id", agencia, { path: "/", maxAge: 60 * 60 * 12 });
            console.log("Sesión guardada exitosamente");


            console.log(permissions.includes(1230));

            return redirect('/inventario');
        } else {
            return redirect('/login?error=invalid');
        }
    } catch (e) {
        console.error("Error en Login API:", e);
        return redirect(`/login?error=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`);
    }
};