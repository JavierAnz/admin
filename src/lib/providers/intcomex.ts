import crypto from 'crypto';
import type { ProductoUniversal } from '../../types/inventario';

const API_KEY = process.env.INTCOMEX_API_KEY || '';
const ACCESS_KEY = process.env.INTCOMEX_ACCESS_KEY || '';
const BASE_URL = process.env.INTCOMEX_URL || 'https://intcomex-prod.apigee.net/v1';

function getSignature(apiKey: string, accessKey: string, utcTime: string): string {
  const data = apiKey + accessKey + utcTime;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function getIntcomexData(query?: string): Promise<ProductoUniversal[]> {
  // Si no hay credenciales, fallamos silenciosamente devolviendo lista vacía
  if (!API_KEY || !ACCESS_KEY) return [];

  try {
    const utcTime = new Date().toISOString().replace(/\.\d+Z$/g, "Z");
    const signature = getSignature(API_KEY, ACCESS_KEY, utcTime);

    const url = new URL(`${BASE_URL}/getcatalog`);
    url.searchParams.append('apiKey', API_KEY);
    url.searchParams.append('utcTime', utcTime);
    url.searchParams.append('signature', signature);
    if (query) url.searchParams.append('search', query);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) }); // Timeout de 5s
    if (!res.ok) throw new Error(`Intcomex error: ${res.status}`);

    const data = await res.json();

    return (data || []).map((p: any) => ({
      id: `INT-${p.Sku || p.Mpn}`,
      nombre: p.Description || 'Sin nombre',
      existencia: p.InStock ?? 0,
      preciop: p.Price?.UnitPrice ?? 0,
      precioa: p.Price?.UnitPrice ?? 0,
      preciob: p.Price?.UnitPrice ?? 0,
      marca: p.Brand || 'Genérico',
      modelo: p.Mpn,
      origen: 'EXTERNO',
      proveedorNombre: 'xxx',
      entregaInmediata: false,
      imagenUrl: p.ImageSquare
    }));
  } catch (error) {
    console.error("Fallo en proveedor :", error);
    return []; // Retorna vacío para no romper la búsqueda global
  }
}