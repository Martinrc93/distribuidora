import { apiClient } from '../../api/apiClient.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast } from '../../utils/ui.js';

function isValidDate(dateStr) {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const time = Date.parse(dateStr);
    return !isNaN(time);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- NAVEGACIÓN ENTRE PESTAÑAS (TABS) ---
    const tabs = document.querySelectorAll('.dashboard-tab');
    const views = document.querySelectorAll('.dashboard-view');
    const inputFechaMin = document.getElementById('globalFechaMin');
    const inputFechaMax = document.getElementById('globalFechaMax');
    const selectProductsLimit = document.getElementById('select-top-products-limit');
    const selectClientsLimit = document.getElementById('select-top-clients-limit');
    
    // Almacenamos instancias de los gráficos para poder destruirlas y recrearlas limpiamente
    const chartInstances = {
        finance: null,
        brand: null
    };

    // Formateador de moneda (Pesos Argentinos)
    const currencyFormatter = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    });

    // Helper para formatear fecha local en YYYY-MM-DD
    const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- INICIALIZAR FECHAS POR DEFECTO ---
    const today = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);

    inputFechaMax.value = getLocalDateString(today);
    inputFechaMin.value = getLocalDateString(fourteenDaysAgo);

    // Configurar límites iniciales
    inputFechaMin.max = inputFechaMax.value;
    inputFechaMax.min = inputFechaMin.value;

    // --- NAVEGACIÓN DE PESTAÑAS ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Cambiar clase activa en botones
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Cambiar vista activa
            views.forEach(view => {
                if (view.id === targetTab) {
                    view.classList.add('active-view');
                } else {
                    view.classList.remove('active-view');
                }
            });

            // Cargar datos según la pestaña activa
            loadTabData(targetTab);
        });
    });

    // --- FILTRADO AUTOMÁTICO AL CAMBIAR FECHAS ---
    const handleDateChange = (e) => {
        // Validar y ajustar si Desde > Hasta
        if (inputFechaMin.value && inputFechaMax.value && inputFechaMin.value > inputFechaMax.value) {
            if (e.target === inputFechaMin) {
                // Si cambió Desde, ajustamos Hasta
                inputFechaMax.value = inputFechaMin.value;
            } else if (e.target === inputFechaMax) {
                // Si cambió Hasta, ajustamos Desde
                inputFechaMin.value = inputFechaMax.value;
            }
        }

        // Actualizar límites dinámicos
        inputFechaMin.max = inputFechaMax.value;
        inputFechaMax.min = inputFechaMin.value;

        const activeTabButton = document.querySelector('.dashboard-tab.active');
        if (activeTabButton) {
            const targetTab = activeTabButton.getAttribute('data-tab');
            loadTabData(targetTab);
        }
    };

    inputFechaMin.addEventListener('change', handleDateChange);
    inputFechaMax.addEventListener('change', handleDateChange);

    if (selectProductsLimit) {
        selectProductsLimit.addEventListener('change', () => {
            loadPortfolioData(true);
        });
    }

    if (selectClientsLimit) {
        selectClientsLimit.addEventListener('change', () => {
            loadCommercialData();
        });
    }

    // Cargar por defecto la primera pestaña al inicio
    loadTabData('tab-finance');

    // Función principal para enrutar la carga de datos
    function loadTabData(tabId) {
        if (tabId === 'tab-finance') {
            loadFinanceData();
        } else if (tabId === 'tab-portfolio') {
            loadPortfolioData();
        } else if (tabId === 'tab-commercial') {
            loadCommercialData();
        }
    }

    // --- CARGAR TABLERO DE FINANZAS Y RENTABILIDAD ---
    async function loadFinanceData() {
        try {
            const fMin = inputFechaMin.value;
            const fMax = inputFechaMax.value;
            if (!isValidDate(fMin) || !isValidDate(fMax)) {
                showToast('Formato de fecha inválido. Utilice AAAA-MM-DD.', 'error');
                return;
            }
            const data = await apiClient.get(`/dashboard/finance?fechaMin=${fMin}&fechaMax=${fMax}`);

            const { kpis, history } = data;

            // Rellenar KPIs
            document.getElementById('fin-facturacion').textContent = currencyFormatter.format(kpis.totalFacturado);
            document.getElementById('fin-ganancia').textContent = currencyFormatter.format(kpis.totalGanancia);
            document.getElementById('fin-ventas').textContent = kpis.totalVentas;

            // Calcular Margen
            const margen = kpis.totalFacturado > 0 
                ? ((kpis.totalGanancia / kpis.totalFacturado) * 100).toFixed(1) 
                : '0.0';
            document.getElementById('fin-margen').textContent = `${margen}%`;

            // Renderizar Gráfico de Líneas/Área
            renderFinanceChart(history);
        } catch (err) {
            console.error('Error cargando finanzas:', err);
            showToast('Error al cargar datos financieros', 'error');
        }
    }

    function renderFinanceChart(history) {
        const ctx = document.getElementById('financeChart').getContext('2d');

        // Destruir instancia anterior si existe
        if (chartInstances.finance) {
            chartInstances.finance.destroy();
        }

        // Si no hay datos históricos, limpiar canvas y salir
        if (!history || history.length === 0) {
            return;
        }

        const labels = history.map(item => {
            // Formatear fecha de YYYY-MM-DD a DD/MM
            const parts = item.fecha.split('-');
            return `${parts[2]}/${parts[1]}`;
        });
        const ventasData = history.map(item => item.totalVentas);
        const gananciasData = history.map(item => item.totalGanancia);

        chartInstances.finance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ventas Totales',
                        data: ventasData,
                        borderColor: '#2563eb', // Azul
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Ganancia Real',
                        data: gananciasData,
                        borderColor: '#10b981', // Verde
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += currencyFormatter.format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#1e293b' },
                        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                    },
                    y: {
                        grid: { color: '#1e293b' },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'Inter' },
                            callback: function(value) {
                                return currencyFormatter.format(value).split(',')[0]; // Formato simplificado sin decimales
                            }
                        }
                    }
                }
            }
        });
    }

    // --- CARGAR TABLERO DE MIX DE PRODUCTOS Y MARCAS ---
    async function loadPortfolioData(onlyProducts = false) {
        try {
            const fMin = inputFechaMin.value;
            const fMax = inputFechaMax.value;
            if (!isValidDate(fMin) || !isValidDate(fMax)) {
                showToast('Formato de fecha inválido. Utilice AAAA-MM-DD.', 'error');
                return;
            }
            const limit = selectProductsLimit ? selectProductsLimit.value : 10;
 
            const titleText = document.getElementById('products-title-text');
            if (titleText) {
                titleText.textContent = limit === 'all'
                    ? 'Todos los Productos Más Vendidos'
                    : `Top ${limit} Productos Más Vendidos`;
            }
 
            const data = await apiClient.get(`/dashboard/portfolio?fechaMin=${fMin}&fechaMax=${fMax}&limit=${limit}`);
 
            const { topProducts, brandStats, totalProductsCount } = data;
 
            // Actualizar la opción de "Todos" con la cantidad de productos
            const optionAll = document.getElementById('option-limit-all');
            if (optionAll && totalProductsCount) {
                optionAll.textContent = `Todos (${totalProductsCount})`;
            }
 
            // Rellenar tabla de productos
            const productsTableBody = document.querySelector('#table-top-products tbody');
            productsTableBody.innerHTML = '';
 
            if (topProducts.length === 0) {
                productsTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-3">No hay datos de ventas disponibles en este período</td></tr>`;
            } else {
                topProducts.forEach(prod => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-white">${escapeHtml(prod.nombre)}</td>
                        <td class="text-center font-weight-bold">${prod.cantidadVendida}</td>
                        <td class="text-right text-success">${currencyFormatter.format(prod.totalRecaudado)}</td>
                    `;
                    productsTableBody.appendChild(tr);
                });
            }
 
            // Renderizar Gráfico de Marcas
            if (!onlyProducts) {
                renderBrandChart(brandStats);
            }
        } catch (err) {
            console.error('Error cargando portfolio:', err);
            showToast('Error al cargar datos del catálogo (portfolio)', 'error');
        }
    }

    function renderBrandChart(brandStats) {
        const ctx = document.getElementById('brandChart').getContext('2d');
        const filterContainer = document.getElementById('brandFilterContainer');

        if (chartInstances.brand) {
            chartInstances.brand.destroy();
        }

        if (!brandStats || brandStats.length === 0) {
            filterContainer.innerHTML = '<span class="text-secondary" style="font-size: 0.8rem;">Sin marcas disponibles</span>';
            return;
        }

        // Inicialmente todas las marcas están seleccionadas
        let selectedBrands = brandStats.map(b => b.marcaNombre);

        // Limpiar y poblar contenedor de filtros
        filterContainer.innerHTML = '';
        brandStats.forEach(b => {
            const pill = document.createElement('div');
            pill.className = 'brand-pill active';
            pill.textContent = `${b.marcaNombre} (${b.cantidadVendida})`;
            pill.addEventListener('click', () => {
                const index = selectedBrands.indexOf(b.marcaNombre);
                if (index > -1) {
                    selectedBrands.splice(index, 1);
                    pill.classList.remove('active');
                } else {
                    selectedBrands.push(b.marcaNombre);
                    pill.classList.add('active');
                }
                updateChartData();
            });
            filterContainer.appendChild(pill);
        });

        // Función interna para filtrar y actualizar los datos del gráfico
        function updateChartData() {
            // Filtrar los datos en base a las seleccionadas, respetando el orden original
            const filteredData = brandStats.filter(b => selectedBrands.includes(b.marcaNombre));

            const labels = filteredData.map(b => `${b.marcaNombre} (${b.cantidadVendida})`);
            const facturacionData = filteredData.map(b => b.totalRecaudado);
            const gananciaData = filteredData.map(b => b.totalGanancia);

            chartInstances.brand.data.labels = labels;
            chartInstances.brand.data.datasets[0].data = facturacionData;
            chartInstances.brand.data.datasets[1].data = gananciaData;
            chartInstances.brand.data.datasets[0].label = `Ventas por Marca (${filteredData.length})`;
            chartInstances.brand.update();
        }

        // Renderizado inicial con todos los datos
        const initialLabels = brandStats.map(b => `${b.marcaNombre} (${b.cantidadVendida})`);
        const initialFacturacion = brandStats.map(b => b.totalRecaudado);
        const initialGanancia = brandStats.map(b => b.totalGanancia);

        chartInstances.brand = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: initialLabels,
                datasets: [
                    {
                        label: `Ventas por Marca (${brandStats.length})`,
                        data: initialFacturacion,
                        backgroundColor: 'rgba(37, 99, 235, 0.7)',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Ganancia por Marca',
                        data: initialGanancia,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += currencyFormatter.format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#e2e8f0', font: { family: 'Inter', size: 13, weight: 'bold' } }
                    },
                    y: {
                        grid: { color: '#1e293b' },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'Inter' },
                            callback: function(value) {
                                return currencyFormatter.format(value).split(',')[0];
                            }
                        }
                    }
                }
            }
        });
    }

    // --- CARGAR TABLERO DE GESTIÓN COMERCIAL ---
    async function loadCommercialData() {
        try {
            const fMin = inputFechaMin.value;
            const fMax = inputFechaMax.value;
            if (!isValidDate(fMin) || !isValidDate(fMax)) {
                showToast('Formato de fecha inválido. Utilice AAAA-MM-DD.', 'error');
                return;
            }
            const limit = selectClientsLimit ? selectClientsLimit.value : 10;

            const titleText = document.getElementById('clients-title-text');
            if (titleText) {
                titleText.textContent = limit === 'all'
                    ? 'Todos los Clientes de Mayor Valor'
                    : `Top ${limit} Clientes de Mayor Valor`;
            }

            const data = await apiClient.get(`/dashboard/commercial?fechaMin=${fMin}&fechaMax=${fMax}&limit=${limit}`);

            const { topClients, employeeStats, totalClientsCount } = data;

            // Actualizar la opción de "Todos" con la cantidad de clientes
            const optionAllClients = document.getElementById('option-clients-limit-all');
            if (optionAllClients && totalClientsCount) {
                optionAllClients.textContent = `Todos (${totalClientsCount})`;
            }

            // Rellenar Tabla de Clientes (Clientes de Mayor Valor)
            const clientsTableBody = document.querySelector('#table-top-clients tbody');
            clientsTableBody.innerHTML = '';
            if (topClients.length === 0) {
                clientsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-3">No hay datos de clientes disponibles en este período</td></tr>`;
            } else {
                topClients.forEach(cli => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-white font-weight-bold">${escapeHtml(cli.clienteNombre)}</td>
                        <td><span class="badge" style="font-size: 0.95rem; padding: 0.5rem 0.9rem; font-weight: 600; background-color: rgba(37, 99, 235, 0.15); border: 1px solid rgba(37, 99, 235, 0.3); color: #60a5fa;">${escapeHtml(cli.listaPreciosNombre)}</span></td>
                        <td class="text-center">${cli.cantidadVentas}</td>
                        <td class="text-right text-success font-weight-bold">${currencyFormatter.format(cli.totalComprado)}</td>
                        <td class="text-right text-success">${currencyFormatter.format(cli.gananciaGenerada)}</td>
                    `;
                    clientsTableBody.appendChild(tr);
                });
            }

            // Rellenar Tabla de Empleados (Vendedores)
            const employeesTableBody = document.querySelector('#table-employees tbody');
            employeesTableBody.innerHTML = '';
            if (employeeStats.length === 0) {
                employeesTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-3">No hay datos de vendedores disponibles en este período</td></tr>`;
            } else {
                employeeStats.forEach(emp => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-white">${escapeHtml(emp.empleadoNombre)}</td>
                        <td class="text-center">${emp.cantidadVentas}</td>
                        <td class="text-right">${currencyFormatter.format(emp.totalVendido)}</td>
                        <td class="text-right text-success">${currencyFormatter.format(emp.gananciaGenerada)}</td>
                    `;
                    employeesTableBody.appendChild(tr);
                });
            }

        } catch (err) {
            console.error('Error cargando datos comerciales:', err);
            showToast('Error al cargar datos comerciales', 'error');
        }
    }
});
