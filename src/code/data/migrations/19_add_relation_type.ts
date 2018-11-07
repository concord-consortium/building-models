/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.18.0",
  description: "Adds link relationship type",
  date: "2016-05-24",

  doUpdate(data) {

    return data.links.map((link) =>
      link.relation.type != null ? link.relation.type : (link.relation.type = "range"));
  }
};

export const migration_19 = _.mixin(migration, MigrationMixin);
