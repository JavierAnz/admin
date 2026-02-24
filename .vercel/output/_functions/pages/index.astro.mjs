import { e as createComponent, f as createAstro } from '../chunks/astro/server_jlQkI_Ol.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_BGseE2UE.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return Astro2.redirect("/login");
}, "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/index.astro", void 0);

const $$file = "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
