class CookiesHelper {
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }

    return undefined;
  }

  getLanguageCode() {
    const culture = this.getCulture();
    if (culture) {
      if (culture.indexOf('ko-') > -1) {
        return 'ko';
      }

      if (culture.indexOf('vi-') > -1) {
        return 'vi';
      }

      if (culture.indexOf('th-') > -1) {
        return 'th';
      }
    }

    return 'en';
  }

  getCulture() {
    const cookieName = '.AspNetCore.Culture';
    return this.getCookie(cookieName);
  }
}

export default new CookiesHelper();
