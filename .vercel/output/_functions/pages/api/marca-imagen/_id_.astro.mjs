import sql from 'mssql';
import { g as getDbConnection } from '../../../chunks/db_BFHI2weh.mjs';
import sharp from 'sharp';
export { r as renderers } from '../../../chunks/_@astro-renderers_BGseE2UE.mjs';

const sharpConfig = {
  failOnError: false,
  sequentialRead: true,
  limitInputPixels: 268402689
};
const SIZES = {
  thumb: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 }
};
const resizeOptions = {
  fit: "inside",
  withoutEnlargement: true,
  kernel: "lanczos3"
};
const GET = async ({ params, request }) => {
  const id = params.id;
  const url = new URL(request.url);
  if (!id || !/^\d{1,10}$/.test(id)) {
    return new Response(null, { status: 400 });
  }
  const sizeParam = url.searchParams.get("size") || "medium";
  const size = SIZES[sizeParam] || SIZES.medium;
  try {
    const pool = await getDbConnection();
    const result = await pool.request().input("id", sql.Int, parseInt(id)).query(`
        SELECT IMAGEN, DATALENGTH(IMAGEN) as PesoOriginal
        FROM CAT_MARCA WITH (NOLOCK)
        WHERE ID_MARCA = @id AND IMAGEN IS NOT NULL AND DATALENGTH(IMAGEN) > 100
      `);
    const record = result.recordset[0];
    if (!record?.IMAGEN) {
      const placeholder = await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 4,
          background: { r: 248, g: 250, b: 252, alpha: 1 }
        }
      }).composite([{
        input: Buffer.from(
          `<svg width="${size.width}" height="${size.height}">
              <rect width="${size.width}" height="${size.height}" fill="#f1f5f9"/>
              <text x="50%" y="50%" text-anchor="middle" font-size="14" fill="#94a3b8">Sin imagen</text>
            </svg>`
        ),
        top: 0,
        left: 0
      }]).webp({ quality: 80 }).toBuffer();
      return new Response(new Uint8Array(placeholder), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          "X-Image-Status": "placeholder"
        }
      });
    }
    let pipeline = sharp(record.IMAGEN, sharpConfig).rotate().flatten({ background: "#ffffff" });
    const metadata = await pipeline.metadata();
    if (metadata.width && metadata.height) {
      if (metadata.width > size.width || metadata.height > size.height) {
        pipeline = pipeline.resize({ width: size.width, height: size.height, ...resizeOptions });
      }
    } else {
      pipeline = pipeline.resize({ width: size.width, height: size.height, ...resizeOptions });
    }
    const optimizedBuffer = await pipeline.webp({ quality: 82, effort: 5 }).toBuffer();
    return new Response(new Uint8Array(optimizedBuffer), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": optimizedBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "X-Image-Status": "optimized"
      }
    });
  } catch (error) {
    console.error(`[MARCA IMG ERROR] ${id}:`, error);
    return new Response(null, { status: 500 });
  }
};
const PUT = async ({ params, request }) => {
  const id = params.id;
  if (!id || !/^\d{1,10}$/.test(id)) {
    return new Response(JSON.stringify({ error: "ID inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("imagen");
    if (!file || !file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "Imagen no válida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const arrayBuffer = await file.arrayBuffer();
    const processedBuffer = await sharp(Buffer.from(arrayBuffer), sharpConfig).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 85, progressive: true }).toBuffer();
    const pool = await getDbConnection();
    await pool.request().input("imagen", sql.VarBinary(sql.MAX), processedBuffer).input("id", sql.Int, parseInt(id)).query("UPDATE CAT_MARCA SET IMAGEN = @imagen WHERE ID_MARCA = @id");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(`[MARCA IMG UPDATE ERROR] ${id}:`, error);
    return new Response(JSON.stringify({ error: "Error al actualizar imagen" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET,
    PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
