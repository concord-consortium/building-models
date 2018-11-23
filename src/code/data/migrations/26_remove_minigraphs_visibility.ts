/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

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
