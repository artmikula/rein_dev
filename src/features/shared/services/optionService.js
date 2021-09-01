import restServiceHelper from '../lib/restServiceHelper';
import restService from './restService';

class OptionService {
  async get() {
    const url = `api/options`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async update(data) {
    const url = `api/options`;
    const response = await restServiceHelper.requestAsync(restService.putAsync(url, data));
    return response;
  }
}

export default new OptionService();
