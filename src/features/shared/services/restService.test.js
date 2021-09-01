import axios from 'axios';
import restService from './restService';
import authService from '../authorization/AuthorizeService';

jest.mock('axios');
const token = 'Thepassingtoken';
const fakeConfig = {
  headers: {
    Authorization: token,
    'test-custom-header': 'test custom-header-setting',
  },
};

describe('Http request with jest mocking', () => {
  it('Validate the passing token', async () => {
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue(token);
    jest.spyOn(restService, 'config').mockReturnValue(fakeConfig);
    const fakeToken = await authService.getAccessToken();
    expect(token).toEqual(fakeToken);
  });

  it('Test http get method', async () => {
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue(token);
    jest.spyOn(restService, 'config').mockReturnValue(fakeConfig);
    const url = 'getMethod';
    await restService.getAsync(url);

    expect(axios.get).toBeCalledWith(url, fakeConfig);
  });

  it('Test http put method', async () => {
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue(token);
    jest.spyOn(restService, 'config').mockReturnValue(fakeConfig);
    const url = 'putMethod';
    const data = {
      id: 1,
      title: 'test',
    };

    await restService.putAsync('putMethod', data);

    expect(axios.put).toBeCalledWith(url, data, fakeConfig);
  });

  it('Test http post method', async () => {
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue(token);
    jest.spyOn(restService, 'config').mockReturnValue(fakeConfig);
    const url = 'postMethod';
    const data = {
      id: 1,
      title: 'test',
    };

    await restService.postAsync(url, data);

    expect(axios.post).toBeCalledWith(url, data, fakeConfig);
  });

  it('Test http delete method', async () => {
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue(token);
    jest.spyOn(restService, 'config').mockReturnValue(fakeConfig);
    const url = 'deleteMethod';

    await restService.deleteAsync(url);

    expect(axios.delete).toBeCalledWith(url, fakeConfig);
  });

  it('Test http patch method', async () => {
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue(token);
    jest.spyOn(restService, 'config').mockReturnValue(fakeConfig);
    const url = 'patchMethod';
    const data = {
      id: 1,
      title: 'test',
    };

    await restService.patchAsync(url, data);

    expect(axios.patch).toBeCalledWith(url, data, fakeConfig);
  });
});
