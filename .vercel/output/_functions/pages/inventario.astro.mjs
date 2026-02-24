import { e as createComponent, f as createAstro, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_jlQkI_Ol.mjs';
import { $ as $$Layout } from '../chunks/Layout_Dh2gxDSb.mjs';
import { $ as $$AdminNavbar } from '../chunks/AdminNavbar_BNY3_Nzf.mjs';
import { n as noop, f as fallback, s as store_set, b as attr_style, c as attr, e as escape_html, d as stringify, g as store_get, a as attr_class, h as ensure_array_like, u as unsubscribe_stores, i as bind_props } from '../chunks/_@astro-renderers_BGseE2UE.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_BGseE2UE.mjs';
import { B as BRAND_CONFIG } from '../chunks/brand_DjbZtpcq.mjs';
/* empty css                                      */
import sql from 'mssql';

/** @import { Equals } from '#client' */


/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function safe_not_equal(a, b) {
	return a != a
		? b == b
		: a !== b || (a !== null && typeof a === 'object') || typeof a === 'function';
}

/** @import { Raf } from '#client' */

const now = () => Date.now();

/** @type {Raf} */
const raf = {
	// don't access requestAnimationFrame eagerly outside method
	// this allows basic testing of user code without JSDOM
	// bunder will eval and remove ternary when the user's app is built
	tick: /** @param {any} _ */ (_) => (noop)(),
	now: () => now(),
	tasks: new Set()
};

/** @import { TaskCallback, Task, TaskEntry } from '#client' */

/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 * @param {TaskCallback} callback
 * @returns {Task}
 */
function loop(callback) {
	/** @type {TaskEntry} */
	let task;

	if (raf.tasks.size === 0) ;

	return {
		promise: new Promise((fulfill) => {
			raf.tasks.add((task = { c: callback, f: fulfill }));
		}),
		abort() {
			raf.tasks.delete(task);
		}
	};
}

/** @import { Readable, StartStopNotifier, Subscriber, Unsubscriber, Updater, Writable } from '../public.js' */
/** @import { Stores, StoresValues, SubscribeInvalidateTuple } from '../private.js' */

/**
 * @type {Array<SubscribeInvalidateTuple<any> | any>}
 */
const subscriber_queue = [];

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 *
 * @template T
 * @param {T} [value] initial value
 * @param {StartStopNotifier<T>} [start]
 * @returns {Writable<T>}
 */
function writable(value, start = noop) {
	/** @type {Unsubscriber | null} */
	let stop = null;

	/** @type {Set<SubscribeInvalidateTuple<T>>} */
	const subscribers = new Set();

	/**
	 * @param {T} new_value
	 * @returns {void}
	 */
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (stop) {
				// store is ready
				const run_queue = !subscriber_queue.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) {
						subscriber_queue[i][0](subscriber_queue[i + 1]);
					}
					subscriber_queue.length = 0;
				}
			}
		}
	}

	/**
	 * @param {Updater<T>} fn
	 * @returns {void}
	 */
	function update(fn) {
		set(fn(/** @type {T} */ (value)));
	}

	/**
	 * @param {Subscriber<T>} run
	 * @param {() => void} [invalidate]
	 * @returns {Unsubscriber}
	 */
	function subscribe(run, invalidate = noop) {
		/** @type {SubscribeInvalidateTuple<T>} */
		const subscriber = [run, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) {
			stop = start(set, update) || noop;
		}
		run(/** @type {T} */ (value));
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0 && stop) {
				stop();
				stop = null;
			}
		};
	}
	return { set, update, subscribe };
}

/**
 * @param {any} obj
 * @returns {obj is Date}
 */
function is_date(obj) {
	return Object.prototype.toString.call(obj) === '[object Date]';
}

/*
Adapted from https://github.com/mattdesl
Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
*/

/**
 * @param {number} t
 * @returns {number}
 */
