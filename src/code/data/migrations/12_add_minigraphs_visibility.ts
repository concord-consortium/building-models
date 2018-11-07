/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.11.0",
  description: "Adds minigraphs settings",
  date: "2016-03-15",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    return data.settings.showMinigraphs != null ? data.settings.showMinigraphs : (data.settings.showMinigraphs = false);
  }
};

export const migration_12 = _.mixin(migration, MigrationMixin);
