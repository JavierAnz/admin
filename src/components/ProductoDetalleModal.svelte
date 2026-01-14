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

  // Countdown
  let dias = 0;
  let horas = 0;
  let minutos = 0;
  let segundos = 0;
  let interval: any;
  let expirado = false;

  // Reactividad: Actualizar precio manual al abrir el producto
  $: if (producto && tipoPrecio !== "manual") {
    precioManual = producto[tipoPrecio] || 0;
  }

  function calcularTiempoRestante() {
    if (!producto?.vigencia) return;

    try {
      const ahora = new Date().getTime();
      // Usamos el constructor directo. ISO 8601 es soportado nativamente.
      const fechaVigencia = new Date(producto.vigencia).getTime();

      // Validación de seguridad
      if (isNaN(fechaVigencia)) {
        console.error(
          "Error: La vigencia no tiene un formato de fecha válido",
          producto.vigencia,
        );
        return;
      }

      const diferencia = fechaVigencia - ahora;

      if (diferencia <= 0) {
        expirado = true;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        return;
      }

      dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      horas = Math.floor(
        (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
    } catch (e) {
      console.error("Error al calcular el tiempo:", e);
    }
  }

  function agregarAlCarrito() {
    if (!producto) return;

    const precioFinal =
      tipoPrecio === "manual" ? precioManual : producto[tipoPrecio] || 0;

    const carritoActual = JSON.parse(
      localStorage.getItem("cotizacion_ofit") || "[]",
    );

    const nuevoItem = {
      id: producto.id,
      nombre: producto.nombre,
      precio: precioFinal,
      precioPublico: producto.precioP,
      precioOferta: producto.precioA,
      precioDescuento: producto.precioo,
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

  // Manejo de apertura/cierre del modal y el contador
  $: if (showModal && producto) {
    $scale = 1;
    if (typeof document !== "undefined")
      document.body.style.overflow = "hidden";

    // Reset de estados
    tipoPrecio = "precioA";
    precioManual = producto.precioA || 0;
    expirado = false;

    // Limpiar intervalo anterior
    if (interval) clearInterval(interval);

    // Verificación rigurosa: precioo como número y existencia de vigencia
    const tieneOfertaValida = Number(producto.precioo) > 0;

    if (tieneOfertaValida && producto.vigencia) {
      calcularTiempoRestante();
      interval = setInterval(calcularTiempoRestante, 1000);
    }
  } else if (!showModal) {
    $scale = 0;
    if (typeof document !== "undefined") document.body.style.overflow = "";
    cantidad = 1;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function close() {
    showModal = false;
  }

  onMount(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
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
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden transform relative flex flex-col"
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
                >{producto.modelo || "S/M"}</span
              >
              <span
                class="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase"
                >{producto.marca || "S/M"}</span
              >
            </div>

            {#if Number(producto.precioo) > 0 && producto.vigencia && !expirado}
              <div
                class="mb-4 w-full bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-3 shadow-lg relative overflow-hidden"
              >
                <div
                  class="absolute inset-0 bg-white/10 animate-pulse-slow"
                ></div>
                <div class="relative z-10">
                  <div class="flex items-center justify-center gap-2 mb-2">
                    <span
                      class="text-white text-[10px] font-black uppercase tracking-wider"
                      >⏰ Oferta termina en:</span
                    >
                  </div>

                  <div class="flex justify-center gap-1.5">
                    {#if dias > 0}
                      <div
                        class="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[45px]"
                      >
                        <span class="text-lg font-black text-white tabular-nums"
                          >{dias.toString().padStart(2, "0")}</span
                        >
                        <span
                          class="text-[8px] font-bold text-white/80 uppercase"
                          >Días</span
                        >
                      </div>
                    {/if}

                    <div
                      class="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[45px]"
                    >
                      <span class="text-lg font-black text-white tabular-nums"
                        >{horas.toString().padStart(2, "0")}</span
                      >
                      <span class="text-[8px] font-bold text-white/80 uppercase"
                        >Hrs</span
                      >
                    </div>

                    <span
                      class="text-lg font-black text-white self-center animate-blink"
                      >:</span
                    >

                    <div
                      class="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[45px]"
                    >
                      <span class="text-lg font-black text-white tabular-nums"
                        >{minutos.toString().padStart(2, "0")}</span
                      >
                      <span class="text-[8px] font-bold text-white/80 uppercase"
                        >Min</span
                      >
                    </div>

                    <span
                      class="text-lg font-black text-white self-center animate-blink"
                      >:</span
                    >

                    <div
                      class="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[45px]"
                    >
                      <span
                        class="text-lg font-black text-white tabular-nums animate-count"
                        >{segundos.toString().padStart(2, "0")}</span
                      >
                      <span class="text-[8px] font-bold text-white/80 uppercase"
                        >Seg</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <div class="space-y-2 mb-6">
              <button
                class="w-full p-3 rounded-xl border transition-all flex justify-between items-center {tipoPrecio ===
                'precioP'
                  ? 'border-[#ffd312] bg-[#ffd312]/5 ring-2 ring-[#ffd312]'
                  : 'border-slate-100 bg-slate-50'}"
                on:click={() => (tipoPrecio = "precioP")}
              >
                <div class="flex items-center gap-3">
                  <div
                    class="h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center {tipoPrecio ===
                    'precioP'
                      ? 'border-[#ffd312]'
                      : ''}"
                  >
                    {#if tipoPrecio === "precioP"}<div
                        class="h-2 w-2 bg-[#ffd312] rounded-full"
                      ></div>{/if}
                  </div>
                  <span class="text-[9px] font-bold text-slate-400 uppercase"
                    >{Number(producto.precioo) > 0
                      ? "Precio Anterior"
                      : "Normal"}</span
                  >
                </div>
                <span class="text-base font-bold text-slate-900"
                  >{GTQ.format(producto.precioP || 0)}</span
                >
              </button>

              <button
                class="w-full p-3 rounded-xl border transition-all flex justify-between items-center {tipoPrecio ===
                'precioA'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                  : 'border-slate-100 bg-slate-50'}"
                on:click={() => (tipoPrecio = "precioA")}
              >
                <div class="flex items-center gap-3">
                  <div
                    class="h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center {tipoPrecio ===
                    'precioA'
                      ? 'border-emerald-500'
                      : ''}"
                  >
                    {#if tipoPrecio === "precioA"}<div
                        class="h-2 w-2 bg-emerald-500 rounded-full"
                      ></div>{/if}
                  </div>

                  {#if Number(producto.precioo) > 0}
                    <span class="text-[9px] font-bold text-slate-400 uppercase"
                      >Oferta - Precio Aplica a cuotas</span
                    >
                  {:else}
                    <span class="text-[9px] font-bold text-slate-400 uppercase"
                      >Efectivo/Transferencia</span
                    >
                  {/if}
                </div>
                <span class="text-base font-black text-emerald-700"
                  >{GTQ.format(producto.precioA || 0)}</span
                >
              </button>

              {#if Number(producto.precioo) > 0}
                <button
                  class="w-full p-4 rounded-xl border-2 transition-all flex justify-between items-center relative overflow-hidden {tipoPrecio ===
                  'precioo'
                    ? 'border-red-500 bg-gradient-to-r from-red-500 to-orange-500 ring-4 ring-red-300 shadow-lg shadow-red-500/50'
                    : 'border-red-400 bg-gradient-to-r from-red-50 to-orange-50'}"
                  on:click={() => (tipoPrecio = "precioo")}
                >
                  <div class="flex items-center gap-3 relative z-10">
                    <div
                      class="h-5 w-5 rounded-full border-2 flex items-center justify-center {tipoPrecio ===
                      'precioo'
                        ? 'border-white bg-white'
                        : 'border-red-500 bg-red-100'}"
                    >
                      {#if tipoPrecio === "precioo"}<div
                          class="h-2.5 w-2.5 bg-red-600 rounded-full"
                        ></div>{/if}
                    </div>
                    <span
                      class="text-xs font-black uppercase {tipoPrecio ===
                      'precioo'
                        ? 'text-white'
                        : 'text-red-600'}">🔥 OFERTA</span
                    >
                  </div>
                  <div class="flex flex-col items-end relative z-10">
                    <span
                      class="text-xl font-black {tipoPrecio === 'precioo'
                        ? 'text-white'
                        : 'text-red-600'}"
                      >{GTQ.format(producto.precioo || 0)}</span
                    >
                  </div></button
                >
              {/if}

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
                      >Personalizado</span
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
                      class="w-[120px] pl-8 pr-4 py-2 bg-white border border-blue-200 rounded-lg text-lg font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-400"
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

<style>
  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0.3;
    }
  }
  @keyframes pulse-slow {
    0%,
    100% {
      opacity: 0.1;
    }
    50% {
      opacity: 0.2;
    }
  }
  @keyframes count {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
  .animate-blink {
    animation: blink 1s infinite;
  }
  .animate-pulse-slow {
    animation: pulse-slow 2s infinite;
  }
  .animate-count {
    animation: count 1s infinite;
  }
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
</style>
