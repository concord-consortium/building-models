const _ = require("lodash");
import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.14.0",
  description: "Clamp less-and-less relationship to go down to zero. Fixes case where input values below 0 would produce imaginary number results",
  date: "2016-05-24",

  doUpdate(data) {
    for (const link of data.links) {
      if (link.relation.formula === "maxIn - 21.7 * log(in+1)") {
        link.relation.formula = "maxIn - 21.7 * log(max(1,in))";
      }
      if (link.relation.formula === "1 * 21.7 * log(in+1)") {
        link.relation.formula = "1 * 21.7 * log(max(1,in))";
      }
    }
  }
};

export const migration_15 = _.mixin(migration, MigrationMixin);

