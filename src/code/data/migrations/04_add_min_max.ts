const _ = require("lodash");
import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.3.0",
  description: "Adds min and max values for nodes.",
  date: "2015-09-03",

  doUpdate(data) {
    return this.updateNodes(data);
  },

  // Add initialValue if it doesn't exist
  updateNodes(data) {
    for (const node of data.nodes) {
      if (!node.data) { node.data = {}; } // should never happen
      node.data.min = 0;
      node.data.max = 100;
    }
  }
};

export const migration_04 = _.mixin(migration, MigrationMixin);
