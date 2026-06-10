import { apiClient } from '../api/apiClient.js';

export const clientesService = {
    getAll: () => apiClient.get('/clientes'),
    getById: (id) => apiClient.get(`/clientes/${id}`),
    getUltimaVenta: (id) => apiClient.get(`/clientes/${id}/ultima-venta`),
    create: (clienteData) => apiClient.post('/clientes', clienteData),
    update: (id, clienteData) => apiClient.put(`/clientes/${id}`, clienteData),
    delete: (id) => apiClient.delete(`/clientes/${id}`),
};
