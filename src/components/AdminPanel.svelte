<script lang="ts">
    // AdminPanel.svelte - Panel de administración de marcas y productos
    let activeTab = $state<"marcas" | "productos">("marcas");

    // State for brands
    let marcas = $state<Array<{ id: number; nombre: string }>>([]);
    let loadingMarcas = $state(true);
    let errorMarcas = $state("");

    // State for products
    let productos = $state<
        Array<{
            id: string;
            nombre: string;
            descripcion: string;
            modelo: string;
        }>
    >([]);
    let loadingProductos = $state(false);
    let errorProductos = $state("");
    let searchQuery = $state("");
    let searchTimeout: ReturnType<typeof setTimeout>;

    // Selected item for editing
    let selectedMarca = $state<{ id: number; nombre: string } | null>(null);
    let selectedProducto = $state<{
        id: string;
        nombre: string;
        descripcion: string;
        modelo: string;
    } | null>(null);

    // Upload states
    let uploading = $state(false);
    let uploadSuccess = $state("");
    let uploadError = $state("");

    // Cache-busting: version timestamp para forzar recarga de imágenes
    let imageVersion = $state(Date.now());
    // ID del último producto/marca modificado para resaltarlo
    let lastModifiedId = $state<string | number | null>(null);

    // Edit form states for productos
    let editNombre = $state("");
    let editDescripcion = $state("");
    let editModelo = $state("");

    async function loadMarcas() {
        loadingMarcas = true;
        errorMarcas = "";
        try {
            const res = await fetch("/api/marcas");
            if (!res.ok) throw new Error("Error cargando marcas");
            marcas = await res.json();
        } catch (e) {
            errorMarcas = e instanceof Error ? e.message : "Error desconocido";
        } finally {
            loadingMarcas = false;
        }
    }

    async function searchProductos() {
        if (!searchQuery.trim()) {
            productos = [];
            return;
        }
        loadingProductos = true;
        errorProductos = "";
        try {
            const res = await fetch(
                `/api/admin/productos?q=${encodeURIComponent(searchQuery)}`,
            );
            if (!res.ok) throw new Error("Error buscando productos");
            productos = await res.json();
        } catch (e) {
            errorProductos =
                e instanceof Error ? e.message : "Error desconocido";
        } finally {
            loadingProductos = false;
        }
    }

    function handleSearchInput(e: Event) {
        const target = e.target as HTMLInputElement;
        searchQuery = target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchProductos, 300);
    }

    function selectMarca(marca: { id: number; nombre: string }) {
        selectedMarca = marca;
        selectedProducto = null;
        uploadSuccess = "";
        uploadError = "";
    }

    function selectProducto(producto: {
        id: string;
        nombre: string;
        descripcion: string;
        modelo: string;
    }) {
        selectedProducto = producto;
        selectedMarca = null;
        editNombre = producto.nombre;
        editDescripcion = producto.descripcion || "";
        editModelo = producto.modelo || "";
        uploadSuccess = "";
        uploadError = "";
    }

    async function handleImageUpload(e: Event, type: "marca" | "producto") {
        const input = e.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        if (!file.type.startsWith("image/")) {
            uploadError = "Solo se permiten imágenes";
            return;
        }

        uploading = true;
        uploadError = "";
        uploadSuccess = "";

        const formData = new FormData();
        formData.append("imagen", file);

        try {
            const id =
                type === "marca" ? selectedMarca?.id : selectedProducto?.id;
            const endpoint =
                type === "marca"
                    ? `/api/marca-imagen/${id}`
                    : `/api/admin/producto/${id}`;

            const res = await fetch(endpoint, {
                method: "PUT",
                body: formData,
            });

            if (!res.ok) throw new Error("Error subiendo imagen");
            uploadSuccess = "¡Imagen actualizada correctamente!";

            // Actualizar versión de cache para forzar recarga de imágenes
            imageVersion = Date.now();

            // Guardar el ID modificado para resaltarlo
            const modifiedId =
                type === "marca" ? selectedMarca?.id : selectedProducto?.id;
            lastModifiedId = modifiedId ?? null;

            // Reload data y mantener selección
            if (type === "marca") {
                const currentId = selectedMarca?.id;
                await loadMarcas();
                // Re-seleccionar la marca para refrescar la preview
                if (currentId) {
                    const updated = marcas.find((m) => m.id === currentId);
                    if (updated) selectedMarca = { ...updated };
                }
            } else {
                const currentId = selectedProducto?.id;
                // Re-seleccionar el producto para refrescar la preview
                await searchProductos();
                if (currentId) {
                    const updated = productos.find((p) => p.id === currentId);
                    if (updated) selectedProducto = { ...updated };
                }
            }

            // Quitar resaltado después de 3 segundos
            setTimeout(() => {
                lastModifiedId = null;
            }, 3000);
        } catch (e) {
            uploadError =
                e instanceof Error ? e.message : "Error al subir imagen";
        } finally {
            uploading = false;
            input.value = "";
        }
    }

    async function saveProducto() {
        if (!selectedProducto) return;

        uploading = true;
        uploadError = "";
        uploadSuccess = "";

        try {
            const res = await fetch(
                `/api/admin/producto/${selectedProducto.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: editNombre,
                        descripcion: editDescripcion,
                        modelo: editModelo,
                    }),
                },
            );

            if (!res.ok) throw new Error("Error guardando producto");
            uploadSuccess = "¡Producto actualizado correctamente!";

            // Reload products
            await searchProductos();
        } catch (e) {
            uploadError = e instanceof Error ? e.message : "Error al guardar";
        } finally {
            uploading = false;
        }
    }

    // Load marcas on mount
    $effect(() => {
        loadMarcas();
    });
</script>

<div class="admin-panel">
    <!-- Tabs -->
    <div class="tabs">
        <button
            class="tab"
            class:active={activeTab === "marcas"}
            onclick={() => (activeTab = "marcas")}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
            </svg>
            Marcas
        </button>
        <button
            class="tab"
            class:active={activeTab === "productos"}
            onclick={() => (activeTab = "productos")}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
            </svg>
            Productos
        </button>
    </div>

    <!-- Content -->
    <div class="content">
        {#if activeTab === "marcas"}
            <!-- Marcas Section -->
            <div class="section">
                <h2 class="section-title">Gestión de Marcas</h2>
                <p class="section-desc">Modifica las imágenes de las marcas</p>

                {#if loadingMarcas}
                    <div class="loading">Cargando marcas...</div>
                {:else if errorMarcas}
                    <div class="error">{errorMarcas}</div>
                {:else}
                    <div class="grid">
                        {#each marcas as marca (marca.id)}
                            <button
                                class="card"
                                class:selected={selectedMarca?.id === marca.id}
                                class:modified={lastModifiedId === marca.id}
                                onclick={() => selectMarca(marca)}
                            >
                                <img
                                    src={`/api/marca-imagen/${marca.id}?size=small&v=${imageVersion}`}
                                    alt={marca.nombre}
                                    class="card-image"
                                />
                                <span class="card-name">{marca.nombre}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {:else}
            <!-- Productos Section -->
            <div class="section">
                <h2 class="section-title">Gestión de Productos</h2>
                <p class="section-desc">Busca y modifica productos</p>

                <div class="search-box">
                    <svg
                        class="search-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o modelo..."
                        value={searchQuery}
                        oninput={handleSearchInput}
                        class="search-input"
                    />
                </div>

                {#if loadingProductos}
                    <div class="loading">Buscando productos...</div>
                {:else if errorProductos}
                    <div class="error">{errorProductos}</div>
                {:else if productos.length > 0}
                    <div class="products-list">
                        {#each productos as producto (producto.id)}
                            <button
                                class="product-row"
                                class:selected={selectedProducto?.id ===
                                    producto.id}
                                onclick={() => selectProducto(producto)}
                            >
                                <img
                                    src={`/api/producto-imagen/${producto.id}?size=thumb&v=${imageVersion}`}
                                    alt={producto.nombre}
                                    class="product-thumb"
                                />
                                <div class="product-info">
                                    <span class="product-name"
                                        >{producto.nombre}</span
                                    >
                                    <span class="product-code"
                                        >SKU: {producto.id}</span
                                    >
                                </div>
                            </button>
                        {/each}
                    </div>
                {:else if searchQuery}
                    <div class="no-results">No se encontraron productos</div>
                {/if}
            </div>
        {/if}

        <!-- Edit Panel -->
        {#if selectedMarca || selectedProducto}
            <div class="edit-panel">
                <h3 class="edit-title">
                    {selectedMarca
                        ? `Editando: ${selectedMarca.nombre}`
                        : `Editando: ${selectedProducto?.nombre}`}
                </h3>

                {#if uploadSuccess}
                    <div class="success-msg">{uploadSuccess}</div>
                {/if}

                {#if uploadError}
                    <div class="error-msg">{uploadError}</div>
                {/if}

                {#if selectedMarca}
                    <!-- Marca Edit: Solo imagen -->
                    <div class="edit-section">
                        <label class="edit-label">Imagen de Marca</label>
                        <div class="image-preview">
                            <img
                                src={`/api/marca-imagen/${selectedMarca.id}?size=medium&t=${Date.now()}`}
                                alt={selectedMarca.nombre}
                            />
                        </div>
                        <label class="upload-btn" class:disabled={uploading}>
                            <input
                                type="file"
                                accept="image/*"
                                onchange={(e) => handleImageUpload(e, "marca")}
                                disabled={uploading}
                            />
                            {uploading ? "Subiendo..." : "Cambiar imagen"}
                        </label>
                    </div>
                {:else if selectedProducto}
                    <!-- Producto Edit: Campos + imagen -->
                    <div class="edit-section">
                        <label class="edit-label">Nombre</label>
                        <input
                            type="text"
                            bind:value={editNombre}
                            class="edit-input"
                        />
                    </div>

                    <div class="edit-section">
                        <label class="edit-label">Descripción</label>
                        <textarea
                            bind:value={editDescripcion}
                            class="edit-textarea"
                            rows="3"
                        ></textarea>
                    </div>

                    <div class="edit-section">
                        <label class="edit-label">Modelo</label>
                        <input
                            type="text"
                            bind:value={editModelo}
                            class="edit-input"
                        />
                    </div>

                    <button
                        class="save-btn"
                        onclick={saveProducto}
                        disabled={uploading}
                    >
                        {uploading ? "Guardando..." : "Guardar cambios"}
                    </button>

                    <div class="edit-section">
                        <label class="edit-label">Imagen del Producto</label>
                        <div class="image-preview">
                            <img
                                src={`/api/producto-imagen/${selectedProducto.id}?size=medium&t=${Date.now()}`}
                                alt={selectedProducto.nombre}
                            />
                        </div>
                        <label class="upload-btn" class:disabled={uploading}>
                            <input
                                type="file"
                                accept="image/*"
                                onchange={(e) =>
                                    handleImageUpload(e, "producto")}
                                disabled={uploading}
                            />
                            {uploading ? "Subiendo..." : "Cambiar imagen"}
                        </label>
                    </div>
                {/if}

                <button
                    class="close-btn"
                    onclick={() => {
                        selectedMarca = null;
                        selectedProducto = null;
                    }}
                >
                    Cerrar
                </button>
            </div>
        {/if}
    </div>
</div>

<style>
    .admin-panel {
        color: #1e293b;
    }

    /* Tabs */
    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        padding: 0.5rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .tab:hover {
        color: #1e293b;
        background: #f1f5f9;
    }

    .tab.active {
        background: linear-gradient(135deg, #ffd312 0%, #f0c000 100%);
        color: #1a1a1b;
        box-shadow: 0 4px 15px rgba(255, 211, 18, 0.3);
    }

    .tab svg {
        width: 20px;
        height: 20px;
    }

    /* Content */
    .content {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
    }

    @media (min-width: 1024px) {
        .content {
            grid-template-columns: 1fr 400px;
        }
    }

    /* Section */
    .section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 1.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 0.25rem 0;
        color: #1e293b;
    }

    .section-desc {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0 0 1.5rem 0;
    }

    /* Grid for Marcas */
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
    }

    .card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .card:hover {
        background: #f1f5f9;
        transform: translateY(-2px);
        border-color: #cbd5e1;
    }

    .card.selected {
        border-color: #ffd312;
        background: rgba(255, 211, 18, 0.15);
    }

    .card.modified {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.2);
        animation: pulse-green 1s ease-in-out 3;
    }

    .card-image {
        width: 80px;
        height: 80px;
        object-fit: contain;
        border-radius: 0.5rem;
        background: white;
        padding: 0.5rem;
    }

    .card-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: #1e293b;
        text-align: center;
        line-height: 1.2;
    }

    /* Search */
    .search-box {
        position: relative;
        margin-bottom: 1rem;
    }

    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        color: #94a3b8;
    }

    .search-input {
        width: 100%;
        padding: 1rem 1rem 1rem 3rem;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 1rem;
        color: #1e293b;
        font-size: 1rem;
        outline: none;
        transition: all 0.2s ease;
    }

    .search-input:focus {
        border-color: #ffd312;
        background: white;
    }

    .search-input::placeholder {
        color: #94a3b8;
    }

    /* Products List */
    .products-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
    }

    .product-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
    }

    .product-row:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }

    .product-row.selected {
        border-color: #ffd312;
        background: rgba(255, 211, 18, 0.15);
    }

    .product-thumb {
        width: 50px;
        height: 50px;
        object-fit: contain;
        border-radius: 0.5rem;
        background: white;
    }

    .product-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .product-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1e293b;
    }

    .product-code {
        font-size: 0.75rem;
        color: #64748b;
    }

    /* Edit Panel */
    .edit-panel {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 1.5rem;
        padding: 1.5rem;
        position: sticky;
        top: 100px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .edit-title {
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
        color: #1e293b;
    }

    .edit-section {
        margin-bottom: 1.25rem;
    }

    .edit-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }

    .edit-input,
    .edit-textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 0.75rem;
        color: #1e293b;
        font-size: 0.875rem;
        outline: none;
        transition: all 0.2s ease;
    }

    .edit-input:focus,
    .edit-textarea:focus {
        border-color: #ffd312;
    }

    .edit-textarea {
        resize: vertical;
        min-height: 80px;
    }

    .image-preview {
        background: white;
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
        display: flex;
        justify-content: center;
    }

    .image-preview img {
        max-width: 100%;
        max-height: 200px;
        object-fit: contain;
    }

    .upload-btn {
        display: block;
        text-align: center;
        padding: 0.75rem 1rem;
        background: #f1f5f9;
        border: 2px solid #e2e8f0;
        border-radius: 0.75rem;
        color: #1e293b;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .upload-btn:hover:not(.disabled) {
        border-color: #ffd312;
        background: rgba(255, 211, 18, 0.1);
    }

    .upload-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .upload-btn input {
        display: none;
    }

    .save-btn {
        width: 100%;
        padding: 1rem;
        background: linear-gradient(135deg, #ffd312 0%, #f0c000 100%);
        border: none;
        border-radius: 0.75rem;
        color: #1a1a1b;
        font-size: 0.875rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 1rem;
    }

    .save-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255, 211, 18, 0.3);
    }

    .save-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .close-btn {
        width: 100%;
        padding: 0.75rem;
        background: transparent;
        border: 2px solid #e2e8f0;
        border-radius: 0.75rem;
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        border-color: #cbd5e1;
        color: #1e293b;
    }

    /* States */
    .loading,
    .no-results {
        text-align: center;
        padding: 2rem;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.875rem;
    }

    .error,
    .error-msg {
        background: rgba(233, 27, 39, 0.1);
        border: 1px solid rgba(233, 27, 39, 0.3);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: #ff6b6b;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .success-msg {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: #10b981;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
        .tabs {
            margin-bottom: 1rem;
        }

        .tab {
            padding: 0.75rem;
            font-size: 0.875rem;
        }

        .tab svg {
            width: 18px;
            height: 18px;
        }

        .section {
            padding: 1rem;
        }

        .section-title {
            font-size: 1rem;
        }

        .grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 0.75rem;
        }

        .card {
            padding: 0.75rem;
        }

        .card-image {
            width: 60px;
            height: 60px;
        }

        .search-input {
            padding: 0.75rem 0.75rem 0.75rem 2.5rem;
            font-size: 0.875rem;
            box-sizing: border-box;
        }

        .search-icon {
            left: 0.75rem;
            width: 16px;
            height: 16px;
        }

        .products-list {
            max-height: 300px;
        }

        .product-row {
            padding: 0.5rem;
        }

        .product-thumb {
            width: 40px;
            height: 40px;
        }

        .product-name {
            font-size: 0.75rem;
        }

        .product-code {
            font-size: 0.625rem;
        }

        .edit-panel {
            padding: 1rem;
            position: static;
        }

        .image-preview img {
            max-height: 150px;
        }
    }

    /* Fix input overflow */
    .search-input,
    .edit-input,
    .edit-textarea {
        box-sizing: border-box;
        max-width: 100%;
    }
</style>
