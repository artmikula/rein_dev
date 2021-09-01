import projectService from './projectService';
import restService from '../../shared/services/restService';

const ERROR = 'error';
const UNSUCCESS = 'unsuccess';
jest.mock('../../shared/services/restService');
describe('test project service', () => {
  it('test listAsync success', async () => {
    const response = { status: 200, data: [{ id: 1, name: 'project 1', createdDate: new Date() }] };
    restService.getAsync = async () => {
      return response;
    };
    const data = await projectService.listAsync(1, 2, 'name');

    expect(data).toEqual(response.data);
  });

  it('test listAsync failed', async () => {
    restService.getAsync = async () => {
      throw ERROR;
    };
    let _error;
    try {
      await projectService.listAsync(1, 2, 'name');
    } catch (error) {
      _error = error;
    }
    expect(_error).toEqual(ERROR);
  });

  it('test getAsync success', async () => {
    const response = { status: 200, data: { id: 1, name: 'project 1', createdDate: new Date() } };
    restService.getAsync = async () => {
      return response;
    };
    const data = await projectService.getAsync(1);

    expect(data).toEqual(response.data);
  });

  it('test getAsync failed', async () => {
    restService.getAsync = async () => {
      throw ERROR;
    };
    let _error;
    try {
      await projectService.getAsync(1);
    } catch (error) {
      _error = error;
    }
    expect(_error).toEqual(ERROR);
  });

  it('test createAsync success', async () => {
    const response = { status: 200, data: 1 };
    restService.postAsync = async () => {
      return response;
    };
    const data = await projectService.createAsync({});

    expect(data).toEqual({ data: response.data });
  });

  it('test createAsync unsuccess', async () => {
    const response = { status: 400, data: UNSUCCESS };
    restService.postAsync = async () => {
      return response;
    };
    const data = await projectService.createAsync({});

    expect(data).toEqual({ error: response.data });
  });

  it('test createAsync failed', async () => {
    restService.postAsync = async () => {
      throw ERROR;
    };

    const data = await projectService.createAsync({});
    expect(data.error).toEqual(ERROR);
  });

  it('test updateAsync success', async () => {
    const response = { status: 200, data: 1 };
    restService.putAsync = async () => {
      return response;
    };
    const data = await projectService.updateAsync(1, {});

    expect(data).toEqual({ data: response.data });
  });

  it('test updateAsync unsuccess', async () => {
    const response = { status: 400, data: UNSUCCESS };
    restService.putAsync = async () => {
      return response;
    };
    const data = await projectService.updateAsync(1, {});

    expect(data).toEqual({ error: response.data });
  });

  it('test updateAsync failed', async () => {
    restService.putAsync = async () => {
      throw ERROR;
    };

    const data = await projectService.updateAsync(1, {});
    expect(data.error).toEqual(ERROR);
  });

  it('test importAsync success', async () => {
    jest.mock('../../shared/services/restService');
    const response = { status: 200, data: 1 };
    restService.postAsync = async () => {
      return response;
    };
    const data = await projectService.importAsync({});

    expect(data).toEqual({ data: response.data });
  });

  it('test importAsync unsuccess', async () => {
    jest.mock('../../shared/services/restService');
    const response = { status: 400, data: UNSUCCESS };
    restService.postAsync = async () => {
      return response;
    };
    const data = await projectService.importAsync({});

    expect(data).toEqual({ error: response.data });
  });

  it('test importAsync failed', async () => {
    jest.mock('../../shared/services/restService');
    restService.postAsync = async () => {
      throw ERROR;
    };

    const data = await projectService.importAsync({});
    expect(data.error).toEqual(ERROR);
  });

  it('test deleteAsync success', async () => {
    jest.mock('../../shared/services/restService');
    const response = { status: 200, data: 1 };
    restService.deleteAsync = async () => {
      return response;
    };
    const data = await projectService.deleteAsync(1);

    expect(data).toEqual({ data: response.data });
  });

  it('test deleteAsync unsuccess', async () => {
    jest.mock('../../shared/services/restService');
    const response = { status: 400, data: UNSUCCESS };
    restService.deleteAsync = async () => {
      return response;
    };
    const data = await projectService.deleteAsync(1);

    expect(data).toEqual({ error: response.data });
  });

  it('test deleteAsync failed', async () => {
    jest.mock('../../shared/services/restService');
    restService.deleteAsync = async () => {
      throw ERROR;
    };

    const data = await projectService.deleteAsync(1);
    expect(data.error).toEqual(ERROR);
  });
});
