# OFIT — Plataforma Web de Inventario y Cotizaciones

Sistema web tipo **white-label** para consulta de inventario, cotización de productos y administración de catálogo. Construido con Astro 5 (SSR), Svelte 5 y SQL Server.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | [Astro 5](https://astro.build) — SSR con adaptador Vercel |
| UI interactiva | [Svelte 5](https://svelte.dev) — componentes del buscador y admin |
| Base de datos | SQL Server (MSSQL) via `mssql` npm package |
| Estilos | Tailwind CSS v4 + CSS custom properties |
| Deploy | [Vercel](https://vercel.com) |
| Package manager | `pnpm` |

---

## Estructura de Carpetas

```
src/
├── brand/
│   └── brand.ts              ← ⭐ FUENTE ÚNICA DE VERDAD WHITE-LABEL
├── components/
│   ├── AdminNavbar.astro     ← Navbar condicional por permisos
│   ├── AdminPanel.svelte     ← Panel de gestión de marcas y productos
│   ├── Buscador.svelte       ← Motor de búsqueda + carrito/cotización
│   └── ProductoDetalleModal.svelte ← Modal de detalle del producto
├── layouts/
│   └── Layout.astro          ← Layout base (inyecta CSS vars de marca)
├── lib/
│   ├── db.ts                 ← Pool de conexión SQL Server (singleton)
│   ├── sql.ts                ← Query de búsqueda local (buscarLocal)
│   ├── inventoryService.ts   ← Orquestador: SQL + proveedores externos
│   ├── agenciaService.ts     ← Query de nombre de agencia
│   ├── rateLimiter.ts        ← Rate limiting in-process (30 req/min)
│   └── providers/
│       └── intcomex.ts       ← Proveedor externo de productos
├── pages/
│   ├── index.astro           ← Redirect a /inventario
│   ├── login.astro           ← Pantalla de acceso
│   ├── inventario.astro      ← Vista principal del buscador
│   ├── admin.astro           ← Panel de administración
│   ├── admin/
│   │   └── reportes.astro    ← Reporte Power BI embebido
│   └── api/
│       ├── auth/
│       │   ├── login.ts      ← POST: autenticación + sesión
│       │   └── logout.ts     ← GET: cierre de sesión
│       ├── productos/
│       │   └── search.ts     ← GET: búsqueda de inventario
│       ├── existencias/
│       │   └── [id].ts       ← GET: existencias por sucursal
│       ├── marcas.ts         ← GET: listado de marcas
│       ├── agencias.ts       ← GET: listado de agencias (público)
│       ├── marca-imagen/
│       │   └── [id].ts       ← GET/PUT: imagen de marca
│       ├── producto-imagen/
│       │   └── [id].ts       ← GET: imagen de producto
│       └── admin/
│           ├── productos.ts  ← GET: búsqueda admin de productos
│           └── producto/
│               └── [id].ts   ← PUT: editar producto
├── styles/
│   └── global.css            ← Tailwind v4 + CSS custom properties
├── types/
│   └── inventario.ts         ← Interfaces TypeScript del dominio
├── env.d.ts                  ← Tipos de App.Locals (user con permissions[])
└── middleware.ts             ← Guards de autenticación y permisos
```

---

## 🎨 White-Label — Cómo adaptar a otro cliente

**Un solo archivo controla toda la identidad visual y funcional:**

```ts
// src/brand/brand.ts
export const BRAND_CONFIG = {
  name:    'NuevoCliente',       // Nombre en el <title> de páginas
  company: 'Empresa SA',         // Footer del login
  year:    2026,                 // Footer del login
  locale:  'es-GT',             // Formato de fechas y moneda
  currency:'GTQ',               // Moneda (GTQ, USD, etc.)

  colors: {
    primary:  '#ffd312',         // Botones, bordes activos, tab seleccionada
    dark:     '#3d3b3e',         // Navbar, fondo login
    accent:   '#e91b27',         // Badges, alertas, rojo
  },

  powerBiEmbedUrl: 'https://...', // URL del reporte Power BI

  permissions: {
    VIEW_COSTS:   1230,           // Ver costo en modal de detalle
    VIEW_REPORTS:  704,           // Acceso a /admin/reportes
    ADMIN_PANEL:   500,           // Acceso a /admin
  },

  copy: {
    search: { placeholder: 'Buscar productos...' },
    login:  { submitBtn: 'Entrar' },
  },
};
```

Los colores se inyectan automáticamente como CSS custom properties desde `Layout.astro` — **cambiar `colors.primary` en brand.ts cambia toda la UI sin tocar CSS**.

También reemplaza `/public/logo.png` con el logo del cliente.

---

## 🔐 Sistema de Autenticación y Permisos

### Flujo de Login

```
1. POST /api/auth/login
   ├── Valida nick + md5(pass) contra WEB_USUARIO (JOIN sysusua)
   ├── Obtiene ID_PERFIL del usuario
   ├── Obtiene array de ID_OPCION desde SEG_PERMISO WHERE ID_PERFIL = ?
   └── Guarda cookie httpOnly "ofit_session" con { id, nick, permissions[] }

2. Cada request pasa por middleware.ts
   ├── Parsea la cookie → puebla Astro.locals.user
   └── Verifica permisos según la ruta
```

### Tabla de Permisos

| Ruta | Permiso requerido | Número |
|---|---|---|
| `/inventario` | Solo sesión activa | — |
| `/admin` | `ADMIN_PANEL` en `permissions[]` | `500` |
| `/admin/reportes` | `VIEW_REPORTS` en `permissions[]` | `704` |
| Ver costo en modal | `VIEW_COSTS` en `permissions[]` | `1230` |

**Para agregar un nuevo permiso:**
1. Agrega `NUEVO_PERMISO: 999` en `brand.ts` → `permissions`
2. Usa `PERMS.NUEVO_PERMISO` en `middleware.ts` o en el componente
3. Asigna `ID_OPCION = 999` al perfil en la tabla `SEG_PERMISO` de la BD

### Acceso condicional en el Navbar

```astro
// AdminNavbar.astro
user?.permissions?.includes(PERMS.ADMIN_PANEL) && <a href="/admin">
user?.permissions?.includes(PERMS.VIEW_REPORTS) && <a href="/admin/reportes">
```

---

## 🔍 Flujo de Búsqueda de Inventario

```
Usuario escribe → Buscador.svelte (debounce 300ms)
    └── GET /api/productos/search?q=...&agencia=...&soloLocal=...
        ├── rateLimiter.ts (30 req/min por IP)
        ├── inventoryService.ts → getAllInventory()
        │   ├── sql.ts → buscarLocal()       (SQL Server local)
        │   │   └── Inyecta columna "costo" solo si VIEW_COSTS en permissions
        │   └── providers/intcomex.ts        (API externa, si !soloLocal)
        └── Response JSON con Cache-Control (60s edge CDN)
```

**Para agregar un nuevo proveedor externo:**
1. Crea `src/lib/providers/nuevo-proveedor.ts` con una función que retorne `ProductoUniversal[]`
2. Agrégala al `Promise.all()` en `inventoryService.ts`

---

## 🗄️ Conexión a Base de Datos

**Variables de entorno requeridas (`.env`):**

```env
sqluser=usuario
sqlpassword=contraseña
sqlserver=servidor
sqldatabase=base_de_datos
sqlport=1433
instanceName=NOMBRE_INSTANCIA   # opcional, si es named instance
POWERBI_EMBED_URL=https://...   # opcional
```

**El pool de conexión** (`lib/db.ts`) es un **singleton** — se crea una vez y se reutiliza en todas las requests. No se crea una nueva conexión por request.

**Tablas utilizadas:**

| Tabla | Propósito |
|---|---|
| `WEB_USUARIO` | Usuarios del sistema web |
| `altekdb.sysusua` | Usuarios del sistema core (JOIN para ID_PERFIL) |
| `SEG_PERMISO` | Permisos por perfil (ID_PERFIL → ID_OPCION[]) |
| `VW_PRODUCTOS_LISTADO_WEB` | Vista de productos para búsqueda |
| `rel_productos_agencias` | Existencias por agencia/sucursal |
| `agencias` | Catálogo de sucursales |

---

## 📋 API Endpoints

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Autenticación |
| `GET` | `/api/auth/logout` | No | Cierre de sesión |
| `GET` | `/api/agencias` | No | Lista de agencias |
| `GET` | `/api/productos/search` | Sesión | Búsqueda de inventario |
| `GET` | `/api/existencias/[id]` | Sesión | Existencias por sucursal |
| `GET` | `/api/marcas` | Sesión | Lista de marcas |
| `GET` | `/api/marca-imagen/[id]` | Sesión | Imagen de marca |
| `PUT` | `/api/marca-imagen/[id]` | Admin | Actualizar imagen de marca |
| `GET` | `/api/producto-imagen/[id]` | Sesión | Imagen de producto |
| `GET` | `/api/admin/productos` | Admin | Búsqueda admin de productos |
| `PUT` | `/api/admin/producto/[id]` | Admin | Editar datos de producto |

---

## 🚀 Cómo Correr el Proyecto

```bash
# Instalar dependencias
pnpm install

# Desarrollo local
pnpm run dev

# Build de producción
pnpm run build

# Verificar tipos TypeScript
pnpm exec tsc --noEmit
```

---

## 📁 Guía Rápida: "¿Qué archivo toco si quiero...?"

| Quiero... | Archivo(s) a modificar |
|---|---|
| Cambiar colores de toda la UI | `src/brand/brand.ts` → `colors` |
| Cambiar el nombre/logo del cliente | `src/brand/brand.ts` + `/public/logo.png` |
| Agregar un nuevo permiso | `src/brand/brand.ts` → `permissions` + `src/middleware.ts` |
| Agregar un link en el navbar | `src/components/AdminNavbar.astro` |
| Agregar una nueva página de admin | `src/pages/admin/nueva-pagina.astro` |
| Modificar la búsqueda SQL | `src/lib/sql.ts` → `buscarLocal()` |
| Agregar un proveedor externo de productos | `src/lib/providers/` + `src/lib/inventoryService.ts` |
| Cambiar textos del buscador o login | `src/brand/brand.ts` → `copy` |
| Modificar la pantalla de login | `src/pages/login.astro` |
| Cambiar el reporte Power BI | `src/brand/brand.ts` → `powerBiEmbedUrl` |
| Agregar un campo al usuario de sesión | `src/env.d.ts` + `src/pages/api/auth/login.ts` |
| Ajustar el rate limit de búsquedas | `src/lib/rateLimiter.ts` o `src/pages/api/productos/search.ts` |
| Agregar un nuevo tipo de dato | `src/types/inventario.ts` |
| Cambiar la BD o las queries de agencia | `src/lib/agenciaService.ts` |

---

## 🏗️ Flujo de una Request SSR (resumen)

```
Browser → Vercel Edge
    └── middleware.ts          (auth guard, hidrata locals.user)
        └── página .astro      (frontmatter server-side)
            ├── lib/           (servicios y queries)
            │   └── db.ts      (pool SQL Server singleton)
            └── HTML → Browser
                └── componente Svelte (client:load)
                    └── fetch /api/...  (rutas API)
```

---

*Generado con Antigravity — actualizado Febrero 2026*
