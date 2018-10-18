/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const migration = {
  version: "1.8.0",
  description: "Updates duration settings",
  date: "2015-10-14",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    if (data.settings.simulation == null) { data.settings.simulation = {}; }

    const { simulation } = data.settings;

    if ((simulation.duration == null)) {
      if ((simulation.period != null) && (simulation.stepSize != null)) {
        simulation.duration = Math.floor(simulation.period / simulation.stepSize);
      } else {
        simulation.duration = 10;
      }
    }

    delete data.settings.simulation.period;
    delete data.settings.simulation.stepSize;
    return delete data.settings.simulation.periodUnits;
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