function linear(t) {
	return t;
}

/**
 * @param {number} t
 * @returns {number}
 */
function cubicOut(t) {
	const f = t - 1.0;
	return f * f * f + 1.0;
}

/** @import { Task } from '../internal/client/types' */
/** @import { Tweened } from './public' */
/** @import { TweenedOptions } from './private' */

/**
 * @template T
 * @param {T} a
 * @param {T} b
 * @returns {(t: number) => T}
 */
function get_interpolator(a, b) {
	if (a === b || a !== a) return () => a;

	const type = typeof a;
	if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
		throw new Error('Cannot interpolate values of different type');
	}

	if (Array.isArray(a)) {
		const arr = /** @type {Array<any>} */ (b).map((bi, i) => {
			return get_interpolator(/** @type {Array<any>} */ (a)[i], bi);
		});

		// @ts-ignore
		return (t) => arr.map((fn) => fn(t));
	}

	if (type === 'object') {
		if (!a || !b) {
			throw new Error('Object cannot be null');
		}

		if (is_date(a) && is_date(b)) {
			const an = a.getTime();
			const bn = b.getTime();
			const delta = bn - an;

			// @ts-ignore
			return (t) => new Date(an + t * delta);
		}

		const keys = Object.keys(b);

		/** @type {Record<string, (t: number) => T>} */
		const interpolators = {};
		keys.forEach((key) => {
			// @ts-ignore
			interpolators[key] = get_interpolator(a[key], b[key]);
		});

		// @ts-ignore
		return (t) => {
			/** @type {Record<string, any>} */
			const result = {};
			keys.forEach((key) => {
				result[key] = interpolators[key](t);
			});
			return result;
		};
	}

	if (type === 'number') {
		const delta = /** @type {number} */ (b) - /** @type {number} */ (a);
		// @ts-ignore
		return (t) => a + t * delta;
	}

	// for non-numeric values, snap to the final value immediately
	return () => b;
}

/**
 * A tweened store in Svelte is a special type of store that provides smooth transitions between state values over time.
 *
 * @deprecated Use [`Tween`](https://svelte.dev/docs/svelte/svelte-motion#Tween) instead
 * @template T
 * @param {T} [value]
 * @param {TweenedOptions<T>} [defaults]
 * @returns {Tweened<T>}
 */
function tweened(value, defaults = {}) {
	const store = writable(value);
	/** @type {Task} */
	let task;
	let target_value = value;
	/**
	 * @param {T} new_value
	 * @param {TweenedOptions<T>} [opts]
	 */
	function set(new_value, opts) {
		target_value = new_value;

		if (value == null) {
			store.set((value = new_value));
			return Promise.resolve();
		}

		/** @type {Task | null} */
		let previous_task = task;

		let started = false;
		let {
			delay = 0,
			duration = 400,
			easing = linear,
			interpolate = get_interpolator
		} = { ...defaults, ...opts };

		if (duration === 0) {
			if (previous_task) {
				previous_task.abort();
				previous_task = null;
			}
			store.set((value = target_value));
			return Promise.resolve();
		}

		const start = raf.now() + delay;

		/** @type {(t: number) => T} */
		let fn;
		task = loop((now) => {
			if (now < start) return true;
			if (!started) {
				fn = interpolate(/** @type {any} */ (value), new_value);
				if (typeof duration === 'function')
					duration = duration(/** @type {any} */ (value), new_value);
				started = true;
			}
			if (previous_task) {
				previous_task.abort();
				previous_task = null;
			}
			const elapsed = now - start;
			if (elapsed > /** @type {number} */ (duration)) {
				store.set((value = new_value));
				return false;
			}
			// @ts-ignore
			store.set((value = fn(easing(elapsed / duration))));
			return true;
		});
		return task.promise;
	}
	return {
		set,
		update: (fn, opts) =>
			set(fn(/** @type {any} */ (target_value), /** @type {any} */ (value)), opts),
		subscribe: store.subscribe
	};
}

function ProductoDetalleModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let showModal = fallback($$props['showModal'], false);
		let producto = fallback($$props['producto'], null);
		const GTQ = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
		const scale = tweened(0, { duration: 250, easing: cubicOut });
		let cantidad = 1;
		let tipoPrecio = "precioa";
		let costoVisible = false;

		// Existencias state
		let existenciasPorSucursal = [];

		let loadingExistencias = false;

		// Manual price state
		let usarPrecioManual = false;

		let precioManual = 0;
		let errorPrecioManual = "";

		async function cargarExistencias() {
			if (!producto?.id) return;

			loadingExistencias = true;

			try {
				const res = await fetch(`/api/existencias/${producto.id}`);

				if (res.ok) {
					existenciasPorSucursal = await res.json();
				}
			} catch(e) {
				console.error("Error cargando existencias:", e);
			} finally {
				loadingExistencias = false;
			}
		}

		if (showModal && producto) {
			store_set(scale, 1);
			costoVisible = false;
			tipoPrecio = "precioa";
			usarPrecioManual = false;
			precioManual = producto.precioa || 0;
			errorPrecioManual = "";
			document.body.style.overflow = "hidden";
			cargarExistencias();
		} else {
			store_set(scale, 0);
			existenciasPorSucursal = [];

			if (typeof document !== "undefined") document.body.style.overflow = "";
		}

		if (showModal && producto) {
			$$renderer.push('<!--[-->');
			$$renderer.push(`<div class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4" role="button" tabindex="-1"><div class="bg-white w-full max-w-lg rounded-3xl overflow-hidden overflow-x-hidden shadow-2xl relative flex flex-col max-h-[95vh] sm:max-h-[90vh]" role="dialog" aria-modal="true" tabindex="-1"${attr_style(`transform: scale(${stringify(store_get($$store_subs ??= {}, '$scale', scale))})`)}><button class="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full font-bold text-slate-500 z-50 text-sm sm:text-base">✕</button> <div class="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6"><div class="w-full h-48 sm:h-64 bg-slate-50 rounded-2xl flex items-center justify-center p-4"><img${attr('src', `/api/producto-imagen/${producto.id}?size=medium`)}${attr('alt', producto.nombre)}${attr('width', BRAND_CONFIG.dimensions.thumbSize * 5)}${attr('height', BRAND_CONFIG.dimensions.modalImageHeight)} fetchpriority="high" loading="eager" class="max-h-full object-contain"/></div> <div><h2 class="text-sm font-black text-slate-800 leading-tight uppercase">${escape_html(producto.nombre)}</h2> <div class="flex flex-wrap gap-2 mt-2"><span class="px-2 py-1 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase">SKU: ${escape_html(producto.id)}</span> `);

			if (producto.numeroParte) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<span class="px-2 py-1 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase">P/N: ${escape_html(producto.numeroParte)}</span>`);
			} else {
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]--> <span class="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase">${escape_html(producto.marca)}</span> <span class="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase">${escape_html(producto.modelo)}</span></div></div> <div class="space-y-2"><button${attr_class(`w-full p-3 rounded-xl border-2 flex justify-between items-center ${stringify(tipoPrecio === 'preciop' && !usarPrecioManual ? 'border-yellow-400 bg-yellow-50' : 'border-slate-100')}`)}><span class="text-[10px] font-black text-slate-400 uppercase">Normal</span> <span class="font-black text-slate-800">${escape_html(GTQ.format(producto.preciop || 0))}</span></button> <button${attr_class(`w-full p-3 rounded-xl border-2 flex justify-between items-center ${stringify(tipoPrecio === 'precioa' && !usarPrecioManual
				? 'border-emerald-500 bg-emerald-50'
				: 'border-slate-100')}`)}><span class="text-[10px] font-black text-emerald-600 uppercase">Efectivo/Transfer</span> <span class="font-black text-emerald-700">${escape_html(GTQ.format(producto.precioa || 0))}</span></button> `);

			if (producto.precioo > 0) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<button${attr_class(`w-full p-3 rounded-xl border-2 flex justify-between items-center ${stringify(tipoPrecio === 'precioo' && !usarPrecioManual ? 'border-red-500 bg-red-50' : 'border-red-100')}`)}><span class="text-[10px] font-black text-red-600 uppercase">🔥 Oferta</span> <span class="font-black text-red-600">${escape_html(GTQ.format(producto.precioo || 0))}</span></button>`);
			} else {
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]--> <button${attr_class(`w-full p-3 rounded-xl border-2 flex flex-col items-start ${stringify(usarPrecioManual ? 'border-purple-500 bg-purple-50' : 'border-slate-100')}`)}><div class="w-full flex justify-between items-center"><span class="text-[10px] font-black text-purple-600 uppercase">💰 Precio Manual</span> `);

			if (usarPrecioManual) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<span class="font-black text-purple-700">${escape_html(GTQ.format(precioManual))}</span>`);
			} else {
				$$renderer.push('<!--[!-->');
				$$renderer.push(`<span class="text-[10px] text-slate-400">Click para ingresar</span>`);
			}

			$$renderer.push(`<!--]--></div></button> `);

			if (usarPrecioManual) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<div class="p-3 bg-purple-50 rounded-xl space-y-2"><label for="precioManualInput" class="text-[10px] font-black text-purple-600 uppercase">Ingresar precio (mín: ${escape_html(GTQ.format(producto.precioa || 0))})</label> <input id="precioManualInput" type="number"${attr('value', precioManual)}${attr('min', producto.precioa || 0)} step="0.01"${attr_class(`w-full p-2 rounded-lg border-2 ${stringify(errorPrecioManual ? 'border-red-400' : 'border-purple-200')} font-black text-lg text-center`)}/> `);

				if (errorPrecioManual) {
					$$renderer.push('<!--[-->');
					$$renderer.push(`<p class="text-[10px] font-bold text-red-500">${escape_html(errorPrecioManual)}</p>`);
				} else {
					$$renderer.push('<!--[!-->');
				}

				$$renderer.push(`<!--]--></div>`);
			} else {
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]--></div> `);

			if (producto.costo) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<button class="absolute bottom-20 left-3 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-300 hover:bg-slate-200 transition-opacity opacity-30 hover:opacity-100" title="Info">●</button> `);

				if (costoVisible) {
					$$renderer.push('<!--[-->');
					$$renderer.push(`<div class="absolute bottom-20 left-12 bg-slate-900/95 text-white px-3 py-2 rounded-xl text-sm font-black shadow-xl z-50">${escape_html(GTQ.format(producto.costo))}</div>`);
				} else {
					$$renderer.push('<!--[!-->');
				}

				$$renderer.push(`<!--]-->`);
			} else {
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]--> <div class="pt-4 border-t border-slate-100"><h3 class="text-[10px] font-black text-slate-400 uppercase mb-2">Existencias por Sucursal</h3> `);

			if (loadingExistencias) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<div class="text-center py-4 text-slate-400 text-sm">Cargando existencias...</div>`);
			} else {
				$$renderer.push('<!--[!-->');

				if (existenciasPorSucursal.length === 0) {
					$$renderer.push('<!--[-->');
					$$renderer.push(`<div class="text-center py-4 text-slate-400 text-sm">Sin existencias registradas</div>`);
				} else {
					$$renderer.push('<!--[!-->');
					$$renderer.push(`<div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto"><!--[-->`);

					const each_array = ensure_array_like(existenciasPorSucursal);

					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let suc = each_array[$$index];

						$$renderer.push(`<div class="p-2 bg-slate-50 rounded-lg flex justify-between items-center"><span class="text-[9px] font-bold text-slate-500 uppercase truncate">${escape_html(suc.ubicacion)}</span> <span class="text-xs font-black text-blue-600">${escape_html(Math.floor(suc.existencia))}</span></div>`);
					}

					$$renderer.push(`<!--]--></div>`);
				}

				$$renderer.push(`<!--]-->`);
			}

			$$renderer.push(`<!--]--></div></div> <div class="p-3 sm:p-4 bg-white border-t border-slate-100 flex gap-3"><input type="number"${attr('value', cantidad)} min="1" class="w-14 sm:w-16 bg-slate-100 rounded-xl text-center font-black py-3"/> <button${attr('disabled', usarPrecioManual && !!errorPrecioManual, true)} class="flex-1 bg-yellow-400 py-3 sm:py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-400/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Agregar a Cotización</button></div></div></div>`);
		} else {
			$$renderer.push('<!--[!-->');
		}

		$$renderer.push(`<!--]-->`);

		if ($$store_subs) unsubscribe_stores($$store_subs);

		bind_props($$props, { showModal, producto });
	});
}

