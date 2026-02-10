<script lang="ts">
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { BRAND_CONFIG } from "../brand/brand";

  export let showModal = false;
  export let producto: any = null;

  const GTQ = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  });
  const scale = tweened(0, { duration: 250, easing: cubicOut });

  let cantidad = 1;
  let tipoPrecio = "precioa";
  let costoVisible = false;

  // Existencias state
  let existenciasPorSucursal: any[] = [];
  let loadingExistencias = false;

  // Manual price state
  let usarPrecioManual = false;
  let precioManual = 0;
  let errorPrecioManual = "";

  $: if (showModal && producto) {
    $scale = 1;
    costoVisible = false;
    tipoPrecio = "precioa";
    usarPrecioManual = false;
    precioManual = producto.precioa || 0;
    errorPrecioManual = "";
    document.body.style.overflow = "hidden";
    cargarExistencias();
  } else {
    $scale = 0;
    existenciasPorSucursal = [];
    if (typeof document !== "undefined") document.body.style.overflow = "";
  }

  async function cargarExistencias() {
    if (!producto?.id) return;
    loadingExistencias = true;
    try {
      const res = await fetch(`/api/existencias/${producto.id}`);
      if (res.ok) {
        existenciasPorSucursal = await res.json();
      }
    } catch (e) {
      console.error("Error cargando existencias:", e);
    } finally {
      loadingExistencias = false;
    }
  }

  function validarPrecioManual() {
    const minPrecio = producto?.precioa || 0;
    if (precioManual < minPrecio) {
      errorPrecioManual = `El precio debe ser mayor a ${GTQ.format(minPrecio)}`;
      return false;
    }
    errorPrecioManual = "";
    return true;
  }

  function handlePrecioManualChange() {
    if (usarPrecioManual) {
      validarPrecioManual();
    }
  }

  function close() {
    showModal = false;
  }

  function agregarAlCarrito() {
    let precioFinal: number;

    if (usarPrecioManual) {
      if (!validarPrecioManual()) return;
      precioFinal = precioManual;
    } else {
      precioFinal = producto[tipoPrecio] || 0;
    }

    const carritoActual = JSON.parse(
      localStorage.getItem("cotizacion_ofit") || "[]",
    );

    const nuevoItem = {
      id: producto.id,
      nombre: producto.nombre,
      precio: precioFinal,
      modelo: producto.modelo,
      marca: producto.marca,
      cantidad: cantidad,
      origen: producto.origen,
    };

    const index = carritoActual.findIndex((i: any) => i.id === producto.id);
    if (index !== -1) {
      carritoActual[index] = nuevoItem;
    } else {
      carritoActual.push(nuevoItem);
    }

    localStorage.setItem("cotizacion_ofit", JSON.stringify(carritoActual));
    window.dispatchEvent(new CustomEvent("carrito-actualizado"));
    close();
  }
</script>

