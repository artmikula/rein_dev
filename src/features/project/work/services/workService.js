import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class WorkService {
  async listAsync(token, projectId, page = 1, pageSize = 5, filter = '') {
    const url = `/project/${projectId}/work?page=${page}&pageSize=${pageSize}&filter=${filter}`;
    restService.setToken(token);
    const response = await restService.getAsync(url);
    return response.data;
  }

  async getAsync(token, projectId, workId) {
    const url = `/project/${projectId}/work/${workId}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createAsync(token, projectId, data) {
    const url = `/project/${projectId}/work`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async updateAsync(token, projectId, workId, data) {
    const url = `/project/${projectId}/work/${workId}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.putAsync(url, data));
    return response;
  }

  async deleteAsync(token, projectId, workId) {
    const url = `/project/${projectId}/work/${workId}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.deleteAsync(url));
    return response;
  }

  async importAsync(token, projectId, data) {
    const url = `/project/${projectId}/work/import`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async exportAsync(token, projectId, workId) {
    const url = `/project/${projectId}/work/${workId}/export`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.postAsync(url));
    return response;
  }

  async updateWorkDataAsync(token, projectId, workId, data) {
    const url = `/project/${projectId}/common/${workId}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}
export default new WorkService();
