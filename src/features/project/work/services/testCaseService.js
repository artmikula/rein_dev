import restServiceHelper from 'features/shared/lib/restServiceHelper';
import restService from 'features/shared/services/restService';

class TestCaseService {
  async getListAsync(projectId, workId) {
    const url = `api/project/${projectId}/test-case/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async updateBatchAsync(projectId, workId, data) {
    const url = `api/project/${projectId}/test-case/${workId}/batch-update`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}

export default new TestCaseService();
