import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

export const SHARP_CONFIG = {
    failOnError: false,
    sequentialRead: true,
    limitInputPixels: 268402689,
};

export const IMAGE_SIZES = {
    thumb: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
} as const;

export type ImageSizeKey = keyof typeof IMAGE_SIZES;

export const RESIZE_OPTIONS = {
    fit: 'inside' as const,
    withoutEnlargement: true,
};

export const FORMAT_OPTIONS = {
    avif: {
        quality: 60,
        effort: 3,
        chromaSubsampling: '4:2:0' as const,
    },
    webp: {
        quality: 78,
        effort: 3,
        smartSubsample: true,
    },
    jpeg: {
        quality: 80,
        progressive: true,
        mozjpeg: true,
    },
};

export type ImageFormat = keyof typeof FORMAT_OPTIONS;

export function resolveImageSize(sizeParam: string | null) {
    return IMAGE_SIZES[sizeParam as ImageSizeKey] || IMAGE_SIZES.medium;
}

export function resolveImageFormat(acceptHeader: string | null): ImageFormat {
    const accept = acceptHeader || '';
    if (accept.includes('image/avif')) return 'avif';
    if (accept.includes('image/webp')) return 'webp';
    return 'jpeg';
}

const CONTENT_TYPE_MAP: Record<ImageFormat, string> = {
    avif: 'image/avif',
    webp: 'image/webp',
    jpeg: 'image/jpeg',
};

export interface ProcessImagePreset {
    width: number;
    height: number;
    format?: ImageFormat;
    quality?: number;
    kernel?: 'lanczos3' | 'cubic';
}

/** Procesa un buffer de imagen para entrega web (resize + formato). */
export async function processImage(
    input: Buffer,
    preset: ProcessImagePreset
): Promise<{ buffer: Buffer; contentType: string }> {
    const format = preset.format ?? 'webp';
    const quality = preset.quality ?? FORMAT_OPTIONS[format].quality;
    const kernel = preset.kernel ?? 'cubic';

    let pipeline = sharp(input, SHARP_CONFIG).rotate().flatten({ background: '#ffffff' });

    const metadata = await pipeline.metadata();
    if (metadata.width && metadata.height) {
        if (metadata.width > preset.width || metadata.height > preset.height) {
            pipeline = pipeline.resize({
                width: preset.width,
                height: preset.height,
                ...RESIZE_OPTIONS,
                kernel,
            });
        }
    } else {
        pipeline = pipeline.resize({
            width: preset.width,
            height: preset.height,
            ...RESIZE_OPTIONS,
            kernel,
        });
    }

    let buffer: Buffer;
    switch (format) {
        case 'avif':
            buffer = await pipeline.avif({ ...FORMAT_OPTIONS.avif, quality }).toBuffer();
            break;
        case 'jpeg':
            buffer = await pipeline.jpeg({ ...FORMAT_OPTIONS.jpeg, quality }).toBuffer();
            break;
        default:
            buffer = await pipeline.webp({ ...FORMAT_OPTIONS.webp, quality }).toBuffer();
    }

    return { buffer, contentType: CONTENT_TYPE_MAP[format] };
}

/** Procesa imagen subida para persistir en SQL (JPEG optimizado). */
export async function processImageUpload(
    input: Buffer,
    maxWidth: number,
    maxHeight: number
): Promise<Buffer> {
    return sharp(Buffer.from(input), SHARP_CONFIG)
        .rotate()
        .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
}

export async function createSvgPlaceholder(
    size: { width: number; height: number },
    label = 'Sin imagen'
): Promise<Buffer> {
    return sharp({
        create: {
            width: size.width,
            height: size.height,
            channels: 4,
            background: { r: 248, g: 250, b: 252, alpha: 1 },
        },
    })
        .composite([
            {
                input: Buffer.from(
                    `<svg width="${size.width}" height="${size.height}">
              <rect width="${size.width}" height="${size.height}" fill="#f1f5f9"/>
              <text x="50%" y="50%" text-anchor="middle" font-size="14" fill="#94a3b8">${label}</text>
            </svg>`
                ),
                top: 0,
                left: 0,
            },
        ])
        .webp({ quality: 80 })
        .toBuffer();
}

export async function getFilePlaceholder(size: { width: number; height: number }): Promise<Buffer> {
    const placeholderPath = path.resolve('./public/placeholder-image.png');
    try {
        const fileBuffer = await fs.readFile(placeholderPath);
        const { buffer } = await processImage(fileBuffer, {
            width: size.width,
            height: size.height,
            format: 'webp',
            quality: 80,
        });
        return buffer;
    } catch {
        return createSvgPlaceholder(size);
    }
}

export const IMG_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=86400',
    Vary: 'Accept',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'cross-origin',
};
