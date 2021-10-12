class LanguageService {
  constructor() {
    this.key = 'CETA_LANGUAGE_KEY';
  }

  set = (language) => {
    localStorage.setItem(this.key, JSON.stringify(language));
  };

  get = () => {
    const value = localStorage.getItem(this.key);

    if (value) {
      return JSON.parse(value);
    }

    return { code: 'en', name: 'English' };
  };
}

const languageService = new LanguageService();

export default languageService;
