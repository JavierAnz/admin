import { g as getDbConnection } from '../../../chunks/db_BFHI2weh.mjs';
import md5 from 'md5';
import sql from 'mssql';
export { r as renderers } from '../../../chunks/_@astro-renderers_BGseE2UE.mjs';

const POST = async ({ request, cookies, redirect }) => {
  try {
    const data = await request.formData();
    const nickInput = data.get("nick")?.toString().trim();
    const passInput = data.get("pass")?.toString();
    const agencia = data.get("id_agencia_vendedor")?.toString();
    if (!nickInput || !passInput || !agencia) return redirect("/login?error=campos-vacios");
    const pool = await getDbConnection();
    const hashedPass = md5(passInput);
    const result = await pool.request().input("nick", sql.VarChar, nickInput.toUpperCase()).input("pass", sql.VarChar, hashedPass).query(`
                SELECT 
                    wu.ID_USUARIO, 
                    wu.NICK, 
                    su.ID_PERFIL,
                    wu.ADMIN_PRECIOS
                FROM dbo.WEB_USUARIO wu
                INNER JOIN altekdb.sysusua su ON wu.ID_USUA = su.id_usua
                WHERE UPPER(LTRIM(RTRIM(wu.NICK))) = @nick 
                AND LTRIM(RTRIM(wu.PASS)) = @pass
                AND wu.estado = 1
            `);
    console.log("Login query result count:", result.recordset.length);
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      const permResult = await pool.request().input("idPerfil", sql.Int, user.ID_PERFIL).query(`
                    SELECT DISTINCT ID_OPCION
                    FROM dbo.SEG_PERMISO
                    WHERE ID_PERFIL = @idPerfil
                `);
      const permissions = permResult.recordset.map((r) => Number(r.ID_OPCION));
      const sessionData = {
        id: user.ID_USUARIO,
        nick: user.NICK,
        permissions,
        adminPrecios: user.ADMIN_PRECIOS === true || user.ADMIN_PRECIOS === 1
      };
      cookies.set("ofit_session", JSON.stringify(sessionData), {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 12,
        sameSite: "strict"
      });
      cookies.set("agencia_id", agencia, { path: "/", maxAge: 60 * 60 * 12 });
      console.log("Sesión guardada exitosamente");
      console.log(permissions.includes(1230));
      return redirect("/inventario");
    } else {
      return redirect("/login?error=invalid");
    }
  } catch (e) {
    console.error("Error en Login API:", e);
    return redirect(`/login?error=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`);
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
