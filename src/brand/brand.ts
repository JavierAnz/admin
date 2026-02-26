// src/brand/brand.ts
export const BRAND_CONFIG = {
    name: 'Ofit',
    powerBiEmbedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiZjgwODMwOWItNTZhOS00MjMwLWJiNGItZmMxY2U1ZDhjMjU4IiwidCI6Ijk0NzhkNzI5LTdiNDEtNGU3YS1hODhiLTExOTkyZGUwMzg5MSIsImMiOjZ9',
    permissions: {
        VIEW_COSTS: 1230,
        VIEW_REPORTS: 704,
    },
    /** Tokens de dimensiones para imágenes — evita valores hardcoded en componentes */
    dimensions: {
        thumbSize: 80,          // px — miniatura en tarjeta del buscador
        modalImageHeight: 256,  // px — altura de imagen en modal (sm: h-64)
    },
    /** Tokens para contenedores skeleton — evita CLS al colapsar a 0px */
    skeletons: {
        resultsMinHeight: '400px',
        cardCount: 5,           // número de skeleton cards a mostrar mientras loading
    },
    copy: {
        search: {
            placeholder: 'Buscar productos en Ofit...',
            noResults: 'No encontramos productos.',
            error: 'Error en la búsqueda.',
            localSourceLabel: 'STOCK_PROPIO',
            loading: 'Buscando...',
            resultsFound: 'resultados',
        },
        errors: {
            notAuthorized: 'No tienes permiso.',
        },

    }
};

export const PERMS = BRAND_CONFIG.permissions;