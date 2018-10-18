/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const migration = {
  version: "1.3.0",
  description: "Adds min and max values for nodes.",
  date: "2015-09-03",

  doUpdate(data) {
    return this.updateNodes(data);
  },

  // Add initialValue if it doesn't exist
  updateNodes(data) {
    return (() => {
      const result:any = [];
      for (let node of data.nodes) {
        if (!node.data) { node.data = {}; } // should never happen
        node.data.min = 0;
        result.push(node.data.max = 100);
      }
      return result;
    })();
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
