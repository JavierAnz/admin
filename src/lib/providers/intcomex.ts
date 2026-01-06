// src/lib/providers/intcomex.ts
import type { ProductoUniversal } from '../../types/inventario';

export async function getIntcomexData(): Promise<ProductoUniversal[]> {
  // Por ahora, usamos esta API pública para probar el buscador
  try {
    const res = await fetch('https://dummyjson.com/products/category/smartphones');
    const data = await res.json();
    
    return data.products.map((p: any) => ({
      id: `INT-${p.id}`, // Prefijo para distinguir
      nombre: p.title,
      existencia: p.stock,
      precio: p.price * 7.8, 
      marca: p.brand,
      
      origen: 'EXTERNO',
      proveedorNombre: 'INTCOMEX (DEMO)',
      entregaInmediata: false
    }));
  } catch (error) {
    console.error("Error cargando API de prueba:", error);
    return [];
  }
}