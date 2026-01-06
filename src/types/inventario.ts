export interface ProductoUniversal {
  id: string;
  nombre: string;
  existencia: number;
  preciop: number;
  precioa: number;
  preciob: number;
  marca: string;
  modelo?: string;
  Barras?: string;
  origen: 'PROPIO' | 'EXTERNO'; // PROPIO = Tu SQL, EXTERNO = APIs/Excel
  proveedorNombre: string;
  entregaInmediata: boolean;
}