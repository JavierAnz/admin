import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_jlQkI_Ol.mjs';
import { $ as $$Layout } from '../chunks/Layout_Dh2gxDSb.mjs';
import { $ as $$AdminNavbar } from '../chunks/AdminNavbar_BNY3_Nzf.mjs';
import { a as attr_class } from '../chunks/_@astro-renderers_BGseE2UE.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_BGseE2UE.mjs';
/* empty css                                 */

function AdminPanel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		// AdminPanel.svelte - Panel de administración de marcas y productos
		let activeTab = "marcas";

		$$renderer.push(`<div class="admin-panel svelte-1piq9ld"><div class="tabs svelte-1piq9ld"><button${attr_class('tab svelte-1piq9ld', void 0, {
			'active': // Load marcas on mount
			activeTab === "marcas"
		})}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-1piq9ld"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> Marcas</button> <button${attr_class('tab svelte-1piq9ld', void 0, { 'active': activeTab === "productos" })}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-1piq9ld"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> Productos</button></div> <div class="content svelte-1piq9ld">`);

		{
			$$renderer.push('<!--[-->');
			$$renderer.push(`<div class="section svelte-1piq9ld"><h2 class="section-title svelte-1piq9ld">Gestión de Marcas</h2> <p class="section-desc svelte-1piq9ld">Modifica las imágenes de las marcas</p> `);

			{
				$$renderer.push('<!--[-->');
				$$renderer.push(`<div class="loading svelte-1piq9ld">Cargando marcas...</div>`);
			}

			$$renderer.push(`<!--]--></div>`);
		}

		$$renderer.push(`<!--]--> `);

		{
			$$renderer.push('<!--[!-->');
		}

		$$renderer.push(`<!--]--></div></div>`);
	});
}

const $$Admin = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Admin | OFIT" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="admin-page"> ${renderComponent($$result2, "AdminNavbar", $$AdminNavbar, {})} <main class="admin-content"> ${renderComponent($$result2, "AdminPanel", AdminPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/ALTEK/Web-empresa-ofit/ofit/src/components/AdminPanel.svelte", "client:component-export": "default" })} </main> </div> ` })} `;
}, "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/admin.astro", void 0);

const $$file = "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/admin.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Admin,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
