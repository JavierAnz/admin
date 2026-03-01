// src/pages/api/producto-imagen/[id].ts
import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// ── Vercel Blob (caché de imágenes procesadas) ───────────────────────────────
// Importación dinámica para no romper si BLOB_READ_WRITE_TOKEN no está
let blobModule: typeof import('@vercel/blob') | null = null;
async function getBlob() {
  if (!blobModule && import.meta.env.BLOB_READ_WRITE_TOKEN) {
    blobModule = await import('@vercel/blob');
  }
  return blobModule;
}

// ── Configuración de Sharp ───────────────────────────────────────────────────
const sharpConfig = {
  failOnError: false,
  sequentialRead: true,
  limitInputPixels: 268402689
};

// Tamaños responsivos predefinidos
const SIZES = {
  thumb: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 }
} as const;

const resizeOptions = {
  fit: 'inside' as const,
  withoutEnlargement: true,
  kernel: 'lanczos3' as const
};

// Opciones de formato optimizadas
const formatOptions = {
  avif: {
    quality: 65,
    effort: 5,
    chromaSubsampling: '4:2:0' as const
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

// ✨ Función para generar placeholder
async function getPlaceholder(size: { width: number; height: number }): Promise<Buffer> {
  const placeholderPath = path.resolve('./public/placeholder-image.png');
  try {
    const fileBuffer = await fs.readFile(placeholderPath);
    return await sharp(fileBuffer, sharpConfig)
      .resize(size.width, size.height, resizeOptions)
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  } catch {
    return await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: { r: 248, g: 250, b: 252, alpha: 1 }
      }
    })
      .composite([{
        input: Buffer.from(
          `<svg width="${size.width}" height="${size.height}">
            <rect width="${size.width}" height="${size.height}" fill="#f1f5f9"/>
            <text x="50%" y="50%" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="sans-serif">Sin imagen</text>
          </svg>`
        ),
        top: 0,
        left: 0
      }])
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  }
}

// Cabeceras de caché para respuestas de imagen
const IMG_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'CDN-Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
  'Vary': 'Accept',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

