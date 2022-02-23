class RestServiceHelper {
  handleResponse(response) {
    if (response.status >= 200 && response.status < 300) {
      return { data: response.data };
    }

    return {
      error: {
        data: response.data,
        code: response.status,
        message: response.toString,
      },
    };
  }

  handleError(error) {
    return {
      error: {
        data: error.response.data,
        code: error.response.status,
        message: error.toString(),
      },
    };
  }

  async requestAsync(action) {
    try {
      const response = await action;
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export default new RestServiceHelper();
