import restServiceHelper from 'features/shared/lib/restServiceHelper';
import restService from 'features/shared/services/restService';

class GraphNodeService {
  async getListAsync(projectId, workId) {
    const url = `/project/${projectId}/graph-node/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createBatchAsync(projectId, workId, data) {
    const url = `/project/${projectId}/graph-node/${workId}/batch-create`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async deleteBatchAsync(projectId, workId, ids) {
    const url = `/project/${projectId}/graph-node/${workId}/batch-delete`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, ids));
    return response;
  }

  async updateBatchAsync(projectId, workId, data) {
    const url = `/project/${projectId}/graph-node/${workId}/batch-update`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }
}

export default new GraphNodeService();
