// src/brand/brand.ts
// ─── FUENTE ÚNICA DE VERDAD WHITE-LABEL ─────────────────────────────────────
// Para adaptar el proyecto a otro cliente, solo edita este archivo.
// ─────────────────────────────────────────────────────────────────────────────
export const BRAND_CONFIG = {

    // ── Identidad ──────────────────────────────────────────────────────────
    name: 'Ofit',
    company: 'Altek Systems',
    logoPath: '/logo.png',
    faviconPath: '/logo.png',
    year: 2026,
    locale: 'es-GT',
    currency: 'GTQ',

    // ── Colores (referenciados por global.css y Layout.astro) ──────────────
    // Cambiar estos valores cambia TODA la paleta de la UI automáticamente.
    colors: {
        primary: '#ffd312',   // color de marca principal (botones, bordes activos)
        primaryEnd: '#f0c000',   // fin del gradiente del primary
        dark: '#3d3b3e',   // navbar, fondo login
        darkEnd: '#2a292b',   // fin del gradiente dark
        accent: '#e91b27',   // rojo de alerta / badge
    },

    // ── Power BI ───────────────────────────────────────────────────────────
    powerBiEmbedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiZjgwODMwOWItNTZhOS00MjMwLWJiNGItZmMxY2U1ZDhjMjU4IiwidCI6Ijk0NzhkNzI5LTdiNDEtNGU3YS1hODhiLTExOTkyZGUwMzg5MSIsImMiOjZ9',

    // ── Sistema de Permisos (todos centralizados aquí) ─────────────────────
    // Los números corresponden a ID_OPCION en la tabla SEG_PERMISO del sistema core.
    permissions: {
        VIEW_COSTS: 1230,  // ver costo en modal de detalle
        VIEW_REPORTS: 704,  // ver vista de reportes Power BI
        ADMIN_PANEL: 500,  // acceso al panel de administración (antes: adminPrecios boolean)
    },

    // ── Tokens de UI ───────────────────────────────────────────────────────
    dimensions: {
        thumbSize: 80,   // px — miniatura en tarjeta del buscador
        modalImageHeight: 256,  // px — altura de imagen en modal
    },
    skeletons: {
        resultsMinHeight: '400px',
        cardCount: 5,    // número de skeleton cards mientras loading
    },

    // ── Textos (copy) ──────────────────────────────────────────────────────
    copy: {
        search: {
            placeholder: 'Buscar productos en Ofit...',
            noResults: 'No encontramos productos.',
            error: 'Error en la búsqueda.',
            localSourceLabel: 'STOCK_PROPIO',
            loading: 'Buscando...',
            resultsFound: 'resultados',
        },
        login: {
            userLabel: 'Usuario',
            passLabel: 'Contraseña',
            locationLabel: 'Ubicación',
            submitBtn: 'Entrar',
            loadingLocations: 'Cargando ubicaciones…',
            errorLocation: 'Error al cargar ubicaciones',
        },
        errors: {
            notAuthorized: 'No tienes permiso.',
        },
    },
};

// Alias corto para usar en guards y servicios
export const PERMS = BRAND_CONFIG.permissions;