import axios from 'axios';
import restServiceHelper from 'features/shared/lib/restServiceHelper';

const { REACT_APP_RE_IN_CLOUD_URL } = process.env;

class ReInCloudService {
  constructor() {
    this._cloudUrl = REACT_APP_RE_IN_CLOUD_URL ?? 'https://dev.userinsight.co.kr/rein-cloud';
    this._token = '';
  }

  config = (token, customHeader = {}) => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        ...customHeader,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
      },
    };
  };

  setToken(jwt) {
    this._token = jwt;
  }

  async uploadTestCases(data) {
    const url = '/api/design-result/upload';
    const fullUrl = this._cloudUrl + url;
    // const fullUrl1 = 'https://localhost:44320/api/projects/UploadFile';

    return restServiceHelper.requestAsync(
      axios.post(fullUrl, data, this.config(this._token, { 'Content-Type': 'multipart/form-data' }))
    );
  }
}

const reInCloudService = new ReInCloudService();

export default reInCloudService;
