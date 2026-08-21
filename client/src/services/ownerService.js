import api from './api';

export const ownerService = {

  async getOwnerStores() {
    const response = await api.get('/owner/stores');
    return response.data.stores; // [{ id, name, averageRating, totalRatings, ratings: [...] }]
  },

  async createStore(storeData) {
    const response = await api.post('/owner/stores', storeData);
    return response.data.store;
  }
};
