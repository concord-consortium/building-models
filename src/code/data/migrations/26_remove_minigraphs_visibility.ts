const _ = require("lodash");

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.25.0",
  description: "Removes minigraphs settings",
  date: "2018-11-23",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    delete data.settings.showMinigraphs;
  }
};

export const migration_26 = _.mixin(migration, MigrationMixin);
