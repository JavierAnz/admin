import sql from 'mssql';

// Usamos import.meta.env que es el estándar de Astro
const config: sql.config = {
    user: import.meta.env.sqluser,
    password: import.meta.env.sqlpassword,
    server: import.meta.env.sqlserver,
    database: import.meta.env.sqldatabase,
    port: Number(import.meta.env.sqlport) || 1433,
    options: {
        encrypt: false, // En local suele ser false, en Vercel será true
        trustServerCertificate: true,
        connectTimeout: 30000,
        // Agregamos instanceName si existe en el env
        ...(import.meta.env.instanceName ? { instanceName: import.meta.env.instanceName } : {})
    }
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection() {
    // Si la variable llega vacía, lanzamos un error claro
    if (!config.server) {
        console.error("DEBUG: Variables cargadas:", {
            server: import.meta.env.sqlserver,
            user: import.meta.env.sqluser
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