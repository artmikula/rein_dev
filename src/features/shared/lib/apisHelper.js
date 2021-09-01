class APIsHelper {
  getUrlQueryParams(url, params) {
    let newUrl = url;
    const searchParams = new URLSearchParams();
    const keys = Object.keys(params);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i]) {
        searchParams.append(keys[i], params[keys[i]]);
      }
    }
    const qs = searchParams.toString();

    if (qs) {
      newUrl += `?${qs}`;
    }

    return newUrl;
  }
}
export default new APIsHelper();
