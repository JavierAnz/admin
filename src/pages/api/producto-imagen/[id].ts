// src/pages/api/producto-imagen/[id].ts
import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../lib/db';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// Cache para el placeholder en memoria
let cachedPlaceholder: Buffer | null = null;
let cachedTransparentPixel: Buffer | null = null;

// Pre-carga del placeholder al iniciar
async function getPlaceholder(): Promise<Buffer> {
  if (cachedPlaceholder) return cachedPlaceholder;

  const placeholderPath = path.resolve('./public/placeholder-image.png');
  try {
    const buffer = await fs.readFile(placeholderPath);
    // Pre-optimizamos el placeholder una sola vez
    cachedPlaceholder = await sharp(buffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    return cachedPlaceholder;
  } catch (err) {
    // Generamos placeholder gris una sola vez
    cachedPlaceholder = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3, // RGB sin alpha = más ligero
        background: { r: 240, g: 240, b: 240 }
      }
    }).webp({ quality: 75 }).toBuffer();
    return cachedPlaceholder;
  }
}

function getTransparentPixel(): Buffer {
  if (!cachedTransparentPixel) {
    cachedTransparentPixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
  }
  return cachedTransparentPixel;
}

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;

  // Validación temprana
  if (!id || isNaN(Number(id))) {
    return new Response(new Uint8Array(getTransparentPixel()), {
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=604800' }
    });
  }

  try {
    const pool = await getDbConnection();

    // Query optimizada: solo traemos si existe
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT Imagen1 FROM altekdb.Productos WHERE Cod_Prod = @id AND Imagen1 IS NOT NULL');

    let optimizedBuffer: Buffer;

    // Si no hay imagen, usamos el placeholder cacheado
    if (!result.recordset[0]?.Imagen1 || result.recordset[0].Imagen1.length === 0) {
      optimizedBuffer = await getPlaceholder();
    } else {
      // Optimizamos la imagen de la BD
      const buffer = result.recordset[0].Imagen1;

      // Pipeline de Sharp optimizado
      optimizedBuffer = await sharp(buffer, {
        failOnError: false, // No fallar en imágenes corruptas
        limitInputPixels: 268402689 // ~16k x 16k max
      })
        .rotate() // Auto-rotación según EXIF
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
          kernel: 'lanczos3' // Mejor calidad/velocidad
        })
        .webp({
          quality: 75,
          effort: 2 // Más rápido, calidad aceptable (0-6, default=4)
        })
        .toBuffer();
    }

    return new Response(new Uint8Array(optimizedBuffer), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=2592000, immutable', // 30 días + immutable
        'Content-Length': optimizedBuffer.length.toString()
      }
    });

  } catch (e) {
    console.error(`Error cargando imagen ${id}:`, e);

    // Devolvemos placeholder en caso de error
    try {
      const placeholder = await getPlaceholder();
      return new Response(new Uint8Array(placeholder), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=3600' // Cache corto para errores
        }
      });
    } catch {
      // Último recurso: pixel transparente
      return new Response(new Uint8Array(getTransparentPixel()), {
        headers: { 'Content-Type': 'image/gif' }
      });
    }
  }
};