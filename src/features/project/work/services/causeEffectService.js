import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class CauseEffectService {
  async listAsync(projectId, workId) {
    const url = `/project/${projectId}/cause-effect/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createAsync(projectId, workId, data) {
    const url = `/project/${projectId}/cause-effect/${workId}`;
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async deleteAsync(projectId, workId, id) {
    const url = `/project/${projectId}/cause-effect/${workId}/${id}`;
    const response = await restServiceHelper.requestAsync(restService.deleteAsync(url));
    return response;
  }

  async updateAsync(projectId, workId, id, data) {
    const url = `/project/${projectId}/cause-effect/${workId}/${id}`;
    const response = await restServiceHelper.requestAsync(restService.putAsync(url, data));
    return response;
  }
}
export default new CauseEffectService();
