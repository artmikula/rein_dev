import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class WorkService {
  async listAsync(projectId, page = 1, pageSize = 5, filter = '') {
    const url = `/project/${projectId}/work?page=${page}&pageSize=${pageSize}&filter=${filter}`;
    const response = await restService.getAsync(url);
    return response.data;
  }

  async getAsync(projectId, workId) {
    const url = `/project/${projectId}/work/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createAsync(projectId, data) {
    const url = `/project/${projectId}/work`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async updateAsync(projectId, workId, data) {
    const url = `/project/${projectId}/work/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.putAsync(url, data));
    return response;
  }

  async deleteAsync(projectId, workId) {
    const url = `/project/${projectId}/work/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.deleteAsync(url));
    return response;
  }

  async importAsync(projectId, data) {
    const url = `/project/${projectId}/work/import`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async exportAsync(projectId, workId) {
    const url = `/project/${projectId}/work/${workId}/export`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url));
    return response;
  }

  async updateWorkDataAsync(projectId, workId, data) {
    const url = `/project/${projectId}/common/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}
export default new WorkService();
