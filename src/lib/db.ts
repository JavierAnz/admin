import sql from 'mssql';

const config = {
    user: import.meta.env.sqluser,
    password: import.meta.env.sqlpassword,
    server: import.meta.env.sqlserver,
    database: import.meta.env.sqldatabase,
    port: 1433, // Forzamos el puerto fijo que habilitaste
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 15000 // 15 segundos máximo antes de fallar localmente
    }
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection() {
    try {
        if (pool && pool.connected) return pool;

        console.log(`Intentando conectar a SQL Server en ${config.server}:1433...`);

        pool = await new sql.ConnectionPool(config).connect();

        console.log('✅ Conexión exitosa a la base de datos.');
        return pool;
    } catch (err: any) {
        // Analizamos el tipo de error para darte la respuesta exacta
        if (err.code === 'ETIMEOUT') {
            console.error('❌ ERROR: Tiempo de espera agotado. El puerto 1433 en GoDaddy sigue cerrado.');
        } else if (err.code === 'ESOCKET') {
            console.error('❌ ERROR: No se pudo establecer el socket. Revisa la IP del servidor.');
        } else if (err.message.includes('Login failed')) {
            console.error('❌ ERROR: El firewall está abierto, pero el usuario o contraseña son incorrectos.');
        } else {
            console.error('❌ ERROR DE CONEXIÓN DETALLADO:', err);
        }

        pool = null;
        throw err;
    }
}