/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const migration = {
  version: "1.11.0",
  description: "Adds minigraphs settings",
  date: "2016-03-15",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    return data.settings.showMinigraphs != null ? data.settings.showMinigraphs : (data.settings.showMinigraphs = false);
  }
};


module.exports = _.mixin(migration, require("./migration-mixin"));
