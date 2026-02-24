import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as renderScript, h as addAttribute } from '../chunks/astro/server_jlQkI_Ol.mjs';
import { $ as $$Layout } from '../chunks/Layout_Dh2gxDSb.mjs';
/* empty css                                 */
export { r as renderers } from '../chunks/_@astro-renderers_BGseE2UE.mjs';

const $$Astro = createAstro();
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  const url = Astro2.url;
  const loginError = url.searchParams.get("error");
  const loginSuccess = url.searchParams.get("success");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Acceso | OFIT" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen flex items-center justify-center bg-[#3d3b3e] p-6 font-sans"> <div class="w-full max-w-[380px] animate-entrance"> <div class="flex flex-col items-center mb-8"> <div class="bg-[#ffd312] p-4 rounded-2xl shadow-lg"> <img src="/logo.png" alt="OFIT Logo" class="h-10 w-auto" loading="eager"> </div> <div class="h-1.5 w-10 bg-[#e91b27] mt-4 rounded-full shadow-sm"></div> </div> <div class="bg-white rounded-[2rem] shadow-2xl overflow-hidden border-b-[10px] border-[#ffd312] flex flex-col"> ${(loginError || loginSuccess) && renderTemplate`<div${addAttribute(`${loginError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"} px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b border-slate-100`, "class")}> ${loginError ? `\u26A0\uFE0F Error de acceso (${loginError})` : loginSuccess ? "\u2705 Sesi\xF3n finalizada" : "Sesi\xF3n Cerrada"} </div>`} <div class="p-6 space-y-5"> <form action="/api/auth/login" method="POST" class="space-y-5" id="loginForm"> <div class="flex flex-col space-y-1.5"> <label for="nick" class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
Usuario
</label> <input type="text" id="nick" name="nick" required class="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#3d3b3e] focus:bg-white transition-all outline-none text-slate-800 font-bold" placeholder="Nombre de usuario"> </div> <div class="flex flex-col space-y-1.5"> <label for="pass" class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
Contraseña
</label> <div class="flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:border-[#3d3b3e] focus-within:bg-white transition-all overflow-hidden"> <input type="password" id="pass" name="pass" required class="flex-1 px-5 py-4 bg-transparent outline-none text-slate-800 font-bold min-w-0" placeholder="••••••••"> <button type="button" id="togglePassword" class="px-4 text-slate-400 hover:text-[#3d3b3e] transition-colors border-l border-slate-200"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path> </svg> </button> </div> </div> <div class="flex flex-col space-y-1.5"> <label for="id_agencia_vendedor" class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
Ubicación
</label> <div class="relative"> <select id="id_agencia_vendedor" name="id_agencia_vendedor" required class="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#3d3b3e] focus:bg-white transition-all outline-none appearance-none font-bold text-slate-800"> <option value="">Cargando agencias…</option> </select> <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg> </div> </div> </div> <button type="submit" id="submitBtn" class="w-full bg-[#3d3b3e] text-[#ffd312] font-black py-4.5 rounded-2xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-[0.2em] mt-2"> <span id="submitText">Entrar</span> <div id="submitLoading" class="hidden"> <svg class="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> </div> </button> </form> </div> <div class="bg-slate-50 py-4 text-center border-t border-slate-100"> <p class="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
Altek Systems © 2026
</p> </div> </div> </div> </main>  ${renderScript($$result2, "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/login.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/login.astro", void 0);

const $$file = "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
