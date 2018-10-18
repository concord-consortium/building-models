/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Relationship = require("../../models/relationship");

const migration = {
  version: "1.1.0",
  description: "Adds initial values and relationships.",
  date: "2015-08-13",

  doUpdate(data) {
    this.updateNodes(data);
    return this.updateLinks(data);
  },

  // Add initialValue if it doesn't exist
  updateNodes(data) {
    return (() => {
      const result = [];
      for (let node of Array.from(data.nodes)) {
        if (!node.data) { node.data = {}; } // should never happen
        node.data.initialValue = 50;
        result.push(node.data.isAccumulator = false);
      }
      return result;
    })();
  },

  // Add initialValue if it doesn't exist
  updateLinks(data) {
    const defaultRelation = {
      text        : Relationship.defaultText,
      formula     : Relationship.defaultFormula
    };

    return Array.from(data.links).map((link) =>
      (link.relation = _.clone(defaultRelation)));
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
