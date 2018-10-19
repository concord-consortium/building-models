/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const migration = {
  version: "1.12.0",
  description: "Adds minigraphs data",
  date: "2016-03-16",

  doUpdate(data) {
    return this.updateNodes(data);
  },

  updateNodes(data) {
    return data.nodes.map((node) =>
      node.data.frames != null ? node.data.frames : (node.data.frames = []));
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
