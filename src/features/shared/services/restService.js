import axios from 'axios';
import authService from '../authorization/AuthorizeService';

class RestService {
  config = (token, customHeader = {}) => {
    return {
      headers: { Authorization: `Bearer ${token}`, ...customHeader },
    };
  };

  async getAsync(url) {
    const token = await authService.getAccessToken();
    return axios.get(url, this.config(token));
  }

  async postAsync(url, data = {}) {
    const token = await authService.getAccessToken();

    return axios.post(url, data, this.config(token, { 'Content-Type': 'application/json' }));
  }

  async putAsync(url, data = {}) {
    const token = await authService.getAccessToken();

    return axios.put(url, data, this.config(token, { 'Content-Type': 'application/json' }));
  }

  async deleteAsync(url) {
    const token = await authService.getAccessToken();

    return axios.delete(url, this.config(token));
  }

  async patchAsync(url, data = {}) {
    const token = await authService.getAccessToken();

    return axios.patch(url, data, this.config(token, { 'Content-Type': 'application/json' }));
  }
}

export default new RestService();
