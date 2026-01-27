// src/pages/api/producto-imagen/[id].ts
import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// Configuración de Sharp optimizada
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

// ✨ Cache del placeholder
let placeholderCache: Buffer | null = null;

// ✨ Función para generar placeholder
async function getPlaceholder(size: { width: number; height: number }): Promise<Buffer> {
  // Intentar cargar placeholder desde archivo
  const placeholderPath = path.resolve('./public/placeholder-image.png');

  try {
    const fileBuffer = await fs.readFile(placeholderPath);
    return await sharp(fileBuffer, sharpConfig)
      .resize(size.width, size.height, resizeOptions)
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  } catch {
    // Si no existe, generar placeholder dinámico
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

export const GET: APIRoute = async ({ params, request }) => {
  const id = params.id;
  const url = new URL(request.url);

  // 1. Validación robusta de ID
  if (!id || !/^\d{1,10}$/.test(id)) {
    return new Response(null, { status: 400 });
  }

  // 2. Parámetro de tamaño con validación
  const sizeParam = url.searchParams.get('size') || 'medium';
  const size = SIZES[sizeParam as keyof typeof SIZES] || SIZES.medium;

  // 3. Detección de formato (AVIF > WebP > JPEG fallback)
  const acceptHeader = request.headers.get('accept') || '';
  const supportsAvif = acceptHeader.includes('image/avif');
  const supportsWebp = acceptHeader.includes('image/webp');

  const format = supportsAvif ? 'avif' : supportsWebp ? 'webp' : 'jpeg';

  // 4. Parámetro de calidad personalizable
  const customQuality = url.searchParams.get('q');
  const quality = customQuality
    ? Math.min(100, Math.max(1, parseInt(customQuality)))
    : formatOptions[format].quality;

  try {
    const pool = await getDbConnection();

    // Query simple sin HASHBYTES
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

    // ✅ Si no hay imagen, devolver placeholder
    if (!record?.Imagen1) {
      const placeholderBuffer = await getPlaceholder(size);
      const placeholderData = new Uint8Array(placeholderBuffer);

      return new Response(placeholderData, {
        headers: {
          'Content-Type': 'image/webp',
          'Content-Length': placeholderBuffer.length.toString(),
          'Cache-Control': 'public, max-age=86400', // Cache 1 día
          'X-Image-Status': 'placeholder'
        }
      });
    }

    // ETag basado en tamaño + parámetros
    const etag = `"${id}-${record.PesoOriginal}-${sizeParam}-${format}-q${quality}"`;

    // Soporte completo de cache condicional
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    // Procesamiento con Sharp
    let pipeline = sharp(record.Imagen1, sharpConfig);

    // Detectar metadata
    const metadata = await pipeline.metadata();

    // Auto-rotación EXIF
    pipeline = pipeline.rotate();

    // Resize solo si es necesario
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

    // Conversión a formato con opciones optimizadas
    let optimizedBuffer: Buffer;
    let contentType: string;

    switch (format) {
      case 'avif':
        optimizedBuffer = await pipeline
          .avif({ ...formatOptions.avif, quality })
          .toBuffer();
        contentType = 'image/avif';
        break;

      case 'webp':
        optimizedBuffer = await pipeline
          .webp({ ...formatOptions.webp, quality })
          .toBuffer();
        contentType = 'image/webp';
        break;

      default: // jpeg fallback
        optimizedBuffer = await pipeline
          .jpeg({ ...formatOptions.jpeg, quality })
          .toBuffer();
        contentType = 'image/jpeg';
    }

    // Logging para monitoreo
    const compressionRatio = ((1 - optimizedBuffer.length / record.PesoOriginal) * 100).toFixed(1);
    console.log(`[IMG] ${id} ${sizeParam} → ${format} | ${record.PesoOriginal}b → ${optimizedBuffer.length}b (${compressionRatio}% saved)`);

    // Convertir Buffer a Uint8Array
    const imageData = new Uint8Array(optimizedBuffer);

    // Headers optimizados para producción
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': optimizedBuffer.length.toString(),
        'ETag': etag,

        // Cache agresivo: 1 año inmutable
        'Cache-Control': 'public, max-age=31536000, immutable',

        // CDN cache: 7 días con revalidación
        'CDN-Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',

        // Vary critical para multi-formato
        'Vary': 'Accept',

        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',

        // Timing info
        'X-Image-Format': format,
        'X-Image-Size': sizeParam,
        'X-Compression-Ratio': compressionRatio + '%',
        'X-Image-Status': 'optimized'
      }
    });

  } catch (error) {
    console.error(`[IMG ERROR] ${id}:`, error);

    // ✅ En caso de error, también devolver placeholder
    try {
      const placeholderBuffer = await getPlaceholder(size);
      const placeholderData = new Uint8Array(placeholderBuffer);

      return new Response(placeholderData, {
        headers: {
          'Content-Type': 'image/webp',
          'Content-Length': placeholderBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
          'X-Image-Status': 'error-fallback'
        }
      });
    } catch (fallbackError) {
      console.error(`[IMG FALLBACK ERROR] ${id}:`, fallbackError);
      return new Response(null, {
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      });
    }
  }
};