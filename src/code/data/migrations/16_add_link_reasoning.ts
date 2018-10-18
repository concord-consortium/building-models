/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const migration = {
  version: "1.15.0",
  description: "Adds link reasoning",
  date: "2016-05-24",

  doUpdate(data) {

    return data.links.map((link) =>
      link.reasoning != null ? link.reasoning : (link.reasoning = ""));
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
