import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class TestBasisService {
  async getAsync(projectId, workId) {
    const url = `api/project/${projectId}/test-basic/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createUpdateAsync(projectId, workId, data) {
    const url = `api/project/${projectId}/test-basic/${workId}/create-update`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}
export default new TestBasisService();
