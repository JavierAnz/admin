import type { APIRoute } from 'astro';
import { getProductoImagen } from '../../../server/queries';
import {
    FORMAT_OPTIONS,
    IMG_CACHE_HEADERS,
    getFilePlaceholder,
    processImage,
    resolveImageFormat,
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
    const format = resolveImageFormat(request.headers.get('accept'));
    const customQuality = url.searchParams.get('q');
    const quality = customQuality
        ? Math.min(100, Math.max(1, parseInt(customQuality)))
        : FORMAT_OPTIONS[format].quality;

    const blobKey = `img-producto-${id}-${sizeParam}-${format}-q${quality}.${format}`;
    const predictableUrl = getPredictableBlobUrl(blobKey);

    try {
        if (predictableUrl) {
            try {
                const cacheRes = await fetch(predictableUrl, { method: 'HEAD' });
                if (cacheRes.ok) {
                    return Response.redirect(predictableUrl, 302);
                }
            } catch (err) {
                console.warn('[IMG CDN CACHE CHECK ERR]', err);
            }
        }

        const record = await getProductoImagen(parseInt(id));

        if (!record?.Imagen1) {
            const placeholderBuffer = await getFilePlaceholder(size);
            return new Response(new Uint8Array(placeholderBuffer), {
                headers: {
                    'Content-Type': 'image/webp',
                    'Content-Length': placeholderBuffer.length.toString(),
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                    'X-Image-Status': 'placeholder',
                },
            });
        }

        const etag = `"${id}-${record.PesoOriginal}-${sizeParam}-${format}-q${quality}"`;
        const ifNoneMatch = request.headers.get('if-none-match');
        if (ifNoneMatch === etag) {
            return new Response(null, {
                status: 304,
                headers: { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable' },
            });
        }

        const { buffer: optimizedBuffer, contentType } = await processImage(record.Imagen1, {
            width: size.width,
            height: size.height,
            format,
            quality,
        });

        const compressionRatio = ((1 - optimizedBuffer.length / record.PesoOriginal) * 100).toFixed(1);

        const blob = await getBlob();
        if (blob) {
            try {
                await blob.put(blobKey, optimizedBuffer, {
                    access: 'public',
                    contentType,
                    addRandomSuffix: false,
                });
            } catch {
                console.warn(`[IMG BLOB QUOTA LIMIT] Ignored Put for ${blobKey}`);
            }
        }

        return new Response(new Uint8Array(optimizedBuffer), {
            headers: {
                ...IMG_CACHE_HEADERS,
                'Content-Type': contentType,
                'Content-Length': optimizedBuffer.length.toString(),
                ETag: etag,
                'X-Image-Format': format,
                'X-Image-Size': sizeParam,
                'X-Compression-Ratio': `${compressionRatio}%`,
                'X-Image-Status': 'optimized',
            },
        });
    } catch (error) {
        console.error(`[IMG ERROR] ${id}:`, error);
        try {
            const placeholderBuffer = await getFilePlaceholder(size);
            return new Response(new Uint8Array(placeholderBuffer), {
                headers: {
                    'Content-Type': 'image/webp',
                    'Content-Length': placeholderBuffer.length.toString(),
                    'Cache-Control': 'public, max-age=3600',
                    'X-Image-Status': 'error-fallback',
                },
            });
        } catch {
            return new Response(null, { status: 500, headers: { 'Cache-Control': 'no-store' } });
        }
    }
};
