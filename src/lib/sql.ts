// src/lib/sql.ts
import sql from 'mssql';
import { getDbConnection } from './db';
import { PERMS } from '../brand/brand';

export const getConnection = getDbConnection;

export async function buscarLocal(
    queryRaw: string = '',
    agencia: string = '',
    soloLocal: boolean = false,
    userPerms: number[] = []
) {
    try {
        const pool = await getDbConnection();
        const request = pool.request();

        // 1. Fragmentación de búsqueda
        const palabras = queryRaw.trim().split(/\s+/).filter(p => p.length > 0);
        const condicionesBusqueda = palabras.map((p, i) => {
            request.input(`p${i}`, sql.VarChar, `%${p}%`);
            return `(v.Nombre LIKE @p${i} OR v.Codigo LIKE @p${i} OR v.Marca LIKE @p${i} OR v.Modelo LIKE @p${i} OR v.Barras LIKE @p${i} OR v.NUMERO_PARTE LIKE @p${i})`;
        }).join(' AND ');

        // 2. Definición de columnas base (Mapeo limpio para evitar espacios)
        const columns = [
            "v.Codigo as id", "v.Nombre as nombre", "v.Marca as marca", "v.Modelo as modelo",
            "v.DIRECCION_WEB as direccionWeb", "v.Depto as depto", "v.[Precio P] as precioP",
            "v.[Precio A] as precioA", "v.Barras as barras", "v.[Precio O] as precioo",
            "v.Vigencia as vigencia", "v.ultimaCompra", "v.NUMERO_PARTE as numeroParte"
        ];

        // RIGOR: Inyectar costo solo si tiene el permiso 1230 definido en brand.ts
        if (userPerms.includes(PERMS.VIEW_COSTS)) {
            columns.push("v.costo as costo");
        }

        const selectClause = columns.join(", ");
        const whereClause = condicionesBusqueda ? `WHERE ${condicionesBusqueda}` : '';

        // 3. Query unificado
        let query: string;
        if (soloLocal && parseInt(agencia) > 0) {
            request.input('agencia', sql.Int, parseInt(agencia));
            query = `
        SELECT ${selectClause}, r.existencia as Total
        FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
        INNER JOIN rel_productos_agencias r WITH (NOLOCK) ON v.Codigo = r.cod_prod 
        AND r.COD_AGEN = @agencia AND r.existencia > 0
        ${whereClause}
        ORDER BY v.Nombre ASC`;
        } else {
            query = `
        SELECT ${selectClause}, 
          (SELECT SUM(r2.existencia) FROM rel_productos_agencias r2
           INNER JOIN agencias a ON r2.cod_agen = a.cod_agen
           WHERE r2.cod_prod = v.Codigo AND (a.ES_SALA_VENTAS = 1 OR a.RECIBE_COMPRAS = 1)) as Total
        FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} EXISTS (
          SELECT 1 FROM rel_productos_agencias r3
          INNER JOIN agencias a2 ON r3.cod_agen = a2.cod_agen
          WHERE r3.cod_prod = v.Codigo AND r3.existencia > 0
          AND (a2.ES_SALA_VENTAS = 1 OR a2.RECIBE_COMPRAS = 1)
        )
        ORDER BY v.Nombre ASC`;
        }

        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        console.error("Error SQL Local:", err);
        return [];
    }
}