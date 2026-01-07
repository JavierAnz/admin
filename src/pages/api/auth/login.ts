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

        const result = await pool.request()
            .input('nick', sql.VarChar, nickInput)
            .input('pass', sql.VarChar, hashedPass)
            .query(`
                SELECT ID_USUARIO, NICK
                FROM dbo.WEB_USUARIO 
                WHERE UPPER(LTRIM(RTRIM(NICK))) = @nick 
                AND LTRIM(RTRIM(PASS)) = @pass
            `);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            cookies.set("ofit_session", user.NICK, {
                path: "/",
                httpOnly: true,
                secure: import.meta.env.PROD,
                maxAge: 60 * 60 * 12,
                sameSite: "strict"
            });

            cookies.set("agencia_id", agencia, { path: "/", maxAge: 60 * 60 * 12 });

            return redirect('/inventario');
        } else {
            console.log(`Fallo: Nick [${nickInput}] Hash [${hashedPass}]`);
            return redirect('/login?error=invalid');
        }
    } catch (e) {
        console.error("Error en Login API:", e);
        return redirect('/login?error=db-fail');
    }
};