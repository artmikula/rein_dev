import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class TestBasisService {
  async getAsync(token, projectId, workId) {
    const url = `/project/${projectId}/test-basic/${workId}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createUpdateAsync(token, projectId, workId, data) {
    const url = `/project/${projectId}/test-basic/${workId}/create-update`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}
export default new TestBasisService();
