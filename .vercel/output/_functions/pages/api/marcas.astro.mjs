import { g as getDbConnection } from '../../chunks/db_BFHI2weh.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_BGseE2UE.mjs';

const GET = async () => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
            SELECT m.ID_MARCA as id, m.NOMBRE as nombre, COUNT(p.Nombre_Prod) AS prod_x_marca
            FROM altekdb.Cat_marca as m
            INNER JOIN altekdb.Productos as p ON m.id_marca = p.ID_MARCA
            WHERE p.existencia > 0
            GROUP BY m.ID_MARCA, m.NOMBRE
            ORDER BY m.NOMBRE ASC
        `);
    return new Response(JSON.stringify(result.recordset), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching marcas:", error);
    return new Response(JSON.stringify({ error: "Error al cargar marcas" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
