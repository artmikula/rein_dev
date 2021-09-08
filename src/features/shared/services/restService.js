import axios from 'axios';

class RestService {
  _token = '';

  config = (token, customHeader = {}) => {
    return {
      headers: { Authorization: `Bearer ${token}`, ...customHeader },
    };
  };

  setToken(jwt) {
    this._token = jwt;
  }

  async getAsync(url) {
    return axios.get(url, this.config(this._token));
  }

  async postAsync(url, data = {}) {
    return axios.post(url, data, this.config(this._token, { 'Content-Type': 'application/json' }));
  }

  async putAsync(url, data = {}) {
    return axios.put(url, data, this.config(this._token, { 'Content-Type': 'application/json' }));
  }

  async deleteAsync(url) {
    return axios.delete(url, this.config(this._token));
  }

  async patchAsync(url, data = {}) {
    return axios.patch(url, data, this.config(this._token, { 'Content-Type': 'application/json' }));
  }
}

export default new RestService();
