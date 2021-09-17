import restServiceHelper from '../../shared/lib/restServiceHelper';
import restService from '../../shared/services/restService';

class ProjectService {
  async listAsync(token, page = 1, pageSize = 5, filter = '') {
    const url = `/project?page=${page}&pageSize=${pageSize}&filter=${filter}`;
    restService.setToken(token);
    const response = await restService.getAsync(url);
    return response.data;
  }

  async getAsync(token, id) {
    const url = `/project/${id}`;
    const response = await restService.getAsync(url);
    return response.data;
  }

  async createAsync(token, data) {
    const url = `/project`;
    try {
      restService.setToken(token);
      const response = await restService.postAsync(url, data);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  async updateAsync(token, id, data) {
    const url = `/project/${id}`;
    try {
      restService.setToken(token);
      const response = await restService.putAsync(url, data);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  async importAsync(token, data) {
    const url = `/project/import`;
    try {
      restService.setToken(token);
      const response = await restService.postAsync(url, data);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  async deleteAsync(token, id) {
    const url = `/project/${id}`;
    try {
      restService.setToken(token);
      const response = await restService.deleteAsync(url);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  exportAsync = async (id) => restServiceHelper.requestAsync(restService.postAsync(`project/${id}/export`));
}
export default new ProjectService();
