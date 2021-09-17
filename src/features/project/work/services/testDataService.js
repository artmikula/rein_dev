import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class TestDataService {
  async listAsync(projectId, workId) {
    const url = `/project/${projectId}/test-data/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createAsync(projectId, workId, data) {
    const url = `/project/${projectId}/test-data/${workId}/batch-create`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async updateAsync(projectId, workId, data) {
    const url = `/project/${projectId}/test-data/${workId}/${data?.id}`;
    const response = await restServiceHelper.requestAsync(restService.putAsync(url, data));
    return response;
  }

  async importAsync(projectId, workId, data) {
    const url = `/project/${projectId}/test-data/${workId}/import`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}
export default new TestDataService();
