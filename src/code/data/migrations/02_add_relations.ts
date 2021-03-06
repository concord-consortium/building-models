const _ = require("lodash");
import { MigrationMixin } from "./migration-mixin";
import { Relationship } from "../../models/relationship";

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
    for (const node of data.nodes) {
      if (!node.data) { node.data = {}; } // should never happen
      node.data.initialValue = 50;
      node.data.isAccumulator = false;
    }
  },

  // Add initialValue if it doesn't exist
  updateLinks(data) {
    const defaultRelation = {
      text        : Relationship.defaultText,
      formula     : Relationship.defaultFormula
    };

    return data.links.map((link) =>
      (link.relation = _.clone(defaultRelation)));
  }
};

export const migration_02 = _.mixin(migration, MigrationMixin);
