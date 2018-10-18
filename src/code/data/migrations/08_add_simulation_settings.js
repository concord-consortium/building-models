/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const TimeUnits = require("../../utils/time-units");

const migration = {
  version: "1.7.0",
  description: "Adds Simulation settings",
  date: "2015-10-02",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    if (data.settings.simulation == null) { data.settings.simulation = {}; }
    if (data.settings.simulation.period == null) { data.settings.simulation.period = 10; }
    if (data.settings.simulation.stepSize == null) { data.settings.simulation.stepSize = 1; }
    data.settings.simulation.periodUnits = TimeUnits.defaultUnit;
    return data.settings.simulation.stepUnits = TimeUnits.defaultUnit;
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
