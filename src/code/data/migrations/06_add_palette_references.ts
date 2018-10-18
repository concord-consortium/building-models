/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const uuid = require("uuid");

const imageToUUIDMap= {};

const migration = {
  version: "1.5.0",
  description: "Nodes reference PaletteItems",
  date: "2015-09-16",

  doUpdate(data) {
    this.updatePalette(data);
    return this.updateNodes(data);
  },

  updatePalette(data) {
    return _.each(data.palette, function(paletteItem) {
      if (!paletteItem.uuid) { paletteItem.uuid = uuid.v4(); }
      return imageToUUIDMap[paletteItem.image] = paletteItem.uuid;
    });
  },

  // Add initialValue if it doesn't exist
  updateNodes(data) {
    return (() => {
      const result:any = [];
      for (let node of data.nodes) {
        if (node.data.image) {
          result.push(node.data.paletteItem = imageToUUIDMap[node.data.image]);
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
