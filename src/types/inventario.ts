export interface ProductoUniversal {
  id: string;
  nombre: string;
  existencia: number;
  preciop: number;
  precioa: number;
  precioo: number;
  costo?: number;
  marca: string;
  depto: string;
  vigencia: string;
  ultimaCompra: string;
  direccionWeb: string;
  modelo?: string;
  barras?: string;
  origen: 'PROPIO' | 'EXTERNO'; // PROPIO = Tu SQL, EXTERNO = APIs/Excel
  proveedorNombre: string;
  entregaInmediata: boolean;
}