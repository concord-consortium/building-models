/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const migration = {
  version: "1.13.0",
  description: "Removes new integration setting",
  date: "2016-01-17",

  doUpdate(data) {
    return __guard__(data.settings != null ? data.settings.simulation : undefined, x => delete x.newIntegration);
  }
};


module.exports = _.mixin(migration, require("./migration-mixin"));

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
