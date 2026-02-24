import { e as createComponent, f as createAstro, m as maybeRenderHead, h as addAttribute, r as renderTemplate } from './astro/server_jlQkI_Ol.mjs';
/* empty css                         */

const $$Astro = createAstro();
const $$AdminNavbar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AdminNavbar;
  const { user } = Astro2.locals;
  const currentPath = Astro2.url.pathname;
  return renderTemplate`${maybeRenderHead()}<nav class="admin-navbar" data-astro-cid-lziuzbkc> <div class="navbar-container" data-astro-cid-lziuzbkc> <div class="brand" data-astro-cid-lziuzbkc> <a href="/inventario" class="logo-link" data-astro-cid-lziuzbkc> <img src="/logo.png" alt="OFIT" class="logo" data-astro-cid-lziuzbkc> </a> </div> <div class="nav-links" data-astro-cid-lziuzbkc> <a href="/inventario"${addAttribute([
    "nav-link",
    { active: currentPath === "/inventario" }
  ], "class:list")} data-astro-cid-lziuzbkc> <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-lziuzbkc> <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" data-astro-cid-lziuzbkc></path> </svg> <span data-astro-cid-lziuzbkc>Inventario</span> </a> ${user?.adminPrecios && renderTemplate`<a href="/admin"${addAttribute([
    "nav-link",
    { active: currentPath.startsWith("/admin") }
  ], "class:list")} data-astro-cid-lziuzbkc> <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-lziuzbkc> <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" data-astro-cid-lziuzbkc></path> <circle cx="12" cy="12" r="3" data-astro-cid-lziuzbkc></circle> </svg> <span data-astro-cid-lziuzbkc>Admin</span> </a>`} </div> <div class="user-section" data-astro-cid-lziuzbkc> <span class="user-nick" data-astro-cid-lziuzbkc>${user?.nick}</span> <a href="/api/auth/logout" class="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm" data-astro-cid-lziuzbkc> <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" data-astro-cid-lziuzbkc> <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m6 6 12 12m3-6a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" data-astro-cid-lziuzbkc></path> </svg> </a> </div> </div> </nav> `;
}, "D:/ALTEK/Web-empresa-ofit/ofit/src/components/AdminNavbar.astro", void 0);

export { $$AdminNavbar as $ };
