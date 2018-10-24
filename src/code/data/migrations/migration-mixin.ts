/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Implement version: xx and doUpdate: (data) ->  in your migrations.
// and mixin this module

const semver = require("semver");

export const MigrationMixin = {

  needsUpdate(data) {
    let version = data.version || "0.0.0";

    if (typeof version === "number") { version = this._semverize(version); }

    return semver.gt(this.version, version);
  },

  name() {
    return `${this.version} – ${this.date} : ${this.description}`;
  },

  update(data) {
    if (this.needsUpdate(data)) {
      this.doUpdate(data);
      log.info(`✔ upgradded ${this.name()}`);
      data.version = this.version;
    } else {
      log.info(`  skipped : ${this.name()}`);
    }
    return data;
  },

  // Change x.y to "x.y.0". The only annoyance is we have to special-case 1.95,
  // as this was supposed to be < 1.10.0
  _semverize(v) {
    if (v === 1.95) {
      return "1.9.5";
    } else {
      return v + ".0";
    }
  }
};

