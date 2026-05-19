import type { APIRoute } from 'astro';
import { getMarcaImagen, updateMarcaImagen } from '../../../server/queries';
import {
    createSvgPlaceholder,
    processImage,
    processImageUpload,
    resolveImageSize,
} from '../../../server/images';

let blobModule: typeof import('@vercel/blob') | null = null;

function getBlobToken() {
    if (typeof process !== 'undefined' && process.env.BLOB_READ_WRITE_TOKEN) {
        return process.env.BLOB_READ_WRITE_TOKEN;
    }
    return import.meta.env.BLOB_READ_WRITE_TOKEN;
}

async function getBlob() {
    if (!blobModule && getBlobToken()) {
        blobModule = await import('@vercel/blob');
    }
    return blobModule;
}

function getPredictableBlobUrl(blobKey: string): string | null {
    const token = getBlobToken();
    if (!token) return null;
    const parts = token.split('_');
    if (parts.length < 4) return null;
    return `https://${parts[3]}.public.blob.vercel-storage.com/${blobKey}`;
}

export const GET: APIRoute = async ({ params, request }) => {
    const id = params.id;
    const url = new URL(request.url);

    if (!id || !/^\d{1,10}$/.test(id)) {
        return new Response(null, { status: 400 });
    }

    const sizeParam = url.searchParams.get('size') || 'medium';
    const size = resolveImageSize(sizeParam);
    const blobKey = `img-marca-${id}-${sizeParam}.webp`;
    const predictableUrl = getPredictableBlobUrl(blobKey);

    try {
        if (predictableUrl) {
            try {
                const cacheRes = await fetch(predictableUrl, { method: 'HEAD' });
                if (cacheRes.ok) {
                    return Response.redirect(predictableUrl, 302);
                }
            } catch (err) {
                console.warn('[MARCA CDN CACHE CHECK ERR]', err);
            }
        }

        const record = await getMarcaImagen(parseInt(id));

        if (!record?.IMAGEN) {
            const placeholder = await createSvgPlaceholder(size);
            return new Response(new Uint8Array(placeholder), {
                headers: {
                    'Content-Type': 'image/webp',
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                    'X-Image-Status': 'placeholder',
                },
            });
        }

        const { buffer: optimizedBuffer } = await processImage(record.IMAGEN, {
            width: size.width,
            height: size.height,
            format: 'webp',
            quality: 82,
            kernel: 'lanczos3',
        });

        const blob = await getBlob();
        if (blob) {
            try {
                await blob.put(blobKey, optimizedBuffer, {
                    access: 'public',
                    contentType: 'image/webp',
                    addRandomSuffix: false,
                });
            } catch {
                console.warn(`[MARCA BLOB QUOTA LIMIT] Ignored Put for ${blobKey}`);
            }
        }

        return new Response(new Uint8Array(optimizedBuffer), {
            headers: {
                'Content-Type': 'image/webp',
                'Content-Length': optimizedBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'CDN-Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=86400',
                'X-Image-Status': 'optimized',
            },
        });
    } catch (error) {
        console.error(`[MARCA IMG ERROR] ${id}:`, error);
        return new Response(null, { status: 500 });
    }
};

export const PUT: APIRoute = async ({ params, request }) => {
    const id = params.id;

    if (!id || !/^\d{1,10}$/.test(id)) {
        return new Response(JSON.stringify({ error: 'ID inválido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('imagen') as File;

        if (!file || !file.type.startsWith('image/')) {
            return new Response(JSON.stringify({ error: 'Imagen no válida' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const arrayBuffer = await file.arrayBuffer();
        const processedBuffer = await processImageUpload(Buffer.from(arrayBuffer), 800, 800);
        await updateMarcaImagen(parseInt(id), processedBuffer);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(`[MARCA IMG UPDATE ERROR] ${id}:`, error);
        return new Response(JSON.stringify({ error: 'Error al actualizar imagen' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
