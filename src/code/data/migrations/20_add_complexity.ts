/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AppSettingsStore = require("../../stores/app-settings-store").store;

const migration = {
  version: "1.19.0",
  description: "Adds complexity setting, based on old diagramOnly. Removes diagramOnly",
  date: "2017-09-26",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    const wasDiagramOnly = data.settings.diagramOnly || false;

    delete data.settings.diagramOnly;

    const defaultComplexity = wasDiagramOnly ?
      0 // was `AppSettingsStore.Complexity.diagramOnly` but this no longer exists as of 1.22.0
      :
      2; // was `AppSettingsStore.Complexity.DEFAULT` but this is now '1' as of 1.22.0

    return data.settings.complexity != null ? data.settings.complexity : (data.settings.complexity = defaultComplexity);
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
