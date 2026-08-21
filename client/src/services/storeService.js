import api from './api';

export const storeService = {

  async getStores(params = {}) {
    const response = await api.get('/stores', { params });
    return response.data; // { stores, pagination }
  },

  async getStoreById(storeId) {
    const response = await api.get(`/stores/${storeId}`);
    return response.data.store;
  }
};
