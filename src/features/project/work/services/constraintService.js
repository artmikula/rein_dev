import restServiceHelper from 'features/shared/lib/restServiceHelper';
import restService from 'features/shared/services/restService';

class ConstraintService {
  async getListAsync(projectId, workId) {
    const url = `api/project/${projectId}/constraint/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createBatchAsync(projectId, workId, data) {
    const url = `api/project/${projectId}/constraint/${workId}/batch-create`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async deleteBatchAsync(projectId, workId, ids) {
    const url = `api/project/${projectId}/constraint/${workId}/batch-delete`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, ids));
    return response;
  }

  async updateBatchAsync(projectId, workId, data) {
    const url = `api/project/${projectId}/constraint/${workId}/batch-update`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}

export default new ConstraintService();
