class LocalStorage {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.log(err);
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.log(err);
    }
  }
}

export default new LocalStorage();
