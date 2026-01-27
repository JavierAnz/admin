import type { APIRoute } from 'astro';
import sql from 'mssql';

import { getConnection } from '../../../lib/sql';

export const GET: APIRoute = async ({ params }) => {
  const productId = params.id;
  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('cod_prod', sql.VarChar, productId) // VarChar para evitar errores de conversión
      .query(`
       SELECT 
        R.cod_agen, 
        R.existencia, 
        A.Nom_Agen AS UBICACION
        FROM rel_productos_agencias R
        INNER JOIN agencias A ON R.cod_agen = A.cod_agen
        WHERE LTRIM(RTRIM(R.cod_prod)) = LTRIM(RTRIM(@cod_prod)) -- Limpieza rigurosa de espacios
        AND (A.ES_SALA_VENTAS = 1 OR A.RECIBE_COMPRAS = 1)
        AND R.existencia > 0 
        ORDER BY R.existencia DESC
      `);

    const existencias = result.recordset.map(r => ({
      codigoAgencia: r.cod_agen,
      existencia: r.existencia,
      ubicacion: r.UBICACION ? r.UBICACION.trim() : `Agencia ${r.cod_agen}`
    }));

    return new Response(JSON.stringify(existencias), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error(`Error en API existencias:`, e);
    return new Response(JSON.stringify([]), { status: 200 });
  }
};