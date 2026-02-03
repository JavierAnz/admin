// src/lib/inventoryService.ts
import { buscarLocal } from './sql';
import { getIntcomexData } from './providers/intcomex';
import type { ProductoUniversal } from '../types/inventario';
import { PERMS } from '../brand/brand';

export async function getAllInventory(
  query: string = '',
  agencia: string = '',
  soloLocal: boolean = false,
  userPerms: number[] = []
): Promise<ProductoUniversal[]> {
  try {
    const [propioRaw, externoRaw] = await Promise.all([
      buscarLocal(query, agencia, soloLocal, userPerms),
      soloLocal ? Promise.resolve([]) : getIntcomexData(query).catch(() => [])
    ]);

    const propio: ProductoUniversal[] = propioRaw.map(p => {
      // Mapeo base
      const prod: ProductoUniversal = {
        id: (p.id || '').toString(),
        nombre: p.nombre,
        existencia: p.Total || 0,
        preciop: p.precioP || 0,
        precioa: p.precioA || 0,
        precioo: p.precioo || 0,
        vigencia: p.vigencia,
        marca: p.marca,
        modelo: p.modelo,
        barras: p.barras,
        origen: 'PROPIO',
        proveedorNombre: 'OFIT',
        entregaInmediata: true,
        depto: '',
        ultimaCompra: '',
        direccionWeb: ''
      };

      // RIGOR: El objeto final solo lleva 'costo' si el permiso existe
      if (userPerms.includes(PERMS.VIEW_COSTS)) {
        prod.costo = p.costo;
      }

      return prod;
    });

    return [...propio, ...externoRaw];
  } catch (error) {
    console.error("Error en inventoryService:", error);
    return [];
  }
}