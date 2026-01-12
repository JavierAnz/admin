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
  let tipoPrecio = "precioa"; // 'preciop', 'precioa' o 'manual'
  let precioManual = 0;

  // Reactividad: Actualizar precio manual al abrir el producto
  $: if (producto && tipoPrecio !== "manual") {
    precioManual = producto[tipoPrecio];
  }

  function agregarAlCarrito() {
    if (!producto) return;

    // Determinamos qué valor usar según la selección
    const precioFinal =
      tipoPrecio === "manual" ? precioManual : producto[tipoPrecio];

    const carritoActual = JSON.parse(
      localStorage.getItem("cotizacion_ofit") || "[]",
    );

    const nuevoItem = {
      id: producto.id,
      nombre: producto.nombre,
      precio: precioFinal,
      precioOriginal: producto.preciop,
      precioOferta: producto.precioa,
      tipoSeleccionado: tipoPrecio,
      modelo: producto.modelo,
      marca: producto.marca,
      cantidad: cantidad,
    };

    const index = carritoActual.findIndex(
      (i: any) => i.id === producto.id && i.precio === precioFinal,
    );

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
    // Reset de valores al abrir
    tipoPrecio = "precioa";
    if (producto) precioManual = producto.precioa;
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
  <div
    class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:keydown={(e) => e.key === "Escape" && close()}
    on:click={close}
  >
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden transform relative flex flex-col"
      role="document"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="0"
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
            <h2
              class="text-xl font-black text-slate-800 leading-tight mb-2 pr-10"
            >
              {producto.nombre}
            </h2>

            <div class="flex flex-wrap gap-2 mb-4">
              <span
                class="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase"
                >ID: {producto.id}</span
              >
              <span
                class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase"
                >{producto.modelo}</span
              >
            </div>

            <div class="space-y-2 mb-6">
              <p
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"
              >
                Seleccionar Precio:
              </p>

              <button
                class="w-full p-3 rounded-xl border transition-all flex justify-between items-center {tipoPrecio ===
                'preciop'
                  ? 'border-[#ffd312] bg-[#ffd312]/5 ring-2 ring-[#ffd312]'
                  : 'border-slate-100 bg-slate-50'}"
                on:click={() => (tipoPrecio = "preciop")}
              >
                <div class="flex items-center gap-3">
                  <div
                    class="h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center {tipoPrecio ===
                    'preciop'
                      ? 'border-[#ffd312]'
                      : ''}"
                  >
                    {#if tipoPrecio === "preciop"}<div
                        class="h-2 w-2 bg-[#ffd312] rounded-full"
                      ></div>{/if}
                  </div>
                  <span class="text-[9px] font-black text-slate-400 uppercase"
                    >Normal</span
                  >
                </div>
                <span class="text-base font-bold text-slate-900"
                  >{GTQ.format(producto.preciop)}</span
                >
              </button>

              <button
                class="w-full p-3 rounded-xl border transition-all flex justify-between items-center {tipoPrecio ===
                'precioa'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                  : 'border-slate-100 bg-slate-50'}"
                on:click={() => (tipoPrecio = "precioa")}
              >
                <div class="flex items-center gap-3">
                  <div
                    class="h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center {tipoPrecio ===
                    'precioa'
                      ? 'border-emerald-500'
                      : ''}"
                  >
                    {#if tipoPrecio === "precioa"}<div
                        class="h-2 w-2 bg-emerald-500 rounded-full"
                      ></div>{/if}
                  </div>
                  <span class="text-[9px] font-black text-emerald-500 uppercase"
                    >Efectivo</span
                  >
                </div>
                <span class="text-base font-black text-emerald-700"
                  >{GTQ.format(producto.precioa)}</span
                >
              </button>

              <div
                class="p-3 rounded-xl border transition-all {tipoPrecio ===
                'manual'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-slate-100 bg-slate-50'}"
              >
                <button
                  class="w-full flex justify-between items-center mb-2"
                  on:click={() => (tipoPrecio = "manual")}
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center {tipoPrecio ===
                      'manual'
                        ? 'border-blue-500'
                        : ''}"
                    >
                      {#if tipoPrecio === "manual"}<div
                          class="h-2 w-2 bg-blue-500 rounded-full"
                        ></div>{/if}
                    </div>
                    <span class="text-[9px] font-black text-blue-500 uppercase"
                      >P</span
                    >
                  </div>
                </button>
                {#if tipoPrecio === "manual"}
                  <div class="relative mt-2">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold"
                      >Q</span
                    >
                    <input
                      type="number"
                      bind:value={precioManual}
                      class="w-20 pl-8 pr-4 py-2 bg-white border border-blue-200 rounded-lg text-lg font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="0.00"
                    />
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex gap-2 p-2 bg-slate-900 rounded-2xl">
              <div class="flex flex-col items-center px-2">
                <span class="text-[8px] text-white/50 font-bold uppercase mb-1"
                  >Cant.</span
                >
                <input
                  type="number"
                  bind:value={cantidad}
                  min="1"
                  class="w-14 bg-white/10 text-white font-black text-center rounded-xl outline-none py-1"
                />
              </div>
              <button
                on:click={agregarAlCarrito}
                class="flex-1 bg-[#ffd312] text-[#3d3b3e] font-black uppercase text-[10px] py-4 rounded-xl tracking-widest hover:bg-white transition-colors"
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
            <span class="w-2 h-2 bg-blue-500 rounded-full"></span> Stock por Agencia
          </h3>
          {#if loadingExistencias}
            <div class="animate-pulse h-10 bg-slate-100 rounded-xl"></div>
          {:else if existenciasPorSucursal.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each existenciasPorSucursal as suc}
                <div
                  class="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                >
                  <span class="text-[11px] font-bold text-slate-600 uppercase"
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
