<script lang="ts">
  import { onMount } from "svelte";
  import ProductoDetalleModal from "./ProductoDetalleModal.svelte";
  import { BRAND_CONFIG } from "../brand/brand";

  export let idAgenciaUsuario: string | null | undefined = undefined;
  export let nombreAgencia = "";
  export let userPermissions: number[] = [];

  const GTQ = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  });

  let busqueda = "";
  let productos: any[] = [];
  let loading = false;
  let soloMiSucursal = false;
  let timer: any;

  // Filtros restaurados
  let filtros = {
    precio: null as "asc" | "desc" | null,
    existencia: null as "asc" | "desc" | null,
    precioo: null as "asc" | "desc" | null,
  };

  let showModal = false,
    selProd: any = null,
    branchEx: any[] = [],
    loadEx = false;

  // ✨ SOLUCIÓN AL ERROR: Definición de getImageUrl
  function getImageUrl(
    productId: string | number,
    size: "thumb" | "small" | "medium" = "small",
  ) {
    return `/api/producto-imagen/${productId}?size=${size}`;
  }

  async function realizarBusqueda() {
    if (busqueda.trim().length < 2) {
      productos = [];
      return;
    }
    loading = true;
    try {
      const url = `/api/productos/search?q=${encodeURIComponent(busqueda)}&agencia=${idAgenciaUsuario || ""}&soloLocal=${soloMiSucursal}`;
      const res = await fetch(url);
      productos = res.ok ? await res.json() : [];
    } catch (error) {
      console.error("Error en búsqueda:", error);
      productos = [];
    } finally {
      loading = false;
    }
  }

  function handleInput() {
    clearTimeout(timer);
    timer = setTimeout(realizarBusqueda, 300);
  }

  // Lógica de ordenamiento rigurosa
  $: productosOrdenados = (() => {
    let copia = [...productos];
    if (!filtros.precio && !filtros.existencia && !filtros.precioo)
      return productos;
    return copia.sort((a, b) => {
      if (filtros.precio) {
        const diff = (a.precioa || 0) - (b.precioa || 0);
        if (diff !== 0) return filtros.precio === "asc" ? diff : -diff;
      }
      if (filtros.existencia) {
        const diff = (a.existencia || 0) - (b.existencia || 0);
        if (diff !== 0) return filtros.existencia === "asc" ? diff : -diff;
      }
      return 0;
    });
  })();

  function toggleFiltro(tipo: keyof typeof filtros, direccion: "asc" | "desc") {
    filtros[tipo] = filtros[tipo] === direccion ? null : direccion;
  }
</script>

<div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-32">
  <div class="flex justify-end pt-2">
    <a
      href="/api/auth/logout"
      class="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
    >
      Cerrar Sesión ✕
    </a>
  </div>

  <div
    class="sticky top-2 bg-white/95 backdrop-blur-md z-40 pb-4 border-b border-gray-100 space-y-3"
  >
    <div class="relative">
      <input
        type="text"
        bind:value={busqueda}
        on:input={handleInput}
        placeholder={BRAND_CONFIG.copy.search.placeholder}
        class="w-full p-4 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-yellow-400/30 outline-none text-lg font-black text-slate-800"
      />
      {#if loading}
        <div
          class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"
        ></div>
      {/if}
    </div>

    <div class="flex items-center justify-between gap-4">
      <button
        on:click={() => {
          soloMiSucursal = !soloMiSucursal;
          realizarBusqueda();
        }}
        class="flex items-center gap-2 group"
      >
        <div
          class="h-5 w-10 rounded-full relative transition-all {soloMiSucursal
            ? 'bg-green-500'
            : 'bg-slate-300'}"
        >
          <div
            class="h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all {soloMiSucursal
              ? 'left-5'
              : 'left-0.5'} shadow-sm"
          ></div>
        </div>
        <span
          class="text-[10px] font-black uppercase {soloMiSucursal
            ? 'text-green-600'
            : 'text-slate-400'}">Mi Sucursal</span
        >
      </button>

      <div class="flex items-center gap-2">
        <span
          class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >{productos.length} {BRAND_CONFIG.name} Items</span
        >
        {#if nombreAgencia}
          <div class="h-3 w-px bg-slate-200"></div>
          <div class="text-[10px] font-black text-slate-500 uppercase">
            📍 {nombreAgencia}
          </div>
        {/if}
      </div>
    </div>

    {#if productos.length > 0}
      <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          on:click={() => toggleFiltro("precio", "asc")}
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all {filtros.precio ===
          'asc'
            ? 'bg-slate-800 text-yellow-400'
            : 'bg-slate-100 text-slate-500'}">Precio ↑</button
        >
        <button
          on:click={() => toggleFiltro("precio", "desc")}
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all {filtros.precio ===
          'desc'
            ? 'bg-slate-800 text-yellow-400'
            : 'bg-slate-100 text-slate-500'}">Precio ↓</button
        >
        <button
          on:click={() => toggleFiltro("existencia", "desc")}
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all {filtros.existencia ===
          'desc'
            ? 'bg-slate-800 text-yellow-400'
            : 'bg-slate-100 text-slate-500'}">Más Stock</button
        >
        <button
          on:click={() => toggleFiltro("precioo", "asc")}
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border-2 border-red-400 text-red-500 {filtros.precioo ===
          'asc'
            ? 'bg-red-500 text-white'
            : ''}">Ofertas 🔥</button
        >
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 gap-3">
    {#each productosOrdenados as item (item.id)}
      <button
        type="button"
        on:click={() => {
          selProd = { ...item };
          showModal = true;
        }}
        class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-yellow-400 transition-all text-left w-full flex items-center gap-4 relative overflow-hidden active:scale-[0.98]"
      >
        <div
          class="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2"
        >
          <img
            src={getImageUrl(item.id, "thumb")}
            alt={item.nombre}
            class="max-h-full max-w-full object-contain"
          />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-[9px] font-black text-slate-400 uppercase">
            {item.modelo || "S/M"}
          </h3>
          <h4
            class="text-sm font-black text-slate-800 uppercase truncate leading-tight"
          >
            {item.nombre}
          </h4>
          <p class="text-[9px] text-slate-400 font-bold mt-1 uppercase">
            SKU: {item.id} | {item.marca}
          </p>
        </div>
        <div class="text-right">
          <div class="text-sm font-black text-slate-900">
            {GTQ.format(item.preciop || 0)}
          </div>
          <div
            class="text-[9px] font-black mt-1 {item.existencia > 0
              ? 'text-blue-600'
              : 'text-red-400'} uppercase"
          >
            ● {Math.floor(item.existencia)} DISP.
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>

<ProductoDetalleModal bind:showModal producto={selProd} />

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  :global(body) {
    background-color: #f8fafc;
  }
</style>
