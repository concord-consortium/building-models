/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const migration = {
  version: "1.14.0",
  description: "Clamp less-and-less relationship to go down to zero. Fixes case where input values below 0 would produce imaginary number results",
  date: "2016-05-24",

  doUpdate(data) {

    return (() => {
      const result:any = [];
      for (let link of data.links) {
        if (link.relation.formula === "maxIn - 21.7 * log(in+1)") {
          link.relation.formula = "maxIn - 21.7 * log(max(1,in))";
        }
        if (link.relation.formula === "1 * 21.7 * log(in+1)") {
          result.push(link.relation.formula = "1 * 21.7 * log(max(1,in))");
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));

