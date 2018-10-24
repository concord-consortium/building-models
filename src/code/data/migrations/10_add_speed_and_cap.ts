/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.9.0",
  description: "Adds simulation speed and capNodeValues settings",
  date: "2015-10-14",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    if (data.settings.simulation == null) { data.settings.simulation = {}; }

    if (data.settings.simulation.speed == null) { data.settings.simulation.speed = 4; }

    if ((data.settings.simulation.capNodeValues == null)) {
      if (data.settings.capNodeValues) {
        data.settings.simulation.capNodeValues = data.settings.capNodeValues;
      } else {
        data.settings.simulation.capNodeValues = false;
      }
    }

    return delete data.settings.capNodeValues;
  }
};

export const migration_10 = _.mixin(migration, MigrationMixin);
