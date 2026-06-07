import { apiClient } from '../api/apiClient.js';

export const productosService = {
    getAll: () => apiClient.get('/products'),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (productData) => apiClient.post('/products', productData),
    update: (id, productData) => apiClient.put(`/products/${id}`, productData),
    delete: (id) => apiClient.delete(`/products/${id}`),
};
