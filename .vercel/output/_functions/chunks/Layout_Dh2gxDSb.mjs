import { e as createComponent, f as createAstro, k as renderComponent, l as renderScript, r as renderTemplate, h as addAttribute, n as renderHead, o as renderSlot } from './astro/server_jlQkI_Ol.mjs';
/* empty css                         */

const $$Astro$1 = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Index;
  const propsStr = JSON.stringify(Astro2.props);
  const paramsStr = JSON.stringify(Astro2.params);
  return renderTemplate`${renderComponent($$result, "vercel-analytics", "vercel-analytics", { "data-props": propsStr, "data-params": paramsStr, "data-pathname": Astro2.url.pathname })} ${renderScript($$result, "D:/ALTEK/Web-empresa-ofit/ofit/node_modules/.pnpm/@vercel+analytics@1.6.1_svelte@5.46.1/node_modules/@vercel/analytics/dist/astro/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "D:/ALTEK/Web-empresa-ofit/ofit/node_modules/.pnpm/@vercel+analytics@1.6.1_svelte@5.46.1/node_modules/@vercel/analytics/dist/astro/index.astro", void 0);

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  if (Astro2.url.searchParams.has("logout")) {
    Astro2.cookies.delete("ofit_session", { path: "/" });
    Astro2.cookies.delete("agencia_id", { path: "/" });
    return Astro2.redirect("/login");
  }
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/png" href="/logo.png"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Ofit</title>${renderComponent($$result, "Analytics", $$Index, { "data-astro-cid-sckkx6r4": true })}${renderHead()}</head> <body data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "D:/ALTEK/Web-empresa-ofit/ofit/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
