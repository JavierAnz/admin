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
  private readonly maxSize = 50; // Máximo 50 imágenes en cache
  private readonly maxAge = 1000 * 60 * 30; // 30 minutos

  set(id: string, buffer: Buffer): void {
    // Limpieza si excede el tamaño
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(id, { buffer, timestamp: Date.now() });
  }

  get(id: string): Buffer | null {
    const entry = this.cache.get(id);
    if (!entry) return null;

    // Validar antigüedad
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

// Configuración de Sharp optimizada
const sharpConfig = {
  failOnError: false,
  limitInputPixels: 268402689, // ~16k x 16k max
  sequentialRead: true // Mejor para streams
};

const resizeOptions = {
  width: 300,
  height: 300,
  fit: 'inside' as const,
  withoutEnlargement: true,
  kernel: 'lanczos3' as const
};

const webpOptions = {
  quality: 75,
  effort: 1, // Más rápido que 2, diferencia mínima de calidad
  smartSubsample: true
};

// Pre-carga del placeholder (lazy + singleton)
async function getPlaceholder(): Promise<Buffer> {
  if (cache.placeholder) return cache.placeholder;

  // Evitar múltiples cargas simultáneas
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
      // Generamos placeholder gris
      cache.placeholder = await sharp({
        create: {
          width: 300,
          height: 300,
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

// Procesamiento de imagen con Sharp
async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer, sharpConfig)
    .rotate() // Auto-rotación EXIF
    .resize(resizeOptions)
    .webp(webpOptions)
    .toBuffer();
}

// Headers comunes
const headers = {
  placeholder: {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=86400, immutable' // 1 día
  },
  image: (size: number) => ({
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=2592000, immutable', // 30 días
    'Content-Length': size.toString(),
    'Vary': 'Accept'
  }),
  error: {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=300' // 5 min para errores
  },
  transparent: {
    'Content-Type': 'image/gif',
    'Cache-Control': 'public, max-age=604800, immutable' // 7 días
  }
};

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;

  // Validación temprana
  if (!id || !/^\d+$/.test(id)) {
    return new Response(cache.transparentPixel as any, { headers: headers.transparent });
  }

  // Verificar cache en memoria
  const cached = imageCache.get(id);
  if (cached) {
    return new Response(cached as any, { headers: headers.image(cached.length) });
  }

  try {
    const pool = await getDbConnection();

    // Query optimizada con NOLOCK
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
      // Usamos el placeholder cacheado
      optimizedBuffer = await getPlaceholder();

      return new Response(optimizedBuffer as any, {
        headers: headers.placeholder
      });
    }

    // Procesamos la imagen
    const buffer = result.recordset[0].Imagen1;
    optimizedBuffer = await processImage(buffer);

    // Guardamos en cache
    imageCache.set(id, optimizedBuffer);

    return new Response(optimizedBuffer as any, {
      headers: headers.image(optimizedBuffer.length)
    });

  } catch (e) {
    console.error(`Error cargando imagen ${id}:`, e);

    // Devolvemos placeholder en caso de error
    try {
      const placeholder = await getPlaceholder();
      return new Response(placeholder as any, { headers: headers.error });
    } catch {
      // Último recurso: pixel transparente
      return new Response(cache.transparentPixel as any, { headers: headers.transparent });
    }
  }
};

// Opcional: función para limpiar cache manualmente si es necesario
export const clearCache = () => imageCache.clear();