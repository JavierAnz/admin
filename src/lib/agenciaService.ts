// src/lib/agenciaService.ts
// Servicio centralizado para datos de agencias.
// Consolida la lógica que antes estaba duplicada en inventario.astro.
import { getDbConnection } from './db';
import sql from 'mssql';

/**
 * Obtiene el nombre de una agencia dado su ID.
 * Retorna cadena vacía si no se encuentra o hay error.
 */
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
