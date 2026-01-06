// src/lib/sql.ts
import sql from 'mssql';


const config = {
    user: import.meta.env.sqluser || '',
    password: import.meta.env.sqlpassword || '',
    server: import.meta.env.sqlserver || '', 
    database: 'Logistik_GOSA',
    options: {
        instanceName: 'SQLEXPRESS2008',
        encrypt: false, 
        trustServerCertificate: true
    }
};

export async function getInventario() {
    try {
        let pool = await sql.connect(config);
        // Usamos las columnas exactas de tu VIEW [VW_PRODUCTOS_LISTADO_WEB]
        const result = await pool.request().query(`
SELECT 
    Codigo, Nombre, Marca, Modelo, [Precio P], [Precio A], Barras,
    /* Calculamos el total sumando solo las agencias de venta */
    (SELECT SUM(existencia) 
     FROM rel_productos_agencias 
     WHERE cod_prod = v.Codigo 
       AND cod_agen NOT IN (5,6,7,8,9,12,14,20,21)) as Total
FROM dbo.VW_PRODUCTOS_LISTADO_WEB v
WHERE EXISTS (
    SELECT 1 FROM rel_productos_agencias r
    WHERE r.cod_prod = v.Codigo 
      AND r.existencia > 0
      AND r.cod_agen NOT IN (5,6,7,8,9,12,14,20,21)
)
ORDER BY Nombre
        `);
        return result.recordset;
    } catch (err) {
        console.error("Error de conexión SQL Server:", err);
        return [];
    }
}