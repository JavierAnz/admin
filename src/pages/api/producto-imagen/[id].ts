// src/pages/api/producto-imagen/[id].ts
import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// Cache en memoria para recursos estáticos
const cache = {
  placeholder: null as Buffer | null,
  transparentPixel: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
  placeholderPromise: null as Promise<Buffer> | null
};

// Cache de imágenes procesadas (LRU simple)
class ImageCache {
  private cache = new Map<string, { buffer: Buffer; timestamp: number }>();
  private readonly maxSize = 50;
  private readonly maxAge = 1000 * 60 * 30;

  set(id: string, buffer: Buffer): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(id, { buffer, timestamp: Date.now() });
  }

  get(id: string): Buffer | null {
    const entry = this.cache.get(id);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(id);
      return null;
    }

    return entry.buffer;
  }

  clear(): void {
    this.cache.clear();
  }
}

const imageCache = new ImageCache();

// Configuración de Sharp mejorada
const sharpConfig = {
  failOnError: false,
  limitInputPixels: 268402689,
  sequentialRead: true
};

// Opciones de redimensionamiento mejoradas
const resizeOptions = {
  width: 350, // Balance entre calidad y tamaño
  height: 350,
  fit: 'inside' as const,
  withoutEnlargement: true,
  kernel: 'lanczos3' as const
};

// Opciones WebP optimizadas para calidad/rendimiento
const webpOptions = {
  quality: 82, // Balance óptimo calidad/velocidad
  effort: 1, // Rápido, mínima diferencia visual vs effort: 2
  smartSubsample: true,
  nearLossless: false
};

// Pre-carga del placeholder
async function getPlaceholder(): Promise<Buffer> {
  if (cache.placeholder) return cache.placeholder;
  if (cache.placeholderPromise) return cache.placeholderPromise;

  cache.placeholderPromise = (async () => {
    const placeholderPath = path.resolve('./public/placeholder-image.png');

    try {
      const buffer = await fs.readFile(placeholderPath);
      cache.placeholder = await sharp(buffer, sharpConfig)
        .resize(resizeOptions)
        .webp(webpOptions)
        .toBuffer();
    } catch {
      cache.placeholder = await sharp({
        create: {
          width: 400,
          height: 400,
          channels: 3,
          background: { r: 240, g: 240, b: 240 }
        }
      }).webp(webpOptions).toBuffer();
    }

    cache.placeholderPromise = null;
    return cache.placeholder!;
  })();

  return cache.placeholderPromise;
}

// Procesamiento de imagen optimizado - SOLO mejoras de calidad
async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer, sharpConfig)
    .rotate() // Auto-rotación EXIF
    .sharpen({
      sigma: 0.3, // Sharpening muy sutil
      m1: 0.5,
      m2: 0.1
    })
    .resize(resizeOptions)
    .webp(webpOptions)
    .toBuffer();
}

// Procesamiento con remoción de fondo (SOLO para query param ?transparent=true)
async function processImageWithTransparency(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer, sharpConfig)
    .rotate()
    .removeAlpha()
    .flatten({ background: '#ffffff' })
    .threshold(245) // Umbral alto para blancos
    .negate()
    .toColorspace('b-w')
    .negate()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(async ({ data, info }) => {
      return sharp(buffer, sharpConfig)
        .rotate()
        .composite([{
          input: data,
          blend: 'dest-in',
          raw: {
            width: info.width,
            height: info.height,
            channels: info.channels
          }
        }])
        .sharpen({ sigma: 0.3, m1: 0.5, m2: 0.1 })
        .resize(resizeOptions)
        .webp(webpOptions)
        .toBuffer();
    });
}

// Headers comunes
const headers = {
  placeholder: {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=86400, immutable'
  },
  image: (size: number) => ({
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=2592000, immutable',
    'Content-Length': size.toString(),
    'Vary': 'Accept'
  }),
  error: {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=300'
  },
  transparent: {
    'Content-Type': 'image/gif',
    'Cache-Control': 'public, max-age=604800, immutable'
  }
};

export const GET: APIRoute = async ({ params, request }) => {
  const id = params.id;

  // Validación y type guard
  if (!id || typeof id !== 'string' || !/^\d+$/.test(id)) {
    return new Response(cache.transparentPixel as any, { headers: headers.transparent });
  }

  // Verificar cache en memoria
  const cached = imageCache.get(id);
  if (cached) {
    return new Response(cached as any, { headers: headers.image(cached.length) });
  }

  // Parámetro opcional para remoción de fondo (opt-in)
  const url = new URL(request.url);
  const transparent = url.searchParams.get('transparent') === 'true';

  try {
    const pool = await getDbConnection();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT Imagen1 
        FROM altekdb.Productos WITH (NOLOCK)
        WHERE Cod_Prod = @id 
          AND Imagen1 IS NOT NULL 
          AND DATALENGTH(Imagen1) > 0
      `);

    let optimizedBuffer: Buffer;

    if (!result.recordset[0]?.Imagen1) {
      optimizedBuffer = await getPlaceholder();
      return new Response(optimizedBuffer as any, {
        headers: headers.placeholder
      });
    }

    const buffer = result.recordset[0].Imagen1;

    // Procesamiento rápido por defecto, transparencia solo si se solicita
    try {
      optimizedBuffer = transparent
        ? await processImageWithTransparency(buffer)
        : await processImage(buffer);
    } catch (processError) {
      console.warn(`Error procesando imagen ${id}:`, processError);
      // Fallback: procesamiento básico
      optimizedBuffer = await sharp(buffer, sharpConfig)
        .rotate()
        .resize(resizeOptions)
        .webp(webpOptions)
        .toBuffer();
    }

    imageCache.set(id, optimizedBuffer);

    return new Response(optimizedBuffer as any, {
      headers: headers.image(optimizedBuffer.length)
    });

  } catch (e) {
    console.error(`Error cargando imagen ${id}:`, e);

    try {
      const placeholder = await getPlaceholder();
      return new Response(placeholder as any, { headers: headers.error });
    } catch {
      return new Response(cache.transparentPixel as any, { headers: headers.transparent });
    }
  }
};

export const clearCache = () => imageCache.clear();