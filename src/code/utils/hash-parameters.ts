/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

const PARAM_TOKEN = /[?|&]/g;
const VALUE_TOKEN = "=";

interface HashParameterMap {
  [key: string]: string | undefined;
}

class HashParameters {
  private parameters: HashParameterMap;

  constructor() {
    this.parameters = {};
  }

  public decode(string) {
    return decodeURIComponent(string);
  }

  public encode(string) {
    return encodeURIComponent(string);
  }

  public fromLocationHash() {
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

  public updateLocationhash() {
    const keys = _.keys(this.parameters);
    const strings = _.map(keys, key => {
      const value = this.parameters[key];
      return [key, this.encode(value)].join(VALUE_TOKEN);
    });
    return this.writeHash(strings.join("&"));
  }

  public setParam(key, value) {
    this.parameters[key] = value;
    return this.updateLocationhash();
  }

  public getParam(key) {
    this.fromLocationHash();
    return this.parameters[key];
  }

  public clearParam(key) {
    delete this.parameters[key];
    return this.updateLocationhash();
  }

  public writeHash(string) {
    if (window && window.location) {
      if (string.length < 1) {
        return window.location.hash = "";
      } else {
        return window.location.hash = `?${string}`;
      }
    }
  }

  public readHash() {
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

export const HashParams = new HashParameters();
