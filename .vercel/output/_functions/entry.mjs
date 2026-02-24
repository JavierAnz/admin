import { r as renderers } from './chunks/_@astro-renderers_BGseE2UE.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_B_KozCn_.mjs';
import { manifest } from './manifest_CKMVbcFe.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin.astro.mjs');
const _page2 = () => import('./pages/api/admin/producto/_id_.astro.mjs');
const _page3 = () => import('./pages/api/admin/productos.astro.mjs');
const _page4 = () => import('./pages/api/agencias.astro.mjs');
const _page5 = () => import('./pages/api/auth/login.astro.mjs');
const _page6 = () => import('./pages/api/auth/logout.astro.mjs');
const _page7 = () => import('./pages/api/existencias/_id_.astro.mjs');
const _page8 = () => import('./pages/api/marca-imagen/_id_.astro.mjs');
const _page9 = () => import('./pages/api/marcas.astro.mjs');
const _page10 = () => import('./pages/api/producto-imagen/_id_.astro.mjs');
const _page11 = () => import('./pages/api/productos/search.astro.mjs');
const _page12 = () => import('./pages/inventario.astro.mjs');
const _page13 = () => import('./pages/login.astro.mjs');
const _page14 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.16.6_@azure+identit_db3c2747c7efc7119f22805407d9340f/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin.astro", _page1],
    ["src/pages/api/admin/producto/[id].ts", _page2],
    ["src/pages/api/admin/productos.ts", _page3],
    ["src/pages/api/agencias.ts", _page4],
    ["src/pages/api/auth/login.ts", _page5],
    ["src/pages/api/auth/logout.ts", _page6],
    ["src/pages/api/existencias/[id].ts", _page7],
    ["src/pages/api/marca-imagen/[id].ts", _page8],
    ["src/pages/api/marcas.ts", _page9],
    ["src/pages/api/producto-imagen/[id].ts", _page10],
    ["src/pages/api/productos/search.ts", _page11],
    ["src/pages/inventario.astro", _page12],
    ["src/pages/login.astro", _page13],
    ["src/pages/index.astro", _page14]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "8d4c6cc1-7478-4ea9-a391-8add737da122",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
