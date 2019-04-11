const _ = require("lodash");
import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.2.0",
  description: "Adds initial value for defining node semiquantitatively.",
  date: "2015-09-02",

  doUpdate(data) {
    return this.updateNodes(data);
  },

  // Add initialValue if it doesn't exist
  updateNodes(data) {
    for (const node of data.nodes) {
      if (!node.data) { node.data = {}; } // should never happen
      node.data.valueDefinedSemiQuantitatively = true;
    }
  }
};

export const migration_03 = _.mixin(migration, MigrationMixin);
