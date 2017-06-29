class Store {

  constructor() {
    this._isDevelopment = true;
    this._isWatching = false;
  }

  setDevelopment() {
    this._isDevelopment = true;
  }

  setProduction() {
    this._isDevelopment = false;
  }

  setWatching() {
    this._isWatching = true;
  }

  isDevelopment() {
    return this._isDevelopment;
  }

  isProduction() {
    return !this._isDevelopment;
  }

  isWatching() {
    return this._isWatching;
  }

}

export default new Store;
