import type { APIRoute } from 'astro';
import { updateProductoFields, updateProductoImagen } from '../../../../server/queries';
import { processImageUpload } from '../../../../server/images';

export const PUT: APIRoute = async ({ params, request }) => {
    const id = params.id;

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID inválido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const productId = parseInt(id);

    try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const body = await request.json();
            await updateProductoFields(productId, {
                nombre: body.nombre,
                descripcion: body.descripcion,
                modelo: body.modelo,
            });

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('imagen') as File;

            if (!file || !file.type.startsWith('image/')) {
                return new Response(JSON.stringify({ error: 'Imagen no válida' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const arrayBuffer = await file.arrayBuffer();
            const processedBuffer = await processImageUpload(
                Buffer.from(arrayBuffer),
                1200,
                1200
            );

            await updateProductoImagen(productId, processedBuffer);

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Content-Type no soportado' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(`[PRODUCTO UPDATE ERROR] ${id}:`, error);
        return new Response(JSON.stringify({ error: 'Error al actualizar producto' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
