import type { APIRoute } from "astro";
import { getDbConnection } from "../../lib/db";

export const GET: APIRoute = async () => {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query(`
      SELECT Cod_Agen, Nom_Agen
      FROM agencias
      WHERE Cod_Agen NOT IN (5,6,7,8,9,12,14,20,21)
      ORDER BY Nom_Agen
    `);

        return new Response(JSON.stringify(result.recordset), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("API agencias error:", err);
        return new Response(
            JSON.stringify({ error: "DB_ERROR" }),
            { status: 500 }
        );
    }
};