export const GET: APIRoute = async ({ params, request }) => {
  const id = params.id;
  const url = new URL(request.url);

  // 1. Validación de ID
  if (!id || !/^\d{1,10}$/.test(id)) {
    return new Response(null, { status: 400 });
  }

  // 2. Parámetro de tamaño
  const sizeParam = url.searchParams.get('size') || 'medium';
  const size = SIZES[sizeParam as keyof typeof SIZES] || SIZES.medium;

  // 3. Detección de formato (AVIF > WebP > JPEG fallback)
  const acceptHeader = request.headers.get('accept') || '';
  const supportsAvif = acceptHeader.includes('image/avif');
  const supportsWebp = acceptHeader.includes('image/webp');
  const format = supportsAvif ? 'avif' : supportsWebp ? 'webp' : 'jpeg';

  // 4. Calidad personalizable
  const customQuality = url.searchParams.get('q');
  const quality = customQuality
    ? Math.min(100, Math.max(1, parseInt(customQuality)))
    : formatOptions[format].quality;

  const contentTypeMap = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg' };
  const contentType = contentTypeMap[format];

  // ── Clave de Blob ────────────────────────────────────────────────────────
  const blobKey = `img-producto-${id}-${sizeParam}-${format}-q${quality}`;

  try {
    // ── 5. Intentar leer desde Blob cache ────────────────────────────────
    const blob = await getBlob();
    if (blob) {
      try {
        const { blobs } = await blob.list({ prefix: blobKey, limit: 1 });
        if (blobs.length > 0) {
          // Cache hit: devolver imagen desde Blob sin tocar DB ni Sharp
          const cached = await fetch(blobs[0].url);
          const data = await cached.arrayBuffer();
          console.log(`[IMG BLOB HIT] ${blobKey}`);
          return new Response(data, {
            headers: {
              ...IMG_CACHE_HEADERS,
              'Content-Type': contentType,
              'Content-Length': data.byteLength.toString(),
              'X-Image-Status': 'blob-cache',
              'X-Image-Format': format,
              'X-Image-Size': sizeParam,
            }
          });
        }
      } catch (blobErr) {
        console.warn(`[IMG BLOB READ ERR] ${blobKey}:`, blobErr);
      }
    }

    // ── 6. Cache miss → leer de DB ────────────────────────────────────────
    const pool = await getDbConnection();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          Imagen1, 
          DATALENGTH(Imagen1) as PesoOriginal
        FROM altekdb.Productos WITH (NOLOCK)
        WHERE Cod_Prod = @id 
          AND Imagen1 IS NOT NULL 
          AND DATALENGTH(Imagen1) > 100
      `);

    const record = result.recordset[0];

    // ✅ Sin imagen → placeholder
    if (!record?.Imagen1) {
      const placeholderBuffer = await getPlaceholder(size);
      return new Response(new Uint8Array(placeholderBuffer), {
        headers: {
          'Content-Type': 'image/webp',
          'Content-Length': placeholderBuffer.length.toString(),
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'X-Image-Status': 'placeholder'
        }
      });
    }

    // ETag basado en tamaño + parámetros
    const etag = `"${id}-${record.PesoOriginal}-${sizeParam}-${format}-q${quality}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: { 'ETag': etag, 'Cache-Control': 'public, max-age=31536000, immutable' }
      });
    }

    // ── 7. Procesar con Sharp ─────────────────────────────────────────────
    let pipeline = sharp(record.Imagen1, sharpConfig);
    const metadata = await pipeline.metadata();
    pipeline = pipeline.rotate().flatten({ background: '#ffffff' });

    if (metadata.width && metadata.height) {
      if (metadata.width > size.width || metadata.height > size.height) {
        pipeline = pipeline.resize({ width: size.width, height: size.height, ...resizeOptions });
      }
    } else {
      pipeline = pipeline.resize({ width: size.width, height: size.height, ...resizeOptions });
    }

    let optimizedBuffer: Buffer;
    switch (format) {
      case 'avif':
        optimizedBuffer = await pipeline.avif({ ...formatOptions.avif, quality }).toBuffer();
        break;
      case 'webp':
        optimizedBuffer = await pipeline.webp({ ...formatOptions.webp, quality }).toBuffer();
        break;
      default:
        optimizedBuffer = await pipeline.jpeg({ ...formatOptions.jpeg, quality }).toBuffer();
    }

    const compressionRatio = ((1 - optimizedBuffer.length / record.PesoOriginal) * 100).toFixed(1);
    console.log(`[IMG] ${id} ${sizeParam} → ${format} | ${record.PesoOriginal}b → ${optimizedBuffer.length}b (${compressionRatio}% saved)`);

    // ── 8. Guardar en Blob para próximas requests (fire-and-forget) ───────
    if (blob) {
      blob.put(blobKey, optimizedBuffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      }).catch(e => console.warn(`[IMG BLOB WRITE ERR] ${blobKey}:`, e));
    }

    return new Response(new Uint8Array(optimizedBuffer), {
      headers: {
        ...IMG_CACHE_HEADERS,
        'Content-Type': contentType,
        'Content-Length': optimizedBuffer.length.toString(),
        'ETag': etag,
        'X-Image-Format': format,
        'X-Image-Size': sizeParam,
        'X-Compression-Ratio': compressionRatio + '%',
        'X-Image-Status': 'optimized',
      }
    });

  } catch (error) {
    console.error(`[IMG ERROR] ${id}:`, error);
    try {
      const placeholderBuffer = await getPlaceholder(size);
      return new Response(new Uint8Array(placeholderBuffer), {
        headers: {
          'Content-Type': 'image/webp',
          'Content-Length': placeholderBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
          'X-Image-Status': 'error-fallback'
        }
      });
    } catch {
      return new Response(null, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
  }
};