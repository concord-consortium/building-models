/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const RelationFactory  = require("../models/relation-factory");

var linkColors = (module.exports = {
  default             :"#777",
  defaultFaded        : "rgba(120,120,120,0)",
  increase            : "rgba(232,93,100,1)",
  decrease            : "rgba(142,162,225,1)",
  transferModifier    : "rgba(232,93,100,1)",
  transferPipe        : "rgba(185,185,185,1)",
  increaseFaded       : "rgba(232,93,100,0.2)",
  decreaseFaded       : "rgba(142,162,225,0.2)",
  dashed              : "#aaa",
  selectedOutline     : "rgba(250,200,60,0.7)",
  customRelationship  : "#778",
  defaultLight        : "#233",
  fromLink(link) {
    if (((link.relation != null ? link.relation.formula : undefined) == null)) { return linkColors.default; }
    switch (link.relation.formula) {
    case RelationFactory.added.formula: return linkColors.increase;
    case RelationFactory.subtracted.formula: return linkColors.decrease;
    case RelationFactory.proportionalSourceLess.formula: return linkColors.decrease;
    case RelationFactory.proportionalSourceMore.formula: return linkColors.increase;
    default: return linkColors.default;
    }
  }
});
