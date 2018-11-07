/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.15.0",
  description: "Adds link reasoning",
  date: "2016-05-24",

  doUpdate(data) {

    return data.links.map((link) =>
      link.reasoning != null ? link.reasoning : (link.reasoning = ""));
  }
};

export const migration_16 = _.mixin(migration, MigrationMixin);
