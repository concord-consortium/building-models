/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const migration = {
  version: "1.17.0",
  description: "Adds experiment number to serialization",
  date: "2017-01-09",

  doUpdate(data) {
    if (data.settings.simulation != null) {
      data.settings.simulation.experimentNumber || (data.settings.simulation.experimentNumber = 0);
    }
    return (data.settings.simulation != null ? data.settings.simulation.experimentFrame || (data.settings.simulation.experimentFrame = 0) : undefined);
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
