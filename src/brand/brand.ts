// src/brand/brand.ts
export const BRAND_CONFIG = {
    name: 'Ofit',
    permissions: {
        VIEW_COSTS: 1230,
    },
    copy: {
        search: {
            placeholder: 'Buscar productos en Ofit...',
            noResults: 'No encontramos productos.',
            error: 'Error en la búsqueda.',
            localSourceLabel: 'STOCK_PROPIO',
        },
        errors: {
            notAuthorized: 'No tienes permiso.',
        },
        // ESTA ES LA PARTE QUE FALTA:
        admin: {
            internalLabel: 'Información Interna',
            showCost: 'Revelar Costo',
            hideCost: 'Ocultar'
        }
    }
};

export const PERMS = BRAND_CONFIG.permissions;