import sql from 'mssql';

const config: sql.config = {
    user: import.meta.env.sqluser,
    password: import.meta.env.sqlpassword,
    server: import.meta.env.sqlserver,
    database: import.meta.env.sqldatabase,
    port: Number(import.meta.env.sqlport) || 1433,
    requestTimeout: 15_000,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000,
        ...(import.meta.env.instanceName ? { instanceName: import.meta.env.instanceName } : {}),
    },
    pool: {
        max: 5,
        min: 0,
        idleTimeoutMillis: 10_000,
        acquireTimeoutMillis: 15_000,
    },
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection() {
    if (!config.server) {
        console.error('DEBUG: Variables cargadas:', {
            server: import.meta.env.sqlserver,
            user: import.meta.env.sqluser,
        });
        throw new Error("Error: 'sqlserver' es undefined. Revisa tu archivo .env");
    }

    if (pool?.connected) return pool;

    try {
        pool = await sql.connect(config);
        return pool;
    } catch (err) {
        console.error('DB connection error:', err);
        pool = null;
        throw err;
    }
}