function Buscador($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let // Feedback visual INP
			productosOrdenados;

		let idAgenciaUsuario = fallback($$props['idAgenciaUsuario'], undefined);
		let nombreAgencia = fallback($$props['nombreAgencia'], "");
		const GTQ = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

		function formatFechaMesAnio(fecha) {
			if (!fecha) return "S/N";

			const d = new Date(fecha);

			if (isNaN(d.getTime())) return "S/N";

			return d.toISOString().slice(0, 10);
		}

		let busqueda = "";
		let productos = [];
		let activeId = null; // Feedback visual INP

		let showModal = false;
		let selProd = null;

		// Carrito/Cotización state - estilo original
		let listaCarrito = [];

		function getImageUrl(productId, size = "small") {
			return `/api/producto-imagen/${productId}?size=${size}`;
		}

		Array.from({ length: BRAND_CONFIG.skeletons.cardCount });

		productosOrdenados = (() => {
			[...productos];

			return productos;
		})();

		let $$settled = true;
		let $$inner_renderer;

		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-32 overflow-x-hidden svelte-o0azo9"><div class="sticky top-0 bg-white/95 backdrop-blur-md z-40 pb-3 sm:pb-4 border-b border-gray-100 space-y-2 sm:space-y-3 px-1 svelte-o0azo9"><div class="relative svelte-o0azo9"><input type="text"${attr('value', busqueda)}${attr('placeholder', BRAND_CONFIG.copy.search.placeholder)} class="w-full p-3 sm:p-4 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-yellow-400/30 outline-none text-base sm:text-lg font-black text-slate-800 box-border svelte-o0azo9"/> `);

			{
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]--></div> <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-4 svelte-o0azo9"><button class="flex items-center gap-2 group svelte-o0azo9"><div${attr_class(`h-5 w-10 rounded-full relative transition-all ${stringify('bg-slate-300')}`, 'svelte-o0azo9')}><div${attr_class(`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${stringify('left-0.5')} shadow-sm`, 'svelte-o0azo9')}></div></div> <span${attr_class(`text-[9px] sm:text-[10px] font-black uppercase ${stringify('text-slate-400')}`, 'svelte-o0azo9')}>Mi Sucursal</span></button> <div class="flex items-center gap-1 sm:gap-2 svelte-o0azo9"><span class="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase svelte-o0azo9">${escape_html(productos.length)} Items</span> `);

			if (nombreAgencia) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<div class="h-3 w-px bg-slate-200 svelte-o0azo9"></div> <div class="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase truncate max-w-[80px] sm:max-w-none svelte-o0azo9">📍 ${escape_html(nombreAgencia)}</div>`);
			} else {
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]--></div></div> `);

			if (productos.length > 0) {
				$$renderer.push('<!--[-->');

				$$renderer.push(`<div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar svelte-o0azo9"><button${attr_class(
					`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${stringify('bg-slate-100 text-slate-500')}`,
					'svelte-o0azo9'
				)}>Precio ↑</button> <button${attr_class(
					`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${stringify('bg-slate-100 text-slate-500')}`,
					'svelte-o0azo9'
				)}>Precio ↓</button> <button${attr_class(
					`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${stringify('bg-slate-100 text-slate-500')}`,
					'svelte-o0azo9'
				)}>Más Stock</button> <button${attr_class(
					`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${stringify('bg-slate-100 text-slate-500')}`,
					'svelte-o0azo9'
				)}>Últ. Compra ↓</button> <button${attr_class(`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border-2 border-red-400 text-red-500 ${stringify('')}`, 'svelte-o0azo9')}>Ofertas 🔥</button></div>`);
			} else {
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]--></div> <div class="grid grid-cols-1 gap-3 svelte-o0azo9"${attr_style(`min-height: ${stringify(BRAND_CONFIG.skeletons.resultsMinHeight)}`)}>`);

			{
				$$renderer.push('<!--[!-->');
				$$renderer.push(`<!--[-->`);

				const each_array_1 = ensure_array_like(productosOrdenados);

				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let item = each_array_1[$$index_1];

					$$renderer.push(`<button type="button"${attr_class(
						`product-card bg-white p-4 rounded-2xl border transition-all cursor-pointer text-left w-full relative overflow-hidden ${stringify(activeId === item.id ? 'scale-[0.98]' : 'active:scale-95')} ${stringify(item.precioo > 0
							? 'border-2 border-red-400 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30'
							: 'border border-slate-100 shadow-sm hover:border-[#ffd312]')}`,
						'svelte-o0azo9'
					)}>`);

					if (item.precioo > 0) {
						$$renderer.push('<!--[-->');
						$$renderer.push(`<div class="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-md z-10 flex items-center gap-1 svelte-o0azo9"><span class="svelte-o0azo9">🔥</span> <span class="svelte-o0azo9">OFERTA</span></div> <div class="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-shimmer-card svelte-o0azo9"></div>`);
					} else {
						$$renderer.push('<!--[!-->');
					}

					$$renderer.push(`<!--]--> <div class="flex items-center gap-4 relative z-[5] svelte-o0azo9"><div class="img-aspect-square w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 p-2 svelte-o0azo9"><img${attr('src', getImageUrl(item.id, "thumb"))}${attr('alt', item.nombre)}${attr('width', BRAND_CONFIG.dimensions.thumbSize)}${attr('height', BRAND_CONFIG.dimensions.thumbSize)} class="max-h-full max-w-full object-contain svelte-o0azo9" loading="lazy" decoding="async"/></div> <div class="flex-1 min-w-0 svelte-o0azo9"><h3 class="text-[9px] font-black text-slate-400 uppercase svelte-o0azo9">${escape_html(item.modelo || "S/M")}</h3> <h4 class="text-sm font-black text-slate-800 uppercase truncate leading-tight svelte-o0azo9">${escape_html(item.nombre)}</h4> <p class="text-[9px] text-slate-400 font-bold mt-1 uppercase svelte-o0azo9">SKU: ${escape_html(item.id)} | ${escape_html(item.marca ? item.marca : "S/N")} | ${escape_html(item.numeroParte ? item.numeroParte : "S/N")} | ${escape_html(formatFechaMesAnio(item.ultimaCompra))}</p></div> <div class="text-right svelte-o0azo9"><div class="text-sm font-black text-slate-900 svelte-o0azo9">${escape_html(GTQ.format(item.preciop || 0))}</div> <div${attr_class(`text-[9px] font-black mt-1 ${stringify(item.existencia > 0 ? 'text-blue-600' : 'text-red-400')} uppercase`, 'svelte-o0azo9')}>● ${escape_html(Math.floor(item.existencia))} DISP.</div></div></div></button>`);
				}

				$$renderer.push(`<!--]-->`);
			}

			$$renderer.push(`<!--]--></div></div> `);

			ProductoDetalleModal($$renderer, {
				producto: selProd,

				get showModal() {
					return showModal;
				},

				set showModal($$value) {
					showModal = $$value;
					$$settled = false;
				}
			});

			$$renderer.push(`<!----> `);

			if (listaCarrito.length > 0) {
				$$renderer.push('<!--[-->');
				$$renderer.push(`<div class="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 svelte-o0azo9">`);

				{
					$$renderer.push('<!--[!-->');
				}

				$$renderer.push(`<!--]--> <button class="bg-[#3d3b3e] text-[#ffd312] h-16 w-16 rounded-full shadow-2xl border-4 border-[#ffd312] flex items-center justify-center text-xl active:scale-90 transition-all relative svelte-o0azo9">${escape_html("🛒" )} <span class="absolute -top-1 -right-1 bg-[#e91b27] text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white svelte-o0azo9">${escape_html(listaCarrito.length)}</span></button></div>`);
			} else {
				$$renderer.push('<!--[!-->');
			}

			$$renderer.push(`<!--]-->`);
		}

		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);

		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { idAgenciaUsuario, nombreAgencia });
	});
}

const $$Astro$1 = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Index;
  const propsStr = JSON.stringify(Astro2.props);
  const paramsStr = JSON.stringify(Astro2.params);
  return renderTemplate`${renderComponent($$result, "vercel-speed-insights", "vercel-speed-insights", { "data-props": propsStr, "data-params": paramsStr, "data-pathname": Astro2.url.pathname })} ${renderScript($$result, "D:/ALTEK/Web-empresa-ofit/ofit/node_modules/.pnpm/@vercel+speed-insights@1.3.1_svelte@5.46.1/node_modules/@vercel/speed-insights/dist/astro/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "D:/ALTEK/Web-empresa-ofit/ofit/node_modules/.pnpm/@vercel+speed-insights@1.3.1_svelte@5.46.1/node_modules/@vercel/speed-insights/dist/astro/index.astro", void 0);

const $$Astro = createAstro();
const $$Inventario = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Inventario;
  const agenciaId = Astro2.cookies.get("agencia_id")?.value;
  let nombreAgencia = "";
  if (agenciaId) {
    try {
      const config = {
        user: "altekdb",
        password: "WavOffice40Usuario.",
        server: "107.180.106.95\\SQLEXPRESS2008",
        database: "Logistik_GOSA",
        options: {
          instanceName: "SQLEXPRESS2008",
          encrypt: false,
          trustServerCertificate: true
        }
      };
      let pool = await sql.connect(config);
      const result = await pool.request().input("id", sql.Int, agenciaId).query("SELECT Nom_Agen FROM agencias WHERE cod_agen = @id");
      if (result.recordset.length > 0) {
        nombreAgencia = result.recordset[0].Nom_Agen;
      }
    } catch (e) {
      console.error("Error fetching agency name", e);
    }
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Inventario | OFIT" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="inventario-page"> ${renderComponent($$result2, "AdminNavbar", $$AdminNavbar, {})} ${renderComponent($$result2, "SpeedInsights", $$Index, {})} ${renderComponent($$result2, "Buscador", Buscador, { "client:load": true, "idAgenciaUsuario": agenciaId, "nombreAgencia": nombreAgencia, "client:component-hydration": "load", "client:component-path": "D:/ALTEK/Web-empresa-ofit/ofit/src/components/Buscador.svelte", "client:component-export": "default" })} </div> ` })} `;
}, "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/inventario.astro", void 0);
const $$file = "D:/ALTEK/Web-empresa-ofit/ofit/src/pages/inventario.astro";
const $$url = "/inventario";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Inventario,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
