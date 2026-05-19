import sql, { type Request } from 'mssql';
import { getDbConnection } from './db';
import { PERMS } from '../brand/brand';

/** Helper: búsqueda multi-palabra con LIKE AND entre términos, OR entre columnas. */
export function buildMultiWordLike(
    request: Request,
    words: string[],
    columns: string[]
): string {
    if (words.length === 0) return '';

    return words
        .map((word, i) => {
            request.input(`p${i}`, sql.VarChar, `%${word}%`);
            const ors = columns.map((col) => `${col} LIKE @p${i}`).join(' OR ');
            return `(${ors})`;
        })
        .join(' AND ');
}

export async function buscarLocal(
    queryRaw: string = '',
    agencia: string = '',
    soloLocal: boolean = false,
    userPerms: number[] = []
) {
    try {
        const pool = await getDbConnection();
        const request = pool.request();

        const palabras = queryRaw.trim().split(/\s+/).filter((p) => p.length > 0);
        const condicionesBusqueda = buildMultiWordLike(request, palabras, [
            'v.Nombre',
            'v.Codigo',
            'v.Marca',
            'v.Modelo',
            'v.Barras',
            'v.NUMERO_PARTE',
        ]);

        const columns = [
            'v.Codigo as id',
            'v.Nombre as nombre',
            'v.Marca as marca',
            'v.Modelo as modelo',
            'v.DIRECCION_WEB as direccionWeb',
            'v.Depto as depto',
            'v.[Precio P] as precioP',
            'v.[Precio A] as precioA',
            'v.Barras as barras',
            'v.[Precio O] as precioo',
            'v.Vigencia as vigencia',
            'v.ultimaCompra',
            'v.NUMERO_PARTE as numeroParte',
        ];

        if (userPerms.includes(PERMS.VIEW_COSTS)) {
            columns.push('v.costo as costo');
        }

        const selectClause = columns.join(', ');
        const whereClause = condicionesBusqueda ? `WHERE ${condicionesBusqueda}` : '';

        let query: string;
        if (soloLocal && parseInt(agencia) > 0) {
            request.input('agencia', sql.Int, parseInt(agencia));
            query = `
        SELECT  ${selectClause}, r.existencia as Total
        FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
        INNER JOIN rel_productos_agencias r WITH (NOLOCK) ON v.Codigo = r.cod_prod 
        AND r.COD_AGEN = @agencia AND r.existencia > 0
        ${whereClause}
        ORDER BY v.ultimaCompra `;
        } else {
            query = `
        SELECT ${selectClause}, 
          (SELECT SUM(r2.existencia) FROM rel_productos_agencias r2
           INNER JOIN agencias a ON r2.cod_agen = a.cod_agen
           WHERE r2.cod_prod = v.Codigo AND (a.ES_SALA_VENTAS = 1 OR a.RECIBE_COMPRAS = 1 or a.ES_BODEGA_TRANSITO = 1) ) as Total
        FROM dbo.VW_PRODUCTOS_LISTADO_WEB v WITH (NOLOCK)
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} EXISTS (
          SELECT 1 FROM rel_productos_agencias r3
          INNER JOIN agencias a2 ON r3.cod_agen = a2.cod_agen
          WHERE r3.cod_prod = v.Codigo AND r3.existencia > 0
          AND (a2.ES_SALA_VENTAS = 1 OR a2.RECIBE_COMPRAS = 1 or a2.ES_BODEGA_TRANSITO = 1)
        )
        ORDER BY v.ultimaCompra `;
        }

        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Error SQL Local:', err);
        return [];
    }
}

export async function buscarAdminCatalogo(query: string) {
    const palabras = query.trim().split(/\s+/).filter((p) => p.length > 0);
    if (palabras.length === 0) return [];

    const pool = await getDbConnection();
    const request = pool.request();
    const conditions = buildMultiWordLike(request, palabras, [
        'Nombre_Prod',
        'Cod_Prod',
        'Mod_Prod',
    ]);

    const result = await request.query(`
            SELECT  
                Cod_Prod as id, 
                Nombre_Prod as nombre, 
                Descr_Prod as descripcion, 
                Mod_Prod as modelo
            FROM altekdb.Productos WITH (NOLOCK)
            WHERE ${conditions}
            ORDER BY Nombre_Prod ASC
        `);

    return result.recordset;
}

