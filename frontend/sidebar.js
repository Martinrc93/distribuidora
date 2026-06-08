document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    // Detectar la ruta de la página actual
    const path = globalThis.location.pathname;

    const sidebarHtml = `
        <aside class="sidebar">
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
    }
});
