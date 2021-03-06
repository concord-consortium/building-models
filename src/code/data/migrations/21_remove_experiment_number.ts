/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.20.0",
  description: "Removes experiment and frame numbers",
  date: "2017-10-03",

  doUpdate(data) {
    if (data.settings.simulation != null) {
      delete data.settings.simulation.experimentNumber;
    }
    return (data.settings.simulation != null ? delete data.settings.simulation.experimentFrame : undefined);
  }
};

export const migration_21 = _.mixin(migration, MigrationMixin);
