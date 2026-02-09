// src/pages/api/admin/producto/[id].ts
import type { APIRoute } from 'astro';
import sql from 'mssql';
import { getDbConnection } from '../../../../lib/db';
import sharp from 'sharp';

const sharpConfig = {
    failOnError: false,
    sequentialRead: true,
    limitInputPixels: 268402689
};

// PUT: Update product (fields and/or image)
export const PUT: APIRoute = async ({ params, request }) => {
    const id = params.id;

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID inválido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const pool = await getDbConnection();
        const contentType = request.headers.get('content-type') || '';

        // Handle JSON update (text fields only)
        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { nombre, descripcion, modelo } = body;

            const req = pool.request().input('id', sql.Int, parseInt(id));
            const updates: string[] = [];

            if (nombre !== undefined) {
                req.input('nombre', sql.VarChar(500), nombre);
                updates.push('Nombre_Prod = @nombre');
            }
            if (descripcion !== undefined) {
                req.input('descripcion', sql.VarChar(sql.MAX), descripcion);
                updates.push('Descr_Prod = @descripcion');
            }
            if (modelo !== undefined) {
                req.input('modelo', sql.VarChar(100), modelo);
                updates.push('Mod_Prod = @modelo');
            }

            if (updates.length > 0) {
                await req.query(`UPDATE altekdb.Productos SET ${updates.join(', ')} WHERE Cod_Prod = @id`);
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle multipart/form-data (image upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('imagen') as File;

            if (!file || !file.type.startsWith('image/')) {
                return new Response(JSON.stringify({ error: 'Imagen no válida' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Process image with Sharp
            const arrayBuffer = await file.arrayBuffer();
            const processedBuffer = await sharp(Buffer.from(arrayBuffer), sharpConfig)
                .rotate() // Auto-rotate based on EXIF
                .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
                .flatten({ background: '#ffffff' }) // Replace transparency with white background
                .jpeg({ quality: 85, progressive: true })
                .toBuffer();

            await pool.request()
                .input('imagen', sql.VarBinary(sql.MAX), processedBuffer)
                .input('id', sql.Int, parseInt(id))
                .query('UPDATE altekdb.Productos SET Imagen1 = @imagen WHERE Cod_Prod = @id');

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Content-Type no soportado' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error(`[PRODUCTO UPDATE ERROR] ${id}:`, error);
        return new Response(JSON.stringify({ error: 'Error al actualizar producto' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
