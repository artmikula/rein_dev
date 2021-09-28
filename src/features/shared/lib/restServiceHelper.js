class RestServiceHelper {
  handleResponse(response) {
    if (response.status >= 200 && response.status < 300) {
      return { data: response.data };
    }

    return { error: response.data };
  }

  handleError(error) {
    if (error.response && error.response.data) {
      return { error: error.response.data };
    }

    return { error: error.toString() };
  }

  async requestAsync(action) {
    try {
      const response = await action;
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error.message);
    }
  }
}

export default new RestServiceHelper();
