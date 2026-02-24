const BRAND_CONFIG = {
  permissions: {
    VIEW_COSTS: 1230
  },
  /** Tokens de dimensiones para imágenes — evita valores hardcoded en componentes */
  dimensions: {
    thumbSize: 80,
    // px — miniatura en tarjeta del buscador
    modalImageHeight: 256
    // px — altura de imagen en modal (sm: h-64)
  },
  /** Tokens para contenedores skeleton — evita CLS al colapsar a 0px */
  skeletons: {
    resultsMinHeight: "400px",
    cardCount: 5
    // número de skeleton cards a mostrar mientras loading
  },
  copy: {
    search: {
      placeholder: "Buscar productos en Ofit...",
      error: "Error en la búsqueda."}}
};
const PERMS = BRAND_CONFIG.permissions;

export { BRAND_CONFIG as B, PERMS as P };
