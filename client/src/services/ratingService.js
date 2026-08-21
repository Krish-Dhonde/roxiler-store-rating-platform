import api from './api';

export const ratingService = {

  async submitRating(storeId, rating) {
    const response = await api.post('/ratings', { storeId, rating });
    return response.data.rating;
  },

  async modifyRating(storeId, rating) {
    const response = await api.patch(`/ratings/${storeId}`, { rating });
    return response.data.rating;
  }
};
