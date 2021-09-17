import restServiceHelper from 'features/shared/lib/restServiceHelper';
import restService from 'features/shared/services/restService';

class TestScenarioService {
  async getListAsync(projectId, workId) {
    const url = `/project/${projectId}/test-scenario/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createBatchAsync(projectId, workId, data) {
    const url = `/project/${projectId}/test-scenario/${workId}/batch-create`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async updateAsync(projectId, workId, data) {
    const url = `/project/${projectId}/test-scenario/${workId}/${data?.id}`;
    const response = await restServiceHelper.requestAsync(restService.putAsync(url, data));
    return response;
  }
}

export default new TestScenarioService();
