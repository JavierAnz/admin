import sql from 'mssql';

const config: sql.config = {
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    port: Number(process.env.SQL_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000
    }
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection() {
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
