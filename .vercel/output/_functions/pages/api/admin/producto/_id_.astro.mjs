import sql from 'mssql';
import { g as getDbConnection } from '../../../../chunks/db_BFHI2weh.mjs';
import sharp from 'sharp';
export { r as renderers } from '../../../../chunks/_@astro-renderers_BGseE2UE.mjs';

const sharpConfig = {
  failOnError: false,
  sequentialRead: true,
  limitInputPixels: 268402689
};
const PUT = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const pool = await getDbConnection();
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { nombre, descripcion, modelo } = body;
      const req = pool.request().input("id", sql.Int, parseInt(id));
      const updates = [];
      if (nombre !== void 0) {
        req.input("nombre", sql.VarChar(500), nombre);
        updates.push("Nombre_Prod = @nombre");
      }
      if (descripcion !== void 0) {
        req.input("descripcion", sql.VarChar(sql.MAX), descripcion);
        updates.push("Descr_Prod = @descripcion");
      }
      if (modelo !== void 0) {
        req.input("modelo", sql.VarChar(100), modelo);
        updates.push("Mod_Prod = @modelo");
      }
      if (updates.length > 0) {
        await req.query(`UPDATE altekdb.Productos SET ${updates.join(", ")} WHERE Cod_Prod = @id`);
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("imagen");
      if (!file || !file.type.startsWith("image/")) {
        return new Response(JSON.stringify({ error: "Imagen no válida" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const arrayBuffer = await file.arrayBuffer();
      const processedBuffer = await sharp(Buffer.from(arrayBuffer), sharpConfig).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 85, progressive: true }).toBuffer();
      await pool.request().input("imagen", sql.VarBinary(sql.MAX), processedBuffer).input("id", sql.Int, parseInt(id)).query("UPDATE altekdb.Productos SET Imagen1 = @imagen WHERE Cod_Prod = @id");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "Content-Type no soportado" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(`[PRODUCTO UPDATE ERROR] ${id}:`, error);
    return new Response(JSON.stringify({ error: "Error al actualizar producto" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
