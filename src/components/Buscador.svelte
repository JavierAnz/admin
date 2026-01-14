<script lang="ts">
  import { onMount } from "svelte";
  import ProductoDetalleModal from "./ProductoDetalleModal.svelte";
  import Analytics from "@vercel/analytics/astro";

  export let idAgenciaUsuario: string | null | undefined = undefined;
  export let nombreAgencia = "";
  $: ubicacion = idAgenciaUsuario;

  const GTQ = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  });

  let busqueda = "";
  let productos: any[] = [];
  let loading = false;
  let soloMiSucursal = false;
  let timer: any;

  // NUEVA LÓGICA DE FILTROS MEZCLABLES
  let filtros = {
    precio: null as "asc" | "desc" | null,
    nombre: null as "asc" | "desc" | null,
    fecha: null as "asc" | "desc" | null,
  };

  let listaCarrito: any[] = [];
  let mostrarResumen = false;

  function cargarCarrito() {
    listaCarrito = JSON.parse(localStorage.getItem("cotizacion_ofit") || "[]");
  }

  onMount(() => {
    cargarCarrito();
    window.addEventListener("carrito-actualizado", cargarCarrito);
  });

  // GESTOR DE FILTROS: Valida que no se contradigan
  function toggleFiltro(tipo: keyof typeof filtros, direccion: "asc" | "desc") {
    if (filtros[tipo] === direccion) {
      filtros[tipo] = null; // Desactiva si ya estaba seleccionado
    } else {
      filtros[tipo] = direccion; // Activa y sobrescribe la dirección opuesta
    }
  }

  function limpiarFiltros() {
    filtros = { precio: null, nombre: null, fecha: null };
  }

  $: productosOrdenados = (() => {
    let copia = [...productos];

    // Si no hay filtros activos, retornar lista original
    if (!filtros.precio && !filtros.nombre && !filtros.fecha) return productos;

    copia.sort((a, b) => {
      // 1. Prioridad: Precio
      if (filtros.precio) {
        const diff = (a.precioA || 0) - (b.precioA || 0);
        if (diff !== 0) return filtros.precio === "asc" ? diff : -diff;
      }

      // 2. Prioridad: Fecha (Ingreso)
      if (filtros.fecha) {
        const dateA = new Date(a.ultimaCompra || 0).getTime();
        const dateB = new Date(b.ultimaCompra || 0).getTime();
        const diff = dateA - dateB;
        if (diff !== 0) return filtros.fecha === "asc" ? diff : -diff;
      }

      // 3. Prioridad: Nombre (A-Z)
      if (filtros.nombre) {
        const diff = a.nombre.localeCompare(b.nombre);
        if (diff !== 0) return filtros.nombre === "asc" ? diff : -diff;
      }

      return 0;
    });

    return copia;
  })();

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
      console.error("Error en la búsqueda:", error);
      productos = [];
    } finally {
      loading = false;
    }
  }

  function handleInput() {
    clearTimeout(timer);
    timer = setTimeout(realizarBusqueda, 300);
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

  let showModal = false,
    selProd: any = null,
    branchEx: any[] = [],
    loadEx = false;

  async function openDetail(p: any) {
    selProd = p;
    showModal = true;

    if (p.origen === "PROPIO") {
      loadEx = true;
      const res = await fetch(`/api/existencias/${p.id}`);
      branchEx = res.ok ? await res.json() : [];
      loadEx = false;
    } else {
      branchEx = [];
    }
  }
</script>

<div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-32">
  <div class="flex items-center gap-2">
    <a
      href="/api/auth/logout"
      class="fixed top-2 right-2 flex items-center gap-2 px-4 py-4 bg-red-50 text-[#e91b27] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e91b27] hover:text-white transition-all active:scale-95"
    >
      <span>Cerrar Sesión</span>
      <span class="text-xs">✕</span>
    </a>
  </div>

  <div
    class="sticky py-10 top-2 bg-white/95 backdrop-blur-md z-30 pb-4 border-b border-gray-100"
  >
    <input
      type="text"
      bind:value={busqueda}
      on:input={handleInput}
      placeholder="Buscar: jbl bocina 120..."
      class="w-full p-2 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-[#ffd312]/30 outline-none text-lg font-black text-[#3d3b3e]"
    />

    <div
      class="flex items-center gap-4 mt-3 px-9 border border-slate-100 rounded-2xl p-2"
    >
      <button
        on:click={() => {
          soloMiSucursal = !soloMiSucursal;
          realizarBusqueda();
        }}
        class="flex items-center gap-2 text-[7px] font-black uppercase transition-colors {soloMiSucursal
          ? 'text-green-600'
          : 'text-slate-400'}"
        type="button"
      >
        <div
          class="h-5 w-10 rounded-full relative transition-all duration-300 {soloMiSucursal
            ? 'bg-green-500'
            : 'bg-slate-300'}"
        >
          <div
            class="h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md {soloMiSucursal
              ? 'left-5'
              : 'left-0.5'}"
          ></div>
        </div>
        <span>Mi Sucursal</span>
      </button>

      {#if nombreAgencia}
        <div class="h-6 w-px bg-slate-200"></div>
        <div class="text-xs font-black text-slate-500 uppercase">
          {nombreAgencia}
        </div>
      {/if}
    </div>

    {#if productos.length > 0}
      <div class="mt-3 flex items-center gap-2 flex-wrap">
        <span
          class="text-[10px] font-black text-slate-400 uppercase tracking-wider"
          >Ordenar:</span
        >

        <button
          on:click={limpiarFiltros}
          class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all
          {Object.values(filtros).every((v) => v === null)
            ? 'bg-[#3d3b3e] text-[#ffd312]'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}"
        >
          Predeterminado
        </button>

        <button
          on:click={() => toggleFiltro("precio", "asc")}
          class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all
          {filtros.precio === 'asc'
            ? 'bg-[#3d3b3e] text-[#ffd312]'
            : 'bg-slate-100 text-slate-500'}"
        >
          Precio ↑
        </button>
        <button
          on:click={() => toggleFiltro("precio", "desc")}
          class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all
          {filtros.precio === 'desc'
            ? 'bg-[#3d3b3e] text-[#ffd312]'
            : 'bg-slate-100 text-slate-500'}"
        >
          Precio ↓
        </button>

        <button
          on:click={() => toggleFiltro("fecha", "desc")}
          class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all
          {filtros.fecha === 'desc'
            ? 'bg-[#3d3b3e] text-[#ffd312]'
            : 'bg-slate-100 text-slate-500'}"
        >
          Más Reciente
        </button>
        <button
          on:click={() => toggleFiltro("fecha", "asc")}
          class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all
          {filtros.fecha === 'asc'
            ? 'bg-[#3d3b3e] text-[#ffd312]'
            : 'bg-slate-100 text-slate-500'}"
        >
          Más Antiguo
        </button>

        <button
          on:click={() => toggleFiltro("nombre", "asc")}
          class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all
          {filtros.nombre === 'asc'
            ? 'bg-[#3d3b3e] text-[#ffd312]'
            : 'bg-slate-100 text-slate-500'}"
        >
          A-Z
        </button>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 gap-3">
    {#each productosOrdenados as item}
      <button
        type="button"
        class="bg-white p-4 rounded-2xl border transition-all cursor-pointer active:scale-95 text-left w-full relative overflow-hidden {item.precioo >
        0
          ? 'border-2 border-red-400 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30'
          : 'border border-slate-100 shadow-sm hover:border-[#ffd312]'}"
        on:click={() => openDetail(item)}
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
            class="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2"
          >
            <img
              src={item.imagenUrl || `/api/producto-imagen/${item.id}`}
              alt=""
              class="max-h-full object-contain"
              on:error={(e) =>
                ((e.currentTarget as HTMLImageElement).src =
                  "/placeholder-image.png")}
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-[10px] font-black text-slate-400 uppercase">
                {item.modelo || "S/M"}
              </h3>
              {#if item.origen === "EXTERNO"}
                <span
                  class="bg-blue-100 text-blue-600 text-[8px] px-1.5 py-0.5 rounded-md font-black"
                  >Bajo pedido</span
                >
              {/if}
            </div>
            <h4
              class="text-sm font-black text-slate-800 uppercase truncate leading-tight"
            >
              {item.nombre}
            </h4>
            <p
              class="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter"
            >
              {item.marca} | ID: {item.id} |

              {#if item.ultimaCompra}
                <div class="mb-3 flex items-center gap-2 flex-wrap">
                  <span
                    class="text-[9px] font-black text-slate-400 uppercase tracking-wider"
                    >Último Ingreso:</span
                  >
                  <span
                    class="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
                  >
                    {new Date(item.ultimaCompra).toLocaleDateString("es-GT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              {/if}
            </p>
          </div>
          <div class="text-right">
            <div class="text-sm font-black text-slate-900 leading-none">
              {GTQ.format(item.precioP || 0)}
            </div>
            <div
              class="text-[10px] font-black mt-1 {item.existencia > 0
                ? 'text-blue-600'
                : 'text-red-300'} uppercase"
            >
              {Math.floor(item.existencia)} UND
            </div>
          </div>
        </div>
      </button>
    {/each}

    {#if busqueda.length >= 2 && productos.length === 0 && !loading}
      <div
        class="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"
      >
        <p class="text-slate-500 font-black uppercase text-xs tracking-widest">
          No se encontraron resultados.
        </p>
      </div>
    {/if}
  </div>

  {#if listaCarrito.length > 0}
    <div class="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {#if mostrarResumen}
        <div
          class="w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden mb-2 animate-in fade-in slide-in-from-bottom-4"
        >
          <div class="p-5 bg-[#3d3b3e] flex justify-between items-center">
            <span
              class="text-[10px] font-black uppercase text-[#ffd312] tracking-widest"
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
                <span
                  class="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2"
                >
                  <img
                    src={item.imagenUrl || `/api/producto-imagen/${item.id}`}
                    alt=""
                    class="max-h-full object-contain"
                  />
                </span>
                <div class="flex-1 flex flex-col">
                  <span class="text-[8px] font-black uppercase"
                    >COD: {item.id}</span
                  >
                  <span class="text-[11px] font-bold leading-tight"
                    >{item.modelo}</span
                  >
                  {#if item.cantidad > 1}
                    <span
                      class="text-[10px] font-black text-slate-400 uppercase"
                    >
                      {GTQ.format(item.precio)}</span
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
</div>

<ProductoDetalleModal
  bind:showModal
  producto={selProd}
  existenciasPorSucursal={branchEx}
  loadingExistencias={loadEx}
/>

<style>
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
