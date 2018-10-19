/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const PARAM_TOKEN = /[?|&]/g;
const VALUE_TOKEN = "=";

class HashParameters {
  private parameters: any;

  constructor() {
    this.parameters = {};
  }

  decode(string) {
    return decodeURIComponent(string);
  }

  encode(string) {
    return encodeURIComponent(string);
  }

  fromLocationHash() {
    this.parameters = {};
    const hash = this.readHash();

    const keyPairs = hash.split(PARAM_TOKEN);
    return _.each(keyPairs, pair => {
      if (pair.match(VALUE_TOKEN)) {
        const [key, value] = pair.split(VALUE_TOKEN);
        return this.parameters[key] = this.decode(value);
      }
    });
  }

  updateLocationhash() {
    const keys = _.keys(this.parameters);
    const strings = _.map(keys, key => {
      const value = this.parameters[key];
      return [key, this.encode(value)].join(VALUE_TOKEN);
    });
    return this.writeHash(strings.join("&"));
  }

  setParam(key,value) {
    this.parameters[key] = value;
    return this.updateLocationhash();
  }

  getParam(key) {
    this.fromLocationHash();
    return this.parameters[key];
  }

  clearParam(key) {
    delete this.parameters[key];
    return this.updateLocationhash();
  }

  writeHash(string) {
    if (window && window.location) {
      if (string.length < 1) {
        return window.location.hash = "";
      } else {
        return window.location.hash = `?${string}`;
      }
    }
  }

  readHash() {
    let hash;
    try {
      if (window && window.top.location) {
        // remove the leading slash
        hash = window.top.location.hash.substring(1);
      }
    } catch (error) {     // x-origin exception
      if (window && window.location) {
        hash = window.location.hash.substring(1);
      }
    }
    return hash || "";
  }
}


module.exports = new HashParameters();
