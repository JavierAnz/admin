interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
    ip: string,
    limit: number = 30,
    windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
        store.set(ip, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
