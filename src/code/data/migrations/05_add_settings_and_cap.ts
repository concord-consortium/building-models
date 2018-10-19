/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const migration = {
  version: "1.4.0",
  description: "Adds settings object and cap default.",
  date: "2015-09-17",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    return data.settings.capNodeValues != null ? data.settings.capNodeValues : (data.settings.capNodeValues = false);
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
