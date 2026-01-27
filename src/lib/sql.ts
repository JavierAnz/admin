// src/lib/sql.ts
import { getDbConnection } from './db';

// Re-exportamos getConnection para mantener compatibilidad
export const getConnection = getDbConnection;

export async function getInventario() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query(`
    SELECT 
        Codigo, Nombre, Marca, Modelo, [Precio P], [Precio A], Barras, [Precio O], VIGENCIA_OFERTA as Vigencia, Fech_UltimaCompra as ultimaCompra,
        (SELECT SUM(existencia) 
         FROM rel_productos_agencias r
         INNER JOIN agencias a ON r.cod_agen = a.cod_agen
         WHERE r.cod_prod = v.Codigo 
           AND (a.ES_SALA_VENTAS = 1 OR A.RECIBE_COMPRAS = 1)) as Total
    FROM dbo.VW_PRODUCTOS_LISTADO_WEB v
    WHERE EXISTS (
        SELECT 1 FROM rel_productos_agencias r
        INNER JOIN agencias a ON r.cod_agen = a.cod_agen
        WHERE r.cod_prod = v.Codigo 
          AND r.existencia > 0
          AND (a.ES_SALA_VENTAS = 1 OR A.RECIBE_COMPRAS = 1)
)
ORDER BY Nombre
        `);
        return result.recordset;
    } catch (err) {
        console.error("Error de conexión SQL Server:", err);
        return [];
    }
}