import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class TestDataService {
  async importAsync(token, projectId, workId, data) {
    restService.setToken(token);
    const url = `/project/${projectId}/test-data/${workId}/import`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}
export default new TestDataService();
