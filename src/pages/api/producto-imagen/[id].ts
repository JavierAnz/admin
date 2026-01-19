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

// Cache de imágenes procesadas con TTL más largo
class ImageCache {
  private cache = new Map<string, { buffer: Buffer; timestamp: number }>();
  private readonly maxSize = 100; // Aumentado de 50
  private readonly maxAge = 1000 * 60 * 60; // 1 hora en lugar de 30 min

  set(id: string, buffer: Buffer): void {
    if (this.cache.size >= this.maxSize) {
      // LRU: elimina el más antiguo
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
      if (oldestKey) this.cache.delete(oldestKey);
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

// Configuración de Sharp optimizada para calidad
const sharpConfig = {
  failOnError: false,
  limitInputPixels: 268402689,
  sequentialRead: true,
  density: 300 // DPI alto para mejor calidad
};

// Opciones de redimensionamiento mejoradas
const resizeOptions = {
  width: 400, // Aumentado de 350
  height: 400,
  fit: 'inside' as const,
  withoutEnlargement: true,
  kernel: 'lanczos3' as const, // Mejor algoritmo de resampling
  fastShrinkOnLoad: false // Desactivado para mejor calidad
};

// Opciones WebP optimizadas para MÁXIMA CALIDAD
const webpOptions = {
  quality: 90, // Aumentado de 82 para mejor calidad
  effort: 4, // Balance calidad/velocidad (0-6, 4 es óptimo)
  smartSubsample: true,
  nearLossless: false,
  alphaQuality: 100 // Calidad máxima para transparencias
};

// Pre-carga del placeholder mejorado
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
      // Placeholder generado con gradiente suave
      cache.placeholder = await sharp({
        create: {
          width: 400,
          height: 400,
          channels: 4,
          background: { r: 248, g: 250, b: 252, alpha: 1 }
        }
      })
        .composite([{
          input: Buffer.from(
            '<svg width="400" height="400"><rect width="400" height="400" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="sans-serif">Sin imagen</text></svg>'
          ),
          top: 0,
          left: 0
        }])
        .webp(webpOptions)
        .toBuffer();
    }

    cache.placeholderPromise = null;
    return cache.placeholder!;
  })();

  return cache.placeholderPromise;
}

// Procesamiento de imagen con CALIDAD BALANCEADA (más natural)
async function processImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer, sharpConfig);

  // Obtener metadata para decisiones inteligentes
  const metadata = await image.metadata();

  // Detectar imágenes que YA son de buena calidad
  const isHighQuality =
    metadata.width && metadata.width >= 600 &&
    metadata.height && metadata.height >= 600 &&
    metadata.density && metadata.density >= 150;

  let pipeline = image
    .rotate() // Auto-rotación EXIF
    .withMetadata({ density: 300 }); // Preservar alta resolución

  // MEJORAS MODERADAS para la mayoría de imágenes
  if (!isHighQuality) {
    // Si la imagen es muy pequeña, hacer upscale
    if (metadata.width && metadata.width < 400) {
      pipeline = pipeline.resize({
        width: Math.min(metadata.width * 1.8, 700), // Reducido de 2x
        height: Math.min((metadata.height || 400) * 1.8, 700),
        fit: 'inside',
        kernel: 'lanczos3',
        fastShrinkOnLoad: false
      });

      // Reducción de ruido MUY suave
      pipeline = pipeline.median(0.5); // Reducido de 1
    }

    // Mejoras SUAVES - más naturales
    pipeline = pipeline
      .modulate({
        saturation: 1.08, // +8% saturación (antes 15%)
        brightness: 1.01  // +1% brillo (antes 3%)
      })
      .linear(1.03, -1); // Contraste MUY suave (antes 1.1, -4)

    // Sharpening moderado
    pipeline = pipeline.sharpen({
      sigma: 0.4, // Reducido de 0.7
      m1: 0.6,    // Reducido de 0.9
      m2: 0.2     // Reducido de 0.4
    });

  } else {
    // Para imágenes de alta calidad: procesamiento mínimo
    pipeline = pipeline
      .modulate({ saturation: 1.03 }) // Muy suave
      .linear(1.02, -0.5) // Contraste casi imperceptible
      .sharpen({
        sigma: 0.3,
        m1: 0.5,
        m2: 0.1
      });
  }

  return pipeline
    .resize(resizeOptions)
    .webp(webpOptions)
    .toBuffer();
}

// Procesamiento con remoción de fondo MEJORADO
async function processImageWithTransparency(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer, sharpConfig);
  const metadata = await image.metadata();

  // Crear máscara de transparencia más precisa
  const maskBuffer = await image
    .clone()
    .removeAlpha()
    .flatten({ background: '#ffffff' })
    .modulate({ brightness: 1.1 }) // Ajuste de brillo
    .threshold(248) // Umbral más alto para blancos puros
    .negate()
    .toColorspace('b-w')
    .blur(0.3) // Suavizar bordes
    .negate()
    .toBuffer();

  // Aplicar máscara y procesar
  return sharp(buffer, sharpConfig)
    .rotate()
    .composite([{
      input: maskBuffer,
      blend: 'dest-in'
    }])
    .sharpen({ sigma: 0.5, m1: 0.7, m2: 0.3 })
    .resize(resizeOptions)
    .webp(webpOptions)
    .toBuffer();
}

// Headers optimizados con Vary y ETag
const headers = {
  placeholder: {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=604800, immutable', // 7 días
    'X-Content-Type-Options': 'nosniff'
  },
  image: (size: number, etag: string) => ({
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 año
    'Content-Length': size.toString(),
    'Vary': 'Accept',
    'ETag': etag,
    'X-Content-Type-Options': 'nosniff'
  }),
  error: {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=3600' // 1 hora
  },
  transparent: {
    'Content-Type': 'image/gif',
    'Cache-Control': 'public, max-age=604800, immutable',
    'X-Content-Type-Options': 'nosniff'
  }
};

export const GET: APIRoute = async ({ params, request }) => {
  const id = params.id;

  // Validación
  if (!id || typeof id !== 'string' || !/^\d+$/.test(id)) {
    return new Response(cache.transparentPixel as any, { headers: headers.transparent });
  }

  // Soporte para ETag/If-None-Match
  const ifNoneMatch = request.headers.get('if-none-match');
  const etag = `"${id}-v2"`; // v2 indica la versión del procesamiento

  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  // Verificar cache en memoria
  const cached = imageCache.get(id);
  if (cached) {
    return new Response(cached as any, {
      headers: headers.image(cached.length, etag)
    });
  }

  // Parámetro opcional para remoción de fondo
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
          AND DATALENGTH(Imagen1) > 100
      `);

    let optimizedBuffer: Buffer;

    if (!result.recordset[0]?.Imagen1) {
      optimizedBuffer = await getPlaceholder();
      return new Response(optimizedBuffer as any, {
        headers: headers.placeholder
      });
    }

    const buffer = result.recordset[0].Imagen1;

    try {
      optimizedBuffer = transparent
        ? await processImageWithTransparency(buffer)
        : await processImage(buffer);
    } catch (processError) {
      console.warn(`Error procesando imagen ${id}:`, processError);

      // Fallback con procesamiento básico pero de calidad
      optimizedBuffer = await sharp(buffer, sharpConfig)
        .rotate()
        .resize(resizeOptions)
        .webp({ quality: 85, effort: 2 })
        .toBuffer();
    }

    // Guardar en cache
    imageCache.set(id, optimizedBuffer);

    return new Response(optimizedBuffer as any, {
      headers: headers.image(optimizedBuffer.length, etag)
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