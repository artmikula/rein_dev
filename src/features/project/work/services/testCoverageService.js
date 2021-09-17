import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class TestCoverageService {
  async getAsync(projectId, workId) {
    const url = `/project/${projectId}/test-coverage/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createUpdateAsync(projectId, workId, data) {
    const url = `/project/${projectId}/test-coverage/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}

export default new TestCoverageService();
