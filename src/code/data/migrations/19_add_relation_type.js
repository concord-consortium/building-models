/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const migration = {
  version: "1.18.0",
  description: "Adds link relationship type",
  date: "2016-05-24",

  doUpdate(data) {

    return Array.from(data.links).map((link) =>
      link.relation.type != null ? link.relation.type : (link.relation.type = "range"));
  }
};

module.exports = _.mixin(migration, require('./migration-mixin'));
