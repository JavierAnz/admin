<script lang="ts">
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { onMount } from "svelte";

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

  function agregarAlCarrito() {
    if (!producto) return;
    const carritoActual = JSON.parse(
      localStorage.getItem("cotizacion_ofit") || "[]",
    );
    const nuevoItem = {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.preciop,
      precioa: producto.precioa,
      modelo: producto.modelo,
      marca: producto.marca,
      cantidad: cantidad,
    };

    const index = carritoActual.findIndex((i: any) => i.id === producto.id);
    if (index !== -1) {
      carritoActual[index].cantidad += cantidad;
    } else {
      carritoActual.push(nuevoItem);
    }

    localStorage.setItem("cotizacion_ofit", JSON.stringify(carritoActual));
    window.dispatchEvent(new CustomEvent("carrito-actualizado"));
    close();
  }

  $: if (showModal) {
    $scale = 1;
    if (typeof document !== "undefined")
      document.body.style.overflow = "hidden";
  } else {
    $scale = 0;
    if (typeof document !== "undefined") document.body.style.overflow = "";
    cantidad = 1;
  }

  function close() {
    showModal = false;
  }

  onMount(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  });
</script>

{#if showModal && producto}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
    role="dialog"
    aria-modal="true"
    on:click={close}
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden transform relative flex flex-col"
      role="document"
      on:click|stopPropagation
      style="transform: scale({$scale})"
    >
      <button
        on:click={close}
        class="absolute top-4 right-4 z-[110] bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md font-bold"
        >✕</button
      >

      <div class="overflow-y-auto p-6 md:p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div
            class="bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100 h-64"
          >
            <img
              src={`/api/producto-imagen/${producto.id}`}
              alt={producto.nombre}
              class="max-h-full w-auto object-contain drop-shadow-xl"
              on:error={(e) =>
                ((e.currentTarget as HTMLImageElement).src = "/favicon.svg")}
            />
          </div>

          <div class="flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-2"></div>
            <h2
              class="text-xl font-black text-slate-800 leading-tight mb-2 pr-10"
            >
              {producto.nombre}
            </h2>
            <div class="flex flex-wrap gap-2 mb-4">
              <span
                class="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-mono font-bold rounded border uppercase"
                >ID: {producto.id}</span
              >
              <span
                class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 uppercase"
                >{producto.marca || "OFIT"}</span
              >
              <span
                class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 uppercase"
                >{producto.modelo}</span
              >
            </div>

            <div class="space-y-2 mb-4">
              <div
                class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"
              >
                <span class="text-[9px] font-black text-slate-400 uppercase"
                  >Precio Normal</span
                >
                <span class="text-lg font-bold text-slate-900"
                  >{GTQ.format(producto.preciop)}</span
                >
              </div>
              <div
                class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center"
              >
                <span class="text-[9px] font-black text-emerald-500 uppercase"
                  >Contado/Efectivo</span
                >
                <span class="text-lg font-black text-emerald-700"
                  >{GTQ.format(producto.precioa)}</span
                >
              </div>
            </div>

            <div class="flex gap-2 p-2 bg-slate-900 rounded-2xl">
              <input
                type="number"
                bind:value={cantidad}
                min="1"
                class="w-16 bg-white/10 text-white font-black text-center rounded-xl outline-none"
              />
              <button
                on:click={agregarAlCarrito}
                class="flex-1 bg-[#ffd312] text-[#3d3b3e] font-black uppercase text-[10px] py-3 rounded-xl tracking-widest hover:bg-white transition-colors"
              >
                Agregar a Cotización
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <h3
            class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
          >
            <span class="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span> Stock
            por Agencia
          </h3>
          {#if loadingExistencias}
            <div class="animate-pulse flex space-x-4 p-4">
              <div class="flex-1 space-y-4 py-1">
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          {:else if existenciasPorSucursal.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each existenciasPorSucursal as suc}
                <div
                  class="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                >
                  <span
                    class="text-[11px] font-bold text-slate-600 uppercase tracking-tighter"
                    >{suc.ubicacion}</span
                  >
                  <span class="text-sm font-black text-blue-700"
                    >{Math.floor(suc.existencia)}</span
                  >
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-center text-slate-400 italic text-xs py-4">
              Sin existencias registradas.
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
