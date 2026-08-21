import api from './api';

export const adminService = {
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard');
    return response.data; // { totalUsers, totalStores, totalRatings }
  },

  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data; // { users, pagination }
  },

  async createUser(userData) {
    const response = await api.post('/admin/users', userData);
    return response.data.user;
  },

  async getUserById(userId) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data.user;
  },

  async getStores(params = {}) {
    const response = await api.get('/admin/stores', { params });
    return response.data; // { stores, pagination }
  },

  async createStore(storeData) {
    const response = await api.post('/admin/stores', storeData);
    return response.data.store;
  },

  async getStoreById(storeId) {
    const response = await api.get(`/admin/stores/${storeId}`);
    return response.data.store;
  }
};
