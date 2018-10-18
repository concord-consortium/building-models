/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AppSettingsStore = require('../../stores/app-settings-store').store;

const migration = {
  version: "1.23.0",
  description: "Fix simulation type - 1.21.0 to 1.22.0 sim-type broken",
  date: "2018-10-15",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }

    // This migration addresses a failing case where a simulation with
    // collector nodes was not coreectly migrating the simulationType
    // to time-based.

    if (_.some(data.nodes, node => node.data.isAccumulator)) {
      return data.settings.simulationType = AppSettingsStore.SimulationType.time;
    }
  }
};

module.exports = _.mixin(migration, require('./migration-mixin'));