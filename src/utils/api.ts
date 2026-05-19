interface FetchOptions extends RequestInit {}

export async function fetchSecure<T>(endpoint: string, options?: FetchOptions): Promise<T | null> {
    try {
        const isFormData = options?.body instanceof FormData;
        const headers: Record<string, string> = {
            ...(options?.headers as Record<string, string>),
        };

        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(endpoint, {
            ...options,
            headers,
        });

        if (res.status === 401) {
            window.location.href = '/login?expired=true';
            return null;
        }

        if (res.status === 403) {
            console.warn(`[Seguridad] Acceso denegado al recurso: ${endpoint}`);
            throw new Error('forbidden');
        }

        if (!res.ok) {
            throw new Error(`http-error-${res.status}`);
        }

        return (await res.json()) as T;
    } catch (error) {
        if (error instanceof Error && error.message === 'forbidden') {
            throw error;
        }
        console.error('[API] Error de red o parseo:', error);
        throw new Error('network-error');
    }
}
