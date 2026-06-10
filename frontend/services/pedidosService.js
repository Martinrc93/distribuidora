import { apiClient } from '../api/apiClient.js';

export const pedidosService = {
    getByEmpleado: (empleadoId, { page = 1, limit = 10, dia = '' } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (dia) params.append('dia', dia);
        return apiClient.get(`/ventas/empleado/${empleadoId}?${params.toString()}`);
    },
    getByCliente: (clienteId, { page = 1, limit = 10, fechaMin = '', fechaMax = '' } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (fechaMin) params.append('fechaMin', fechaMin);
        if (fechaMax) params.append('fechaMax', fechaMax);
        return apiClient.get(`/ventas/cliente/${clienteId}?${params.toString()}`);
    },
    create: (pedidoData) => apiClient.post('/ventas', pedidoData),
    updateStatus: (id, active) => apiClient.put(`/ventas/${id}`, { active }),
};
