/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.16.0",
  description: "Removes simulation setting for speed",
  date: "2016-11-17",

  doUpdate(data) {
    return __guard__(data.settings != null ? data.settings.simulation : undefined, x => delete x.speed);
  }
};

export const migration_17 = _.mixin(migration, MigrationMixin);

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
