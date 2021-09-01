import restServiceHelper from '../../shared/lib/restServiceHelper';
import restService from '../../shared/services/restService';

class ProjectService {
  async listAsync(page = 1, pageSize = 5, filter = '') {
    const url = `api/project?page=${page}&pageSize=${pageSize}&filter=${filter}`;
    const response = await restService.getAsync(url);
    return response.data;
  }

  async getAsync(id) {
    const url = `api/project/${id}`;
    const response = await restService.getAsync(url);
    return response.data;
  }

  async createAsync(data) {
    const url = `api/project`;
    try {
      const response = await restService.postAsync(url, data);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  async updateAsync(id, data) {
    const url = `api/project/${id}`;
    try {
      const response = await restService.putAsync(url, data);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  async importAsync(data) {
    const url = `api/project/import`;
    try {
      const response = await restService.postAsync(url, data);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  async deleteAsync(id) {
    const url = `api/project/${id}`;
    try {
      const response = await restService.deleteAsync(url);
      return restServiceHelper.handleResponse(response);
    } catch (error) {
      return { error };
    }
  }

  exportAsync = async (id) => restServiceHelper.requestAsync(restService.postAsync(`api/project/${id}/export`));
}
export default new ProjectService();
