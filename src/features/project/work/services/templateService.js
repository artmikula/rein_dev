import restServiceHelper from 'features/shared/lib/restServiceHelper';
import restService from 'features/shared/services/restService';

class TemPlateService {
  createAsync = (projectId, workId, data) => {
    const url = `/re-in/template/${projectId}/${workId}`;

    return restServiceHelper.requestAsync(restService.postAsync(url, data));
  };

  loadTemplate = (projectId, workId, templateId) => {
    const url = `/re-in/template/${templateId}/${projectId}/${workId}/import`;

    return restServiceHelper.requestAsync(restService.postAsync(url));
  };

  updateAsync = (projectId, workId, data) => {
    const url = `/re-in/template/${data.id}/${projectId}/${workId}`;

    return restServiceHelper.requestAsync(restService.putAsync(url, data));
  };

  deleteAsync = (templateId) => {
    const url = `/re-in/template/${templateId}`;

    return restServiceHelper.requestAsync(restService.deleteAsync(url));
  };

  listAsync = (page = 1, pageSize = 10, filter = '') => {
    const url = `/re-in/template?page=${page}&pageSize=${pageSize}&filter=${filter}`;

    return restServiceHelper.requestAsync(restService.getAsync(url));
  };
}

const templateService = new TemPlateService();

export default templateService;
