import { g as getDbConnection } from '../../chunks/db_BFHI2weh.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_BGseE2UE.mjs';

const GET = async () => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
           SELECT Cod_Agen, Nom_Agen 
FROM agencias 
WHERE ES_SALA_VENTAS = 1 OR RECIBE_COMPRAS = 1 
ORDER BY Nom_Agen   
        `);
    return new Response(JSON.stringify(result.recordset), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("API agencias error:", err);
    return new Response(
      JSON.stringify({ error: "DB_ERROR" }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
