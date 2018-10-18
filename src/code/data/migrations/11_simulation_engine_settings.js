/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const migration = {
  version: "1.10.0",
  description: "Adds simulation engine settings",
  date: "2016-01-16",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    if (data.settings.simulation == null) { data.settings.simulation = {}; }

    return data.settings.simulation.newIntegration != null ? data.settings.simulation.newIntegration : (data.settings.simulation.newIntegration = false);
  }
};


module.exports = _.mixin(migration, require('./migration-mixin'));