export async function getExistenciasPorProducto(productId: string) {
    const pool = await getDbConnection();

    const result = await pool
        .request()
        .input('cod_prod', sql.VarChar, productId)
        .query(`
       SELECT 
        R.cod_agen, 
        R.existencia, 
        A.Nom_Agen AS UBICACION
        FROM rel_productos_agencias R
        INNER JOIN agencias A ON R.cod_agen = A.cod_agen
        WHERE LTRIM(RTRIM(R.cod_prod)) = LTRIM(RTRIM(@cod_prod))
        AND (A.ES_SALA_VENTAS = 1 OR A.RECIBE_COMPRAS = 1 or a.ES_BODEGA_TRANSITO = 1)
        AND R.existencia > 0 
        ORDER BY R.existencia DESC
      `);

    return result.recordset.map((r) => ({
        codigoAgencia: r.cod_agen,
        existencia: r.existencia,
        ubicacion: r.UBICACION ? r.UBICACION.trim() : `Agencia ${r.cod_agen}`,
    }));
}

export async function getNombreAgencia(agenciaId: string): Promise<string> {
    if (!agenciaId) return '';
    try {
        const pool = await getDbConnection();
        const result = await pool
            .request()
            .input('id', sql.Int, agenciaId)
            .query('SELECT Nom_Agen FROM agencias WHERE cod_agen = @id');

        return result.recordset[0]?.Nom_Agen ?? '';
    } catch (e) {
        console.error('Error fetching agency name:', e);
        return '';
    }
}

export async function listAgencias() {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
           SELECT Cod_Agen, Nom_Agen 
FROM agencias 
WHERE ES_SALA_VENTAS = 1 OR RECIBE_COMPRAS = 1 
ORDER BY Nom_Agen   
        `);
    return result.recordset;
}

export async function listMarcas() {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
            SELECT m.ID_MARCA as id, m.NOMBRE as nombre, COUNT(p.Nombre_Prod) AS prod_x_marca
            FROM altekdb.Cat_marca as m
            INNER JOIN altekdb.Productos as p ON m.id_marca = p.ID_MARCA
            WHERE p.existencia > 0
            GROUP BY m.ID_MARCA, m.NOMBRE
            ORDER BY m.NOMBRE ASC
        `);
    return result.recordset;
}

export async function getMarcaImagen(id: number) {
    const pool = await getDbConnection();
    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(`
        SELECT IMAGEN, DATALENGTH(IMAGEN) as PesoOriginal
        FROM CAT_MARCA WITH (NOLOCK)
        WHERE ID_MARCA = @id AND IMAGEN IS NOT NULL AND DATALENGTH(IMAGEN) > 100
      `);
    return result.recordset[0] as { IMAGEN: Buffer; PesoOriginal: number } | undefined;
}

export async function getProductoImagen(id: number) {
    const pool = await getDbConnection();
    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(`
        SELECT 
          Imagen1, 
          DATALENGTH(Imagen1) as PesoOriginal
        FROM altekdb.Productos WITH (NOLOCK)
        WHERE Cod_Prod = @id 
          AND Imagen1 IS NOT NULL 
          AND DATALENGTH(Imagen1) > 100
      `);
    return result.recordset[0] as { Imagen1: Buffer; PesoOriginal: number } | undefined;
}

export async function updateMarcaImagen(id: number, buffer: Buffer) {
    const pool = await getDbConnection();
    await pool
        .request()
        .input('imagen', sql.VarBinary(sql.MAX), buffer)
        .input('id', sql.Int, id)
        .query('UPDATE CAT_MARCA SET IMAGEN = @imagen WHERE ID_MARCA = @id');
}

export async function updateProductoImagen(id: number, buffer: Buffer) {
    const pool = await getDbConnection();
    await pool
        .request()
        .input('imagen', sql.VarBinary(sql.MAX), buffer)
        .input('id', sql.Int, id)
        .query('UPDATE altekdb.Productos SET Imagen1 = @imagen WHERE Cod_Prod = @id');
}

export async function updateProductoFields(
    id: number,
    fields: { nombre?: string; descripcion?: string; modelo?: string }
) {
    const pool = await getDbConnection();
    const req = pool.request().input('id', sql.Int, id);
    const updates: string[] = [];

    if (fields.nombre !== undefined) {
        req.input('nombre', sql.VarChar(500), fields.nombre);
        updates.push('Nombre_Prod = @nombre');
    }
    if (fields.descripcion !== undefined) {
        req.input('descripcion', sql.VarChar(sql.MAX), fields.descripcion);
        updates.push('Descr_Prod = @descripcion');
    }
    if (fields.modelo !== undefined) {
        req.input('modelo', sql.VarChar(100), fields.modelo);
        updates.push('Mod_Prod = @modelo');
    }

    if (updates.length > 0) {
        await req.query(`UPDATE altekdb.Productos SET ${updates.join(', ')} WHERE Cod_Prod = @id`);
    }
}
