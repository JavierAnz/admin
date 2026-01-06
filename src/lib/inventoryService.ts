// src/lib/inventoryService.ts
import { getInventario as getInventarioPropio } from './sql';
import { getIntcomexData } from './providers/intcomex';
import type { ProductoUniversal } from '../types/inventario';

export async function getAllInventory(): Promise<ProductoUniversal[]> {
  try {
    // Ejecutamos ambas peticiones en paralelo para máxima velocidad (SSR)
    const [propioRaw, externoRaw] = await Promise.all([
      getInventarioPropio().catch(() => []),
      getIntcomexData().catch(() => [])
    ]);

    // Mapeo de tu SQL Server 2008 R2 (Asegúrate de usar las mayúsculas correctas de tu View)
    const propio: ProductoUniversal[] = propioRaw.map(p => ({
      id: (p.Codigo || p.codigo || '').toString(),
      nombre: p.Nombre || p.nombre,
      existencia: p.Total || p.existencia || 0,
      preciop: p['Precio P'] || p.precioP || 0,
      precioa: p['Precio A'] || p.precioA || 0,
      preciob: p['Precio B'] || p.precioB || 0,
      marca: p.Marca || p.marca,
      modelo: p.Modelo || p.modelo || undefined,
      Barras: p.Barras || p.barras || undefined,
      origen: 'PROPIO',
      proveedorNombre: 'OFITCM',
      entregaInmediata: true
    }));

    // Retornamos la unión de ambos listados
    return [...propio, ...externoRaw];
  } catch (error) {
    console.error("Error en el servicio de inventario:", error);
    return [];
  }
}