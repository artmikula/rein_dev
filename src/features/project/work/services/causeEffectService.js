import restServiceHelper from '../../../shared/lib/restServiceHelper';
import restService from '../../../shared/services/restService';

class CauseEffectService {
  async listAsync(token, projectId, workId) {
    const url = `/project/${projectId}/cause-effect/${workId}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.getAsync(url));
    return response;
  }

  async createAsync(token, projectId, workId, data) {
    const url = `/project/${projectId}/cause-effect/${workId}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.postAsync(url, data));
    return response;
  }

  async deleteAsync(token, projectId, workId, id) {
    const url = `/project/${projectId}/cause-effect/${workId}/${id}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.deleteAsync(url));
    return response;
  }

  async updateAsync(token, projectId, workId, id, data) {
    const url = `/project/${projectId}/cause-effect/${workId}/${id}`;
    restService.setToken(token);
    const response = await restServiceHelper.requestAsync(restService.putAsync(url, data));
    return response;
  }
}
export default new CauseEffectService();
