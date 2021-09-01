class Language {
  constructor() {
    this._code = 'en';
    this._values = {};
  }

  add = (code, values) => {
    this._values = values.default;
    this._code = code;
  };

  get = (key) => this._values[key] ?? key;
}

export default new Language();
