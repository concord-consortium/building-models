const _ = require("lodash");

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.21.0",
  description: "Add optional `combineMethod` param to nodes. NO-OP",
  date: "2018-01-29",

  // Nothing to do here, this is an optional field.
  // Not present in most nodes. NP 2018-01-29
  doUpdate(data) {
    return;
  }
};

export const migration_22 = _.mixin(migration, MigrationMixin);
