
// TODO: remove when modules are converted to TypeScript style modules
export {}

const migration = {
  version: "1.21.0",
  description: "Add optional `combineMethod` param to nodes. NO-OP",
  date: "2018-01-29",

  doUpdate(data) {}
};
// Nothing to do here, this is an optional field.
// Not present in most nodes. NP 2018-01-29

module.exports = _.mixin(migration, require("./migration-mixin"));
