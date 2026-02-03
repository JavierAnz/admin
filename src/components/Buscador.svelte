<script lang="ts">
  import { onMount } from "svelte";
  import ProductoDetalleModal from "./ProductoDetalleModal.svelte";
  import { BRAND_CONFIG } from "../brand/brand";

  export let idAgenciaUsuario: string | null | undefined = undefined;
  export let nombreAgencia = "";
  export let userPermissions: number[] = []; // Recibidos desde Astro.locals

  const GTQ = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  });

  let busqueda = "";
  let productos: any[] = [];
  let loading = false;
  let soloMiSucursal = false;
  let timer: any;

  let filtros = {
    precio: null as "asc" | "desc" | null,
    nombre: null as "asc" | "desc" | null,
    fecha: null as "asc" | "desc" | null,
    existencia: null as "asc" | "desc" | null,
    precioo: null as "asc" | "desc" | null,
  };

  let listaCarrito: any[] = [];
  let mostrarResumen = false;

  function getImageUrl(
    productId: string | number,
    size: "thumb" | "small" | "medium" = "small",
  ) {
    return `/api/producto-imagen/${productId}?size=${size}`;
  }

  function cargarCarrito() {
    listaCarrito = JSON.parse(localStorage.getItem("cotizacion_ofit") || "[]");
  }

  onMount(() => {
    cargarCarrito();
    window.addEventListener("carrito-actualizado", cargarCarrito);
  });

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

  // Lógica de ordenamiento
  $: productosOrdenados = (() => {
    let copia = [...productos];
    if (
      !filtros.precio &&
      !filtros.nombre &&
      !filtros.fecha &&
      !filtros.existencia &&
      !filtros.precioo
    )
      return productos;

    copia.sort((a, b) => {
      if (filtros.precio) {
        const diff = (a.precioa || 0) - (b.precioa || 0);
        if (diff !== 0) return filtros.precio === "asc" ? diff : -diff;
      }
      if (filtros.nombre) {
        const diff = a.nombre.localeCompare(b.nombre);
        if (diff !== 0) return filtros.nombre === "asc" ? diff : -diff;
      }
      if (filtros.existencia) {
        const diff = a.existencia - b.existencia;
        if (diff !== 0) return filtros.existencia === "asc" ? diff : -diff;
      }
      return 0;
    });
    return copia;
  })();

  let showModal = false,
    selProd: any = null,
    branchEx: any[] = [],
    loadEx = false;

  async function openDetail(p: any) {
    mostrarResumen = false;
    // RIGOR: Aseguramos que el costo se pase a la modal si existe en el objeto p
    selProd = { ...p };
    branchEx = [];
    showModal = true;

    if (selProd.origen === "PROPIO") {
      loadEx = true;
      try {
        const res = await fetch(`/api/existencias/${selProd.id}`);
        branchEx = res.ok ? await res.json() : [];
      } catch (e) {
        branchEx = [];
      } finally {
        loadEx = false;
      }
    }
  }

  function toggleFiltro(tipo: keyof typeof filtros, direccion: "asc" | "desc") {
    filtros[tipo] = filtros[tipo] === direccion ? null : direccion;
  }
</script>

<div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-32">
  <a
    href="/api/auth/logout"
    class="fixed top-2 right-2 px-4 py-4 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase z-50 hover:bg-red-600 hover:text-white transition-all"
  >
    Cerrar Sesión ✕
  </a>

  <div
    class="sticky py-6 top-2 bg-white/95 backdrop-blur-md z-30 border-b border-gray-100"
  >
    <input
      type="text"
      bind:value={busqueda}
      on:input={handleInput}
      placeholder={BRAND_CONFIG.copy.search.placeholder}
      class="w-full p-4 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-yellow-400/30 outline-none text-lg font-black text-slate-800"
    />

    <div
      class="flex items-center gap-4 mt-3 px-4 py-2 border border-slate-100 rounded-2xl"
    >
      <button
        on:click={() => {
          soloMiSucursal = !soloMiSucursal;
          realizarBusqueda();
        }}
        class="flex items-center gap-2"
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
      {#if nombreAgencia}
        <div class="h-4 w-px bg-slate-200"></div>
        <div class="text-[10px] font-black text-slate-500 uppercase">
          {nombreAgencia}
        </div>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 gap-3">
    {#each productosOrdenados as item (item.id)}
      <button
        type="button"
        on:click={() => openDetail(item)}
        class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-yellow-400 transition-all text-left w-full flex items-center gap-4 relative overflow-hidden"
      >
        <div
          class="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2"
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
          <h4 class="text-sm font-black text-slate-800 uppercase truncate">
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
            {Math.floor(item.existencia)} UND
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>

<ProductoDetalleModal
  bind:showModal
  producto={selProd}
  existenciasPorSucursal={branchEx}
  loadingExistencias={loadEx}
/>
