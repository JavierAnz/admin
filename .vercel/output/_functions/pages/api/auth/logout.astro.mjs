export { r as renderers } from '../../../chunks/_@astro-renderers_BGseE2UE.mjs';

const GET = async ({ cookies, redirect }) => {
  cookies.delete("ofit_session", { path: "/" });
  cookies.delete("agencia_id", { path: "/" });
  return redirect("/login?success=Sesion-Cerrada");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
