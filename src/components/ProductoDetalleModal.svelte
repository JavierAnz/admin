<script lang="ts">
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { onMount, onDestroy } from "svelte";

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
  let tipoPrecio = "precioA";
  let precioManual = 0;

  // Countdown states
  let dias = 0,
    horas = 0,
    minutos = 0,
    segundos = 0;
  let interval: any = null;
  let expirado = false;
  let imagenAmpliada = false;

  function stopCounter() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function handleImageError(e: Event) {
    const target = e.currentTarget as HTMLImageElement;
    target.src = "/favicon.svg";
  }

  function calcularTiempoRestante() {
    if (!producto?.vigencia) return;

    const ahora = new Date().getTime();
    const fechaVigencia = new Date(producto.vigencia).getTime();

    if (isNaN(fechaVigencia)) return;

    const diferencia = fechaVigencia - ahora;

    if (diferencia <= 0) {
      expirado = true;
      stopCounter();
      return;
    }

    expirado = false;
    dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
  }

  $: if (producto && tipoPrecio !== "manual") {
    precioManual = producto[tipoPrecio] || 0;
  }

  $: if (showModal && producto?.id) {
    $scale = 1;
    if (typeof document !== "undefined")
      document.body.style.overflow = "hidden";

    tipoPrecio = "precioA";
    precioManual = producto.precioA || 0;
    expirado = false;
    imagenAmpliada = false;

    stopCounter();

    const tieneOfertaValida = Number(producto.precioo) > 0;
    if (tieneOfertaValida && producto.vigencia) {
      calcularTiempoRestante();
      interval = setInterval(calcularTiempoRestante, 1000);
    }
  } else if (!showModal) {
    $scale = 0;
    if (typeof document !== "undefined") document.body.style.overflow = "";
    cantidad = 1;
    stopCounter();
  }

  function close() {
    showModal = false;
  }

  function agregarAlCarrito() {
    if (!producto) return;

    const precioFinal =
      tipoPrecio === "manual" ? precioManual : producto[tipoPrecio] || 0;

    const carritoActual = JSON.parse(
      localStorage.getItem("cotizacion_ofit") || "[]",
    );

    const index = carritoActual.findIndex((i: any) => i.id === producto.id);

    if (index !== -1) {
      carritoActual[index].precio = precioFinal;
      carritoActual[index].tipoSeleccionado = tipoPrecio;
      carritoActual[index].cantidad = cantidad;

      carritoActual[index].precioOferta = producto.precioA;
      carritoActual[index].precioDescuento = producto.precioo;
    } else {
      const nuevoItem = {
        id: producto.id,
        nombre: producto.nombre,
        precio: precioFinal,
        precioPublico: producto.precioP,
        precioOferta: producto.precioA,
        precioDescuento: producto.precioo,
        vigencia: producto.vigencia,
        tipoSeleccionado: tipoPrecio,
        modelo: producto.modelo,
        marca: producto.marca,
        cantidad: cantidad,
        origen: producto.origen || "PROPIO",
      };
      carritoActual.push(nuevoItem);
    }

    localStorage.setItem("cotizacion_ofit", JSON.stringify(carritoActual));
    window.dispatchEvent(new CustomEvent("carrito-actualizado"));
    close();
  }

  onMount(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  });

  onDestroy(stopCounter);
</script>

