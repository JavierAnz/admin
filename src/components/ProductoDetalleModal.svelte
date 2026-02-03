<script lang="ts">
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { BRAND_CONFIG } from "../brand/brand";

  export let showModal = false;
  export let producto: any = null;
  export let existenciasPorSucursal: any[] = [];
  export let loadingExistencias = false;

  const GTQ = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  });
  const scale = tweened(0, { duration: 250, easing: cubicOut });

  let cantidad = 1;
  let tipoPrecio = "precioa";
  let costoVisible = false; // Máscara de privacidad

  $: if (showModal && producto) {
    $scale = 1;
    costoVisible = false; // Siempre oculto al abrir
    tipoPrecio = "precioa";
    document.body.style.overflow = "hidden";
  } else {
    $scale = 0;
    if (typeof document !== "undefined") document.body.style.overflow = "";
  }

  function close() {
    showModal = false;
  }

  function agregarAlCarrito() {
    const precioFinal = producto[tipoPrecio] || 0;
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
    class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    on:click={close}
  >
    <div
      class="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      on:click|stopPropagation
      style="transform: scale({$scale})"
    >
      <button
        on:click={close}
        class="absolute top-4 right-4 w-10 h-10 bg-slate-100 rounded-full font-bold text-slate-500 z-50"
        >✕</button
      >

      <div class="overflow-y-auto p-6 space-y-6">
        <div
          class="w-full h-48 bg-slate-50 rounded-2xl flex items-center justify-center p-4"
        >
          <img
            src={`/api/producto-imagen/${producto.id}?size=medium`}
            alt=""
            class="max-h-full object-contain"
          />
        </div>

        <div>
          <h2 class="text-lg font-black text-slate-800 leading-tight uppercase">
            {producto.nombre}
          </h2>
          <div class="flex gap-2 mt-2">
            <span
              class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase"
              >{producto.marca}</span
            >
            <span
              class="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase"
              >{producto.modelo}</span
            >
          </div>
        </div>

        <div class="space-y-2">
          <button
            on:click={() => (tipoPrecio = "preciop")}
            class="w-full p-3 rounded-xl border-2 flex justify-between items-center {tipoPrecio ===
            'preciop'
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-slate-100'}"
          >
            <span class="text-[10px] font-black text-slate-400 uppercase"
              >P. Público</span
            >
            <span class="font-black text-slate-800"
              >{GTQ.format(producto.preciop || 0)}</span
            >
          </button>

          <button
            on:click={() => (tipoPrecio = "precioa")}
            class="w-full p-3 rounded-xl border-2 flex justify-between items-center {tipoPrecio ===
            'precioa'
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
              on:click={() => (tipoPrecio = "precioo")}
              class="w-full p-3 rounded-xl border-2 flex justify-between items-center {tipoPrecio ===
              'precioo'
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
        </div>

        {#if producto.costo}
          <div class="p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <div class="flex justify-between items-center">
              <div>
                <p
                  class="text-[8px] font-black text-slate-500 uppercase tracking-widest"
                >
                  {BRAND_CONFIG.copy.admin.internalLabel}
                </p>
                <button
                  on:click={() => (costoVisible = !costoVisible)}
                  class="text-[10px] font-black text-blue-400 uppercase mt-1"
                >
                  {costoVisible
                    ? BRAND_CONFIG.copy.admin.hideCost
                    : BRAND_CONFIG.copy.admin.showCost}
                </button>
              </div>
              <div class="text-right">
                <p
                  class="text-lg font-black text-white transition-all duration-300 {costoVisible
                    ? 'blur-0'
                    : 'blur-md opacity-30 select-none'}"
                >
                  {GTQ.format(producto.costo)}
                </p>
              </div>
            </div>
          </div>
        {/if}

        <div class="pt-4 border-t border-slate-100">
          <h3 class="text-[10px] font-black text-slate-400 uppercase mb-2">
            Existencias
          </h3>
          <div class="grid grid-cols-2 gap-2">
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
        </div>
      </div>

      <div class="p-4 bg-white border-t border-slate-100 flex gap-3">
        <input
          type="number"
          bind:value={cantidad}
          min="1"
          class="w-16 bg-slate-100 rounded-xl text-center font-black"
        />
        <button
          on:click={agregarAlCarrito}
          class="flex-1 bg-yellow-400 py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
        >
          Agregar a Cotización
        </button>
      </div>
    </div>
  </div>
{/if}
