import api from './api';

export const authService = {

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // { user, token }
  },

  async signup(signupData) {
    const response = await api.post('/auth/signup', signupData);
    return response.data; // { user, token }
  },

  async registerStore(data) {
    const response = await api.post('/auth/register-store', data);
    return response.data; // { user, store, token }
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response;
  }
};