{#if showModal && producto}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    on:click={close}
    on:keydown={(e) => e.key === "Escape" && close()}
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="modal-container"
      role="document"
      on:click|stopPropagation
      style="transform: scale({$scale})"
    >
      <button
        on:click={close}
        class="modal-close-btn text-lg"
        aria-label="Cerrar modal">×</button
      >

      <div class="modal-content">
        <div class="p-4 pb-6">
          <button type="button" class="imagen-container w-full border-0">
            <img
              on:click={() => (imagenAmpliada = !imagenAmpliada)}
              src={`/api/producto-imagen/${producto.id}`}
              alt={producto.nombre}
              class="imagen-producto"
              on:error={handleImageError}
            />
          </button>

          <div class="flex flex-col">
            <h2 class="text-sm font-black text-slate-800 mb-3">
              {producto.nombre}
            </h2>

            <div class="flex flex-wrap gap-1.5 mb-3">
              <span
                class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase"
              >
                ID: {producto.id}
              </span>
              <span
                class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase"
              >
                {producto.modelo || "S/M"}
              </span>
              <span
                class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase"
              >
                {producto.marca || "S/M"}
              </span>
            </div>

            <div class="space-y-1.5 mb-3">
              <button
                type="button"
                class="w-full p-2.5 rounded-lg border flex justify-between items-center {tipoPrecio ===
                'precioP'
                  ? 'border-[#ffd312] bg-[#ffd312]/5 ring-1 ring-[#ffd312]'
                  : 'border-slate-200 bg-slate-50'}"
                on:click={() => (tipoPrecio = "precioP")}
              >
                <span class="text-[9px] font-bold text-slate-400 uppercase">
                  {Number(producto.precioo) > 0 ? "Normal" : "P. Público"}
                </span>
                <span class="text-sm font-bold text-slate-900">
                  {GTQ.format(producto.precioP || 0)}
                </span>
              </button>

              <button
                type="button"
                class="w-full p-2.5 rounded-lg border flex justify-between items-center {tipoPrecio ===
                'precioA'
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                  : 'border-slate-200 bg-slate-50'}"
                on:click={() => (tipoPrecio = "precioA")}
              >
                <span class="text-[9px] font-bold text-slate-400 uppercase"
                  >Efectivo/Transfer</span
                >
                <span class="text-sm font-black text-emerald-700">
                  {GTQ.format(producto.precioA || 0)}
                </span>
              </button>

              {#if Number(producto.precioo) > 0}
                <button
                  type="button"
                  class="w-full p-2.5 rounded-lg border-2 flex justify-between items-center {tipoPrecio ===
                  'precioo'
                    ? 'border-red-500 bg-gradient-to-r from-red-500 to-orange-500 ring-2 ring-red-300 shadow-md text-white'
                    : 'border-red-400 bg-red-50 text-red-600'}"
                  on:click={() => (tipoPrecio = "precioo")}
                >
                  <span class="text-[10px] font-black uppercase">🔥 OFERTA</span
                  >
                  <span class="text-base font-black">
                    {GTQ.format(producto.precioo || 0)}
                  </span>
                </button>
              {/if}
            </div>

            {#if Number(producto.precioo) > 0 && producto.vigencia && !expirado}
              <div
                class="w-full bg-gradient-to-r from-red-600 to-orange-500 rounded-lg p-2 shadow-inner mb-3 flex items-center justify-center gap-2"
              >
                <span
                  class="text-white text-[9px] font-bold uppercase tracking-tighter"
                  >Termina en:</span
                >
                <div class="flex gap-1 items-center">
                  {#if dias > 0}
                    <div
                      class="bg-black/20 px-1.5 py-0.5 rounded text-white text-xs font-black tabular-nums"
                    >
                      {dias}d
                    </div>
                  {/if}
                  <div
                    class="bg-black/20 px-1.5 py-0.5 rounded text-white text-xs font-black tabular-nums"
                  >
                    {horas.toString().padStart(2, "0")}:{minutos
                      .toString()
                      .padStart(2, "0")}:<span
                      class="animate-count inline-block"
                      >{segundos.toString().padStart(2, "0")}</span
                    >
                  </div>
                </div>
              </div>
            {/if}

            <div class="border-t border-slate-100 pt-3">
              <h3
                class="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Stock
                por Agencia
              </h3>
              {#if loadingExistencias}
                <div class="animate-pulse h-8 bg-slate-100 rounded-lg"></div>
              {:else if existenciasPorSucursal.length > 0}
                <div class="grid grid-cols-2 gap-1.5">
                  {#each existenciasPorSucursal as suc}
                    <div
                      class="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-lg shadow-sm"
                    >
                      <span
                        class="text-[9px] font-bold text-slate-600 uppercase truncate"
                        >{suc.ubicacion}</span
                      >
                      <span class="text-xs font-black text-blue-700"
                        >{Math.floor(suc.existencia)}</span
                      >
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-center text-slate-400 italic text-[10px] py-2">
                  Sin existencias registradas.
                </p>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="flex gap-2 p-2 bg-slate-900 rounded-xl">
          <div class="flex flex-col items-center px-2">
            <span class="text-[8px] text-white/50 font-bold uppercase mb-0.5"
              >Cant.</span
            >
            <input
              type="number"
              bind:value={cantidad}
              min="1"
              class="w-12 bg-white/10 text-white font-black text-center rounded-lg py-1.5 text-sm outline-none"
            />
          </div>
          <button
            type="button"
            on:click={agregarAlCarrito}
            class="flex-1 bg-[#ffd312] text-[#3d3b3e] font-black uppercase text-[10px] py-2.5 rounded-lg active:scale-95 transition-transform"
          >
            Agregar a Cotización
          </button>
        </div>
      </div>
    </div>
  </div>

  {#if imagenAmpliada}
    <div
      class="imagen-overlay"
      role="button"
      tabindex="0"
      on:click={() => (imagenAmpliada = false)}
      on:keydown={(e) => e.key === "Escape" && (imagenAmpliada = false)}
    >
      <img
        src={`/api/producto-imagen/${producto.id}`}
        alt={producto.nombre}
        class="imagen-ampliada"
        on:error={handleImageError}
      />
    </div>
  {/if}
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal-container {
    background-color: white;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 640px) {
    .modal-container {
      height: auto;
      border-radius: 1rem;
      max-width: 42rem;
      max-height: 90vh;
    }
  }

  .modal-close-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 9999;
    background-color: rgb(198, 198, 198);
    color: rgb(100, 116, 139);
    width: 4rem;
    height: 4rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    border: none;
    cursor: pointer;
  }

  .modal-content {
    overflow-y: auto;
    flex: 1;
    overscroll-behavior: contain;
  }

  .modal-footer {
    position: sticky;
    bottom: 0;
    background-color: white;
    border-top: 1px solid rgb(241, 245, 249);
    padding: 0.75rem;
  }

  .animate-count {
    animation: count 1s infinite;
  }

  @keyframes count {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  .imagen-container {
    background-color: rgb(248, 250, 252);
    border-radius: 0.75rem;
    padding: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 9rem;
    margin-bottom: 0.75rem;
    cursor: zoom-in;
  }

  .imagen-producto {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
  }

  .imagen-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background-color: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: zoom-out;
  }

  .imagen-ampliada {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }
</style>
