// src/lib/sql.ts
import sql from 'mssql';


const config = {
    user: import.meta.env.sqluser || '',
    password: import.meta.env.sqlpassword || '',
    server: import.meta.env.sqlserver || '',
    database: import.meta.env.sqldatabase || '',
    options: {
        instanceName: import.meta.env.instanceName || '',
        encrypt: false,
        trustServerCertificate: true
    }
};

export async function getInventario() {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query(`
SELECT 
    Codigo, Nombre, Marca, Modelo, [Precio P], [Precio A], Barras,
    (SELECT SUM(existencia) 
     FROM rel_productos_agencias r
     INNER JOIN agencias a ON r.cod_agen = a.cod_agen
     WHERE r.cod_prod = v.Codigo 
       AND (a.ES_SALA_VENTAS = 1 OR a.RECIBE_COMPRAS = 1)) as Total
FROM dbo.VW_PRODUCTOS_LISTADO_WEB v
WHERE EXISTS (
    SELECT 1 FROM rel_productos_agencias r
    INNER JOIN agencias a ON r.cod_agen = a.cod_agen
    WHERE r.cod_prod = v.Codigo 
      AND r.existencia > 0
      AND (a.ES_SALA_VENTAS = 1 OR a.RECIBE_COMPRAS = 1)
)
ORDER BY Nombre
        `);
        return result.recordset;
    } catch (err) {
        console.error("Error de conexión SQL Server:", err);
        return [];
    }
}