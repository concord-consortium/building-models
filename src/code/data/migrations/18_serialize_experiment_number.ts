// TODO: remove when modules are converted to TypeScript style modules
export {};

const migration = {
  version: "1.17.0",
  description: "Adds experiment number to serialization",
  date: "2017-01-09",

  doUpdate(data) {
    if (data.settings.simulation) {
      data.settings.simulation.experimentNumber = data.settings.simulation.experimentNumber || 0;
      data.settings.simulation.experimentFrame  = data.settings.simulation.experimentFrame || 0;
    }
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
