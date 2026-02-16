<script lang="ts">
  import { onMount } from "svelte";
  import ProductoDetalleModal from "./ProductoDetalleModal.svelte";
  import { BRAND_CONFIG } from "../brand/brand";

  export let idAgenciaUsuario: string | null | undefined = undefined;
  export let nombreAgencia = "";

  const GTQ = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  });

  function formatFechaMesAnio(fecha: string): string {
    if (!fecha) return "S/N";
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "S/N";
    return d.toISOString().slice(0, 10);
  }

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
    ultimaCompra: null as "asc" | "desc" | null,
  };

  let showModal = false,
    selProd: any = null,
    branchEx: any[] = [],
    loadEx = false;

  // Carrito/Cotización state - estilo original
  let listaCarrito: any[] = [];
  let mostrarResumen = false;

  function cargarCarrito() {
    if (typeof localStorage !== "undefined") {
      listaCarrito = JSON.parse(
        localStorage.getItem("cotizacion_ofit") || "[]",
      );
    }
  }

  function enviarWhatsApp() {
    let mensaje = `*COTIZACIÓN OFIT*\n\n`;
    let total = 0;
    listaCarrito.forEach((item) => {
      mensaje += `${item.modelo}- ${item.marca} - ${item.nombre}\n   *Cant:* ${item.cantidad} - *Precio:* ${GTQ.format(item.precio * item.cantidad)}\n\n`;
      total += item.precio * item.cantidad;
    });
    mensaje += `*TOTAL: ${GTQ.format(total)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank");
  }

  onMount(() => {
    cargarCarrito();
    window.addEventListener("carrito-actualizado", cargarCarrito);
    return () =>
      window.removeEventListener("carrito-actualizado", cargarCarrito);
  });

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

  $: productosOrdenados = (() => {
    let copia = [...productos];
    if (
      !filtros.precio &&
      !filtros.existencia &&
      !filtros.precioo &&
      !filtros.ultimaCompra
    )
      return productos;
    return copia.sort((a, b) => {
      if (filtros.precioo) {
        const aOferta = (a.precioo || 0) > 0 ? 1 : 0;
        const bOferta = (b.precioo || 0) > 0 ? 1 : 0;
        const diff = bOferta - aOferta;
        if (diff !== 0) return diff;
      }
      if (filtros.ultimaCompra) {
        const dateA = a.ultimaCompra ? new Date(a.ultimaCompra).getTime() : 0;
        const dateB = b.ultimaCompra ? new Date(b.ultimaCompra).getTime() : 0;
        const diff = dateA - dateB;
        if (diff !== 0) return filtros.ultimaCompra === "asc" ? diff : -diff;
      }
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

<div
  class="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-32 overflow-x-hidden"
>
  <div
    class="sticky top-0 bg-white/95 backdrop-blur-md z-40 pb-3 sm:pb-4 border-b border-gray-100 space-y-2 sm:space-y-3 px-1"
  >
    <div class="relative">
      <input
        type="text"
        bind:value={busqueda}
        on:input={handleInput}
        placeholder={BRAND_CONFIG.copy.search.placeholder}
        class="w-full p-3 sm:p-4 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-yellow-400/30 outline-none text-base sm:text-lg font-black text-slate-800 box-border"
      />
      {#if loading}
        <div
          class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"
        ></div>
      {/if}
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
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
          class="text-[9px] sm:text-[10px] font-black uppercase {soloMiSucursal
            ? 'text-green-600'
            : 'text-slate-400'}">Mi Sucursal</span
        >
      </button>

      <div class="flex items-center gap-1 sm:gap-2">
        <span
          class="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase"
          >{productos.length} Items</span
        >
        {#if nombreAgencia}
          <div class="h-3 w-px bg-slate-200"></div>
          <div
            class="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase truncate max-w-[80px] sm:max-w-none"
          >
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
          on:click={() => toggleFiltro("ultimaCompra", "desc")}
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all {filtros.ultimaCompra ===
          'desc'
            ? 'bg-slate-800 text-yellow-400'
            : 'bg-slate-100 text-slate-500'}">Últ. Compra ↓</button
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
        class="bg-white p-4 rounded-2xl border transition-all cursor-pointer active:scale-95 text-left w-full relative overflow-hidden {item.precioo >
        0
          ? 'border-2 border-red-400 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30'
          : 'border border-slate-100 shadow-sm hover:border-[#ffd312]'}"
      >
        {#if item.precioo > 0}
          <div
            class="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-md z-10 flex items-center gap-1"
          >
            <span>🔥</span>
            <span>OFERTA</span>
          </div>
          <div
            class="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-shimmer-card"
          ></div>
        {/if}

        <div class="flex items-center gap-4 relative z-[5]">
          <div
            class="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2 overflow-hidden"
          >
            <img
              src={getImageUrl(item.id, "thumb")}
              alt={item.nombre}
              class="max-h-full max-w-full object-contain"
              loading="lazy"
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
              SKU: {item.id} | {item.marca ? item.marca : "S/N"} | {item.numeroParte
                ? item.numeroParte
                : "S/N"} | {formatFechaMesAnio(item.ultimaCompra)}
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
        </div>
      </button>
    {/each}
  </div>
</div>

<ProductoDetalleModal bind:showModal producto={selProd} />

<!-- Carrito flotante estilo original -->
{#if listaCarrito.length > 0}
  <div class="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
    {#if mostrarResumen}
      <div
        class="w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden mb-2"
      >
        <div
          class="p-5 bg-[#3d3b3e] flex justify-between items-center text-[#ffd312]"
        >
          <span class="text-[10px] font-black uppercase tracking-widest"
            >Cotización</span
          >
          <button
            on:click={() => {
              localStorage.removeItem("cotizacion_ofit");
              cargarCarrito();
            }}
            class="text-[10px] font-black uppercase text-white/70 hover:text-white"
            >limpiar</button
          >
        </div>
        <div class="max-h-64 overflow-y-auto p-4 space-y-3">
          {#each listaCarrito as item}
            <div
              class="flex justify-between items-center gap-2 pb-2 border-b border-slate-50"
            >
              <button
                type="button"
                on:click={() => {
                  selProd = { ...item };
                  showModal = true;
                }}
                class="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2 active:scale-90 transition-all border border-slate-100"
              >
                <img
                  src={getImageUrl(item.id, "thumb")}
                  alt=""
                  class="max-h-full object-contain"
                  loading="lazy"
                  decoding="async"
                  width="64"
                  height="64"
                />
              </button>
              <div class="flex-1 flex flex-col">
                <span class="text-[8px] font-black uppercase"
                  >COD: {item.id}
                </span>
                <span class="text-[11px] font-bold leading-tight"
                  >{item.modelo}</span
                >
                {#if item.cantidad > 1}
                  <span class="text-[10px] font-black text-slate-400 uppercase"
                    >{GTQ.format(item.precio)}</span
                  >
                {/if}
              </div>
              <span
                class="px-2 py-1 bg-slate-100 rounded text-[10px] font-black"
                >x {item.cantidad}</span
              >
              <span class="text-[10px] font-black text-slate-400 uppercase"
                >{GTQ.format(item.precio * item.cantidad)}</span
              >
              <button
                on:click={() => {
                  listaCarrito = listaCarrito.filter((i) => i.id !== item.id);
                  localStorage.setItem(
                    "cotizacion_ofit",
                    JSON.stringify(listaCarrito),
                  );
                }}
                class="text-red-500 font-black text-[10px]">X</button
              >
            </div>
          {/each}
          <span class="text-[10px] font-bold uppercase"
            >Total: {GTQ.format(
              listaCarrito.reduce((a, b) => a + b.precio * b.cantidad, 0),
            )}</span
          >
        </div>
        <div class="p-4 bg-slate-50">
          <button
            on:click={enviarWhatsApp}
            class="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2"
          >
            <span>📱</span> WhatsApp
          </button>
        </div>
      </div>
    {/if}
    <button
      on:click={() => (mostrarResumen = !mostrarResumen)}
      class="bg-[#3d3b3e] text-[#ffd312] h-16 w-16 rounded-full shadow-2xl border-4 border-[#ffd312] flex items-center justify-center text-xl active:scale-90 transition-all relative"
    >
      {!mostrarResumen ? "🛒" : "✕"}
      <span
        class="absolute -top-1 -right-1 bg-[#e91b27] text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white"
      >
        {listaCarrito.length}
      </span>
    </button>
  </div>
{/if}
```

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
  @keyframes shimmer-card {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  .animate-shimmer-card {
    animation: shimmer-card 3s infinite;
  }
</style>
