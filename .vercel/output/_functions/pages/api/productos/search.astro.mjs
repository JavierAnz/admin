import { b as buscarLocal } from '../../../chunks/sql_B8sPrq2L.mjs';
import crypto from 'crypto';
import { P as PERMS, B as BRAND_CONFIG } from '../../../chunks/brand_DjbZtpcq.mjs';
export { r as renderers } from '../../../chunks/_@astro-renderers_BGseE2UE.mjs';

const API_KEY = process.env.INTCOMEX_API_KEY || "";
const ACCESS_KEY = process.env.INTCOMEX_ACCESS_KEY || "";
const BASE_URL = process.env.INTCOMEX_URL || "https://intcomex-prod.apigee.net/v1";
function getSignature(apiKey, accessKey, utcTime) {
  const data = apiKey + accessKey + utcTime;
  return crypto.createHash("sha256").update(data).digest("hex");
}
async function getIntcomexData(query) {
  if (!API_KEY || !ACCESS_KEY) return [];
  try {
    const utcTime = (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/g, "Z");
    const signature = getSignature(API_KEY, ACCESS_KEY, utcTime);
    const url = new URL(`${BASE_URL}/getcatalog`);
    url.searchParams.append("apiKey", API_KEY);
    url.searchParams.append("utcTime", utcTime);
    url.searchParams.append("signature", signature);
    if (query) url.searchParams.append("search", query);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5e3) });
    if (!res.ok) throw new Error(`Intcomex error: ${res.status}`);
    const data = await res.json();
    return (data || []).map((p) => ({
      id: `INT-${p.Sku || p.Mpn}`,
      nombre: p.Description || "Sin nombre",
      existencia: p.InStock ?? 0,
      preciop: p.Price?.UnitPrice ?? 0,
      precioa: p.Price?.UnitPrice ?? 0,
      preciob: p.Price?.UnitPrice ?? 0,
      marca: p.Brand || "Genérico",
      modelo: p.Mpn,
      origen: "EXTERNO",
      proveedorNombre: "xxx",
      entregaInmediata: false,
      imagenUrl: p.ImageSquare
    }));
  } catch (error) {
    console.error("Fallo en proveedor :", error);
    return [];
  }
}

async function getAllInventory(query = "", agencia = "", soloLocal = false, userPerms = []) {
  try {
    const [propioRaw, externoRaw] = await Promise.all([
      buscarLocal(query, agencia, soloLocal, userPerms),
      soloLocal ? Promise.resolve([]) : getIntcomexData(query).catch(() => [])
    ]);
    const propio = propioRaw.map((p) => {
      const prod = {
        id: (p.id || "").toString(),
        nombre: p.nombre,
        existencia: p.Total || 0,
        preciop: p.precioP || 0,
        precioa: p.precioA || 0,
        precioo: p.precioo || 0,
        numeroParte: p.numeroParte,
        costo: p.costo || 0,
        vigencia: p.vigencia,
        marca: p.marca,
        modelo: p.modelo,
        barras: p.barras,
        origen: "PROPIO",
        proveedorNombre: "OFIT",
        entregaInmediata: true,
        depto: "",
        ultimaCompra: p.ultimaCompra,
        direccionWeb: ""
      };
      if (userPerms.includes(PERMS.VIEW_COSTS)) {
        prod.costo = p.costo || 0;
      }
      return prod;
    });
    return [...propio, ...externoRaw];
  } catch (error) {
    console.error("Error en inventoryService:", error);
    return [];
  }
}

const GET = async ({ url, locals }) => {
  const queryRaw = url.searchParams.get("q") || "";
  const agencia = url.searchParams.get("agencia") || "";
  const soloLocal = url.searchParams.get("soloLocal") === "true";
  console.log("[SEARCH] Debug:", { query: queryRaw, agencia, soloLocal });
  if (queryRaw.trim().length < 2) {
    return new Response(JSON.stringify([]), { status: 200 });
  }
  try {
    const userPerms = locals.user?.permissions || [];
    const resultados = await getAllInventory(
      queryRaw,
      agencia,
      soloLocal,
      userPerms
    );
    return new Response(JSON.stringify(resultados), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
        // Edge CDN cache: 60s fresco, 120s stale-while-revalidate
      }
    });
  } catch (e) {
    console.error("Error crítico en endpoint de búsqueda:", e);
    return new Response(
      JSON.stringify({ error: BRAND_CONFIG.copy.search.error }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
