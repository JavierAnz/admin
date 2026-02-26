// src/lib/rateLimiter.ts
// Rate limiter in-process (Edge-compatible).
// Funciona sin dependencias externas. Para producción de alta escala,
// sustituir por Vercel KV o Upstash Redis.

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Verifica si una IP puede hacer una nueva solicitud.
 * @param ip       Identificador del cliente (IP, user id, etc.)
 * @param limit    Número máximo de requests permitidos en la ventana
 * @param windowMs Tamaño de la ventana de tiempo en milisegundos
 * @returns `{ allowed: boolean, remaining: number, resetAt: number }`
 */
export function checkRateLimit(
    ip: string,
    limit: number = 30,
    windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
        // Primera solicitud en la ventana o ventana expirada — resetear
        store.set(ip, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
