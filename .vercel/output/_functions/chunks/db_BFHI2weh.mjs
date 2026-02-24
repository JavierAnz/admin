import sql from 'mssql';

const config = {
  user: "altekdb",
  password: "WavOffice40Usuario.",
  server: "107.180.106.95\\SQLEXPRESS2008",
  database: "Logistik_GOSA",
  port: Number(undefined                       ) || 1433,
  options: {
    encrypt: false,
    // En local suele ser false, en Vercel será true
    trustServerCertificate: true,
    connectTimeout: 3e4,
    // Agregamos instanceName si existe en el env
    ...{ instanceName: "SQLEXPRESS2008" } 
  }
};
let pool = null;
async function getDbConnection() {
  if (!config.server) {
    console.error("DEBUG: Variables cargadas:", {
      server: "107.180.106.95\\SQLEXPRESS2008",
      user: "altekdb"
    });
    throw new Error("Error: 'sqlserver' es undefined. Revisa tu archivo .env");
  }
  if (pool?.connected) return pool;
  try {
    pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("DB connection error:", err);
    pool = null;
    throw err;
  }
}

export { getDbConnection as g };
