import sql from 'mssql';

const config = {
    user: import.meta.env.sqluser,
    password: import.meta.env.sqlpassword,
    server: import.meta.env.sqlserver,
    database: import.meta.env.sqldatabase,
    options: {
        instanceName: import.meta.env.instanceName,
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000
    }
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection() {
    try {
        if (pool && pool.connected) return pool;
        pool = await new sql.ConnectionPool(config).connect();
        return pool;
    } catch (err) {
        console.error('Error de conexión:', err);
        pool = null;
        throw err;
    }
}