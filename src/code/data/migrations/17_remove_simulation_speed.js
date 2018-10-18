/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const migration = {
  version: "1.16.0",
  description: "Removes simulation setting for speed",
  date: "2016-11-17",

  doUpdate(data) {
    return __guard__(data.settings != null ? data.settings.simulation : undefined, x => delete x.speed);
  }
};

module.exports = _.mixin(migration, require('./migration-mixin'));

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}