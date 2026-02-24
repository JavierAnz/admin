import sql from 'mssql';
import { g as getDbConnection } from '../../../chunks/db_BFHI2weh.mjs';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import nodePath from 'node:path';
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
const formatOptions = {
  avif: {
    quality: 65,
    effort: 5,
    chromaSubsampling: "4:2:0"
  },
  webp: {
    quality: 82,
    effort: 5,
    smartSubsample: true
  },
  jpeg: {
    quality: 85,
    progressive: true,
    mozjpeg: true
  }
};
async function getPlaceholder(size) {
  const placeholderPath = nodePath.resolve("./public/placeholder-image.png");
  try {
    const fileBuffer = await fs.readFile(placeholderPath);
    return await sharp(fileBuffer, sharpConfig).resize(size.width, size.height, resizeOptions).webp({ quality: 80, effort: 4 }).toBuffer();
  } catch {
    return await sharp({
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
            <text x="50%" y="50%" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="sans-serif">Sin imagen</text>
          </svg>`
      ),
      top: 0,
      left: 0
    }]).webp({ quality: 80, effort: 4 }).toBuffer();
  }
}
const GET = async ({ params, request }) => {
  const id = params.id;
  const url = new URL(request.url);
  if (!id || !/^\d{1,10}$/.test(id)) {
    return new Response(null, { status: 400 });
  }
  const sizeParam = url.searchParams.get("size") || "medium";
  const size = SIZES[sizeParam] || SIZES.medium;
  const acceptHeader = request.headers.get("accept") || "";
  const supportsAvif = acceptHeader.includes("image/avif");
  const supportsWebp = acceptHeader.includes("image/webp");
  const format = supportsAvif ? "avif" : supportsWebp ? "webp" : "jpeg";
  const customQuality = url.searchParams.get("q");
  const quality = customQuality ? Math.min(100, Math.max(1, parseInt(customQuality))) : formatOptions[format].quality;
  try {
    const pool = await getDbConnection();
    const result = await pool.request().input("id", sql.Int, parseInt(id)).query(`
        SELECT 
          Imagen1, 
          DATALENGTH(Imagen1) as PesoOriginal
        FROM altekdb.Productos WITH (NOLOCK)
        WHERE Cod_Prod = @id 
          AND Imagen1 IS NOT NULL 
          AND DATALENGTH(Imagen1) > 100
      `);
    const record = result.recordset[0];
    if (!record?.Imagen1) {
      const placeholderBuffer = await getPlaceholder(size);
      const placeholderData = new Uint8Array(placeholderBuffer);
      return new Response(placeholderData, {
        headers: {
          "Content-Type": "image/webp",
          "Content-Length": placeholderBuffer.length.toString(),
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          // Cache 1 día (CDN + browser)
          "X-Image-Status": "placeholder"
        }
      });
    }
    const etag = `"${id}-${record.PesoOriginal}-${sizeParam}-${format}-q${quality}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          "ETag": etag,
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable"
        }
      });
    }
    let pipeline = sharp(record.Imagen1, sharpConfig);
    const metadata = await pipeline.metadata();
    pipeline = pipeline.rotate().flatten({ background: "#ffffff" });
    if (metadata.width && metadata.height) {
      if (metadata.width > size.width || metadata.height > size.height) {
        pipeline = pipeline.resize({
          width: size.width,
          height: size.height,
          ...resizeOptions
        });
      }
    } else {
      pipeline = pipeline.resize({
        width: size.width,
        height: size.height,
        ...resizeOptions
      });
    }
    let optimizedBuffer;
    let contentType;
    switch (format) {
      case "avif":
        optimizedBuffer = await pipeline.avif({ ...formatOptions.avif, quality }).toBuffer();
        contentType = "image/avif";
        break;
      case "webp":
        optimizedBuffer = await pipeline.webp({ ...formatOptions.webp, quality }).toBuffer();
        contentType = "image/webp";
        break;
      default:
        optimizedBuffer = await pipeline.jpeg({ ...formatOptions.jpeg, quality }).toBuffer();
        contentType = "image/jpeg";
    }
    const compressionRatio = ((1 - optimizedBuffer.length / record.PesoOriginal) * 100).toFixed(1);
    console.log(`[IMG] ${id} ${sizeParam} → ${format} | ${record.PesoOriginal}b → ${optimizedBuffer.length}b (${compressionRatio}% saved)`);
    const imageData = new Uint8Array(optimizedBuffer);
    return new Response(imageData, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": optimizedBuffer.length.toString(),
        "ETag": etag,
        // Cache agresivo: 1 año inmutable
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        // CDN cache: 7 días con revalidación
        "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
        // Vary critical para multi-formato
        "Vary": "Accept",
        // Security headers
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "cross-origin",
        // Timing info
        "X-Image-Format": format,
        "X-Image-Size": sizeParam,
        "X-Compression-Ratio": compressionRatio + "%",
        "X-Image-Status": "optimized"
      }
    });
  } catch (error) {
    console.error(`[IMG ERROR] ${id}:`, error);
    try {
      const placeholderBuffer = await getPlaceholder(size);
      const placeholderData = new Uint8Array(placeholderBuffer);
      return new Response(placeholderData, {
        headers: {
          "Content-Type": "image/webp",
          "Content-Length": placeholderBuffer.length.toString(),
          "Cache-Control": "public, max-age=3600",
          "X-Image-Status": "error-fallback"
        }
      });
    } catch (fallbackError) {
      console.error(`[IMG FALLBACK ERROR] ${id}:`, fallbackError);
      return new Response(null, {
        status: 500,
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
