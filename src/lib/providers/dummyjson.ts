import type { ProductoUniversal } from '../../types/inventario';

export async function getDummyData(query?: string): Promise<ProductoUniversal[]> {
    try {
        // Endpoint de búsqueda pública sin necesidad de API KEY
        const url = query
            ? `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`
            : 'https://dummyjson.com/products?limit=10';

        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) return [];

        const data = await res.json();

        // Mapeamos a tu estructura ProductoUniversal
        return (data.products || []).map((p: any) => ({
            id: `DUM-${p.id}`,
            nombre: p.title,
            existencia: p.stock,
            preciop: p.price * 7.70, // Simulación de conversión a Quetzales
            precioa: p.price * 7.70,
            preciob: p.price * 7.70,
            marca: p.brand,
            modelo: p.sku || 'N/A',
            origen: 'EXTERNO',
            proveedorNombre: 'DUMMY STORE',
            entregaInmediata: false,
            imagenUrl: p.thumbnail // Usamos la imagen directa de la API
        }));
    } catch (error) {
        console.error("Fallo en DummyJSON:", error);
        return [];
    }
}