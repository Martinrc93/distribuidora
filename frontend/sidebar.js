document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    // Detectar la ruta de la página actual
    const path = globalThis.location.pathname;

    const sidebarHtml = `
        <aside class="sidebar">
            <button class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Cerrar menú">
                <i class="fas fa-times"></i>
            </button>
            <div class="sidebar-header">
                <h2>Distribuidora</h2>
                <p>Gestión de Productos, Empleados y Pedidos</p>
            </div>

            <nav class="sidebar-nav">
                <ul>
                    <li><a href="../dashboard/index.html" id="nav-dashboard"><i class="fas fa-home"></i> Menú</a></li>
                    <li><a href="../pedidos/pedidos.html" id="nav-pedidos"><i class="fas fa-shopping-cart"></i> Pedidos</a></li>
                    <li><a href="../productos/productos.html" id="nav-productos"><i class="fas fa-box"></i> Productos</a></li>
                    <li><a href="../clientes/clientes.html" id="nav-clientes"><i class="fas fa-user-friends"></i> Clientes</a></li>
                    <li><a href="../empleados/empleados.html" id="nav-empleados"><i class="fas fa-users"></i> Empleados</a></li>
                    <li><a href="../whatsapp/whatsapp.html" id="nav-whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</a></li>
                </ul>
            </nav>
        </aside>
    `;

    // Reemplazar el contenedor por el elemento sidebar completo
    sidebarContainer.outerHTML = sidebarHtml;

    // Activar la clase active en el enlace correspondiente
    if (path.includes('/dashboard/')) {
        document.getElementById('nav-dashboard')?.classList.add('active');
    } else if (path.includes('/pedidos/')) {
        document.getElementById('nav-pedidos')?.classList.add('active');
    } else if (path.includes('/productos/')) {
        document.getElementById('nav-productos')?.classList.add('active');
    } else if (path.includes('/clientes/')) {
        document.getElementById('nav-clientes')?.classList.add('active');
    } else if (path.includes('/empleados/')) {
        document.getElementById('nav-empleados')?.classList.add('active');
    } else if (path.includes('/whatsapp/')) {
        document.getElementById('nav-whatsapp')?.classList.add('active');
    }

    // --- LÓGICA RESPONSIVA PARA DISPOSITIVOS MÓVILES ---
    
    // Obtener la referencia de la sidebar recién creada en el DOM
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Inyectar dinámicamente la cabecera móvil (Mobile Header)
    const mobileHeader = document.createElement('header');
    mobileHeader.className = 'mobile-header';
    mobileHeader.innerHTML = `
        <div class="mobile-header-brand">
            <h2>Distribuidora</h2>
        </div>
        <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Abrir menú">
            <i class="fas fa-bars"></i>
        </button>
    `;
    document.body.prepend(mobileHeader);

    // Inyectar dinámicamente el backdrop translúcido
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.id = 'sidebarBackdrop';
    document.body.appendChild(backdrop);

    // Botones de interacción
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    // Funciones para abrir y cerrar
    function openSidebar() {
        sidebar.classList.add('show');
        sidebarBackdrop.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevenir scroll al estar el menú abierto
    }

    function closeSidebar() {
        sidebar.classList.remove('show');
        sidebarBackdrop.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', openSidebar);
    }
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebar);
    }
});