{#if showModal && producto}
  <div
    class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4"
    on:click={close}
  >
    <div
      class="bg-white w-full max-w-lg rounded-3xl overflow-hidden overflow-x-hidden shadow-2xl relative flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      on:click|stopPropagation
      style="transform: scale({$scale})"
    >
      <button
        on:click={close}
        class="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full font-bold text-slate-500 z-50 text-sm sm:text-base"
        >✕</button
      >

      <div class="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <!-- Imagen grande con prioridad -->
        <div
          class="w-full h-48 sm:h-64 bg-slate-50 rounded-2xl flex items-center justify-center p-4"
        >
          <img
            src={`/api/producto-imagen/${producto.id}?size=medium`}
            alt=""
            class="max-h-full object-contain"
          />
        </div>

        <!-- Info del producto compacta -->
        <div>
          <h2 class="text-sm font-black text-slate-800 leading-tight uppercase">
            {producto.nombre}
          </h2>
          <div class="flex flex-wrap gap-2 mt-2">
            <span
              class="px-2 py-1 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase"
              >SKU: {producto.id}</span
            >
            {#if producto.numeroParte}
              <span
                class="px-2 py-1 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase"
                >P/N: {producto.numeroParte}</span
              >
            {/if}
            <span
              class="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase"
              >{producto.marca}</span
            >
            <span
              class="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase"
              >{producto.modelo}</span
            >
          </div>
        </div>

        <div class="space-y-2">
          <button
            on:click={() => {
              tipoPrecio = "preciop";
              usarPrecioManual = false;
            }}
            class="w-full p-3 rounded-xl border-2 flex justify-between items-center {tipoPrecio ===
              'preciop' && !usarPrecioManual
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-slate-100'}"
          >
            <span class="text-[10px] font-black text-slate-400 uppercase"
              >Normal</span
            >
            <span class="font-black text-slate-800"
              >{GTQ.format(producto.preciop || 0)}</span
            >
          </button>

          <button
            on:click={() => {
              tipoPrecio = "precioa";
              usarPrecioManual = false;
            }}
            class="w-full p-3 rounded-xl border-2 flex justify-between items-center {tipoPrecio ===
              'precioa' && !usarPrecioManual
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-100'}"
          >
            <span class="text-[10px] font-black text-emerald-600 uppercase"
              >Efectivo/Transfer</span
            >
            <span class="font-black text-emerald-700"
              >{GTQ.format(producto.precioa || 0)}</span
            >
          </button>

          {#if producto.precioo > 0}
            <button
              on:click={() => {
                tipoPrecio = "precioo";
                usarPrecioManual = false;
              }}
              class="w-full p-3 rounded-xl border-2 flex justify-between items-center {tipoPrecio ===
                'precioo' && !usarPrecioManual
                ? 'border-red-500 bg-red-50'
                : 'border-red-100'}"
            >
              <span class="text-[10px] font-black text-red-600 uppercase"
                >🔥 Oferta</span
              >
              <span class="font-black text-red-600"
                >{GTQ.format(producto.precioo || 0)}</span
              >
            </button>
          {/if}

          <!-- Manual Price Option -->
          <button
            on:click={() => {
              usarPrecioManual = true;
            }}
            class="w-full p-3 rounded-xl border-2 flex flex-col items-start {usarPrecioManual
              ? 'border-purple-500 bg-purple-50'
              : 'border-slate-100'}"
          >
            <div class="w-full flex justify-between items-center">
              <span class="text-[10px] font-black text-purple-600 uppercase"
                >💰 Precio Manual</span
              >
              {#if usarPrecioManual}
                <span class="font-black text-purple-700"
                  >{GTQ.format(precioManual)}</span
                >
              {:else}
                <span class="text-[10px] text-slate-400"
                  >Click para ingresar</span
                >
              {/if}
            </div>
          </button>

          {#if usarPrecioManual}
            <div class="p-3 bg-purple-50 rounded-xl space-y-2">
              <label class="text-[10px] font-black text-purple-600 uppercase">
                Ingresar precio (mín: {GTQ.format(producto.precioa || 0)})
              </label>
              <input
                type="number"
                bind:value={precioManual}
                on:input={handlePrecioManualChange}
                min={producto.precioa || 0}
                step="0.01"
                class="w-full p-2 rounded-lg border-2 {errorPrecioManual
                  ? 'border-red-400'
                  : 'border-purple-200'} font-black text-lg text-center"
              />
              {#if errorPrecioManual}
                <p class="text-[10px] font-bold text-red-500">
                  {errorPrecioManual}
                </p>
              {/if}
            </div>
          {/if}
        </div>

        {#if producto.costo}
          <!-- Botón ultra discreto para ver costo -->
          <button
            on:click={() => (costoVisible = !costoVisible)}
            class="absolute bottom-20 left-3 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-300 hover:bg-slate-200 transition-opacity opacity-30 hover:opacity-100"
            title="Info"
          >
            ●
          </button>

          {#if costoVisible}
            <div
              class="absolute bottom-20 left-12 bg-slate-900/95 text-white px-3 py-2 rounded-xl text-sm font-black shadow-xl z-50"
            >
              {GTQ.format(producto.costo)}
            </div>
          {/if}
        {/if}

        <div class="pt-4 border-t border-slate-100">
          <h3 class="text-[10px] font-black text-slate-400 uppercase mb-2">
            Existencias por Sucursal
          </h3>
          {#if loadingExistencias}
            <div class="text-center py-4 text-slate-400 text-sm">
              Cargando existencias...
            </div>
          {:else if existenciasPorSucursal.length === 0}
            <div class="text-center py-4 text-slate-400 text-sm">
              Sin existencias registradas
            </div>
          {:else}
            <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {#each existenciasPorSucursal as suc}
                <div
                  class="p-2 bg-slate-50 rounded-lg flex justify-between items-center"
                >
                  <span
                    class="text-[9px] font-bold text-slate-500 uppercase truncate"
                    >{suc.ubicacion}</span
                  >
                  <span class="text-xs font-black text-blue-600"
                    >{Math.floor(suc.existencia)}</span
                  >
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="p-3 sm:p-4 bg-white border-t border-slate-100 flex gap-3">
        <input
          type="number"
          bind:value={cantidad}
          min="1"
          class="w-14 sm:w-16 bg-slate-100 rounded-xl text-center font-black py-3"
        />
        <button
          on:click={agregarAlCarrito}
          disabled={usarPrecioManual && !!errorPrecioManual}
          class="flex-1 bg-yellow-400 py-3 sm:py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-400/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar a Cotización
        </button>
      </div>
    </div>
  </div>
{/if}
