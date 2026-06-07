import { apiClient } from '../api/apiClient.js';

export const empleadosService = {
    getAll: () => apiClient.get('/empleados'),
    getById: (id) => apiClient.get(`/empleados/${id}`),
    create: (empleadoData) => apiClient.post('/empleados', empleadoData),
    update: (id, empleadoData) => apiClient.put(`/empleados/${id}`, empleadoData),
    delete: (id) => apiClient.delete(`/empleados/${id}`),
};
