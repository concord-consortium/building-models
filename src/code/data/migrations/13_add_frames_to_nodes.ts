/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const migration = {
  version: "1.12.0",
  description: "Adds minigraphs data",
  date: "2016-03-16",

  doUpdate(data) {
    return this.updateNodes(data);
  },

  updateNodes(data) {
    return Array.from(data.nodes).map((node) =>
      node.data.frames != null ? node.data.frames : (node.data.frames = []));
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
