import axios from 'axios';

const { REACT_APP_API_URL } = process.env;

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
    return axios.get(REACT_APP_API_URL + url, this.config(this._token));
  }

  async postAsync(url, data = {}) {
    return axios.post(REACT_APP_API_URL + url, data, this.config(this._token, { 'Content-Type': 'application/json' }));
  }

  async putAsync(url, data = {}) {
    return axios.put(REACT_APP_API_URL + url, data, this.config(this._token, { 'Content-Type': 'application/json' }));
  }

  async deleteAsync(url) {
    return axios.delete(REACT_APP_API_URL + url, this.config(this._token));
  }

  async patchAsync(url, data = {}) {
    return axios.patch(REACT_APP_API_URL + url, data, this.config(this._token, { 'Content-Type': 'application/json' }));
  }
}

const restService = new RestService();

export default restService;
