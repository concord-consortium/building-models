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
    for (const node of data.nodes) {
      if (node.data.image) {
        node.data.paletteItem = imageToUUIDMap[node.data.image];
      }
    }
  }
};

export const migration_06 = _.mixin(migration, MigrationMixin);
