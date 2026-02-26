// src/types/inventario.ts

/** Producto completo retornado por inventoryService (incluye costo si el usuario tiene permiso) */
export interface ProductoUniversal {
  id: string;
  nombre: string;
  existencia: number;
  preciop: number;
  precioa: number;
  precioo: number;
  numeroParte?: string;
  costo?: number;
  marca: string;
  modelo?: string;
  barras?: string;
  depto: string;
  vigencia: string;
  ultimaCompra: string;
  direccionWeb: string;
  origen: 'PROPIO' | 'EXTERNO';
  proveedorNombre: string;
  entregaInmediata: boolean;
}

/** Subconjunto de ProductoUniversal expuesto al frontend (Buscador + Modal) */
export type ProductoBuscador = Pick<ProductoUniversal,
  | 'id' | 'nombre' | 'existencia'
  | 'preciop' | 'precioa' | 'precioo'
  | 'numeroParte' | 'costo'
  | 'marca' | 'modelo' | 'barras'
  | 'ultimaCompra' | 'origen'
>;

/** Elemento del carrito / cotización */
export interface ItemCotizacion {
  id: string;
  nombre: string;
  modelo: string;
  marca: string;
  precio: number;
  cantidad: number;
  origen: 'PROPIO' | 'EXTERNO';
}