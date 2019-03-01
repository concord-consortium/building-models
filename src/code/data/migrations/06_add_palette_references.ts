/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const uuid = require("uuid");

import { MigrationMixin } from "./migration-mixin";

const imageToUUIDMap = {};

const migration = {
  version: "1.5.0",
  description: "Nodes reference PaletteItems",
  date: "2015-09-16",

  doUpdate(data) {
    this.updatePalette(data);
    return this.updateNodes(data);
  },

  updatePalette(data) {
    return _.each(data.palette, (paletteItem) => {
      if (!paletteItem.uuid) { paletteItem.uuid = uuid.v4(); }
      return imageToUUIDMap[paletteItem.image] = paletteItem.uuid;
    });
  },

  // Add initialValue if it doesn't exist
  updateNodes(data) {
    return (() => {
      const result: any = [];
      for (const node of data.nodes) {
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

export const migration_06 = _.mixin(migration, MigrationMixin);
