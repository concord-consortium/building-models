/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AppSettingsStore = require("../../stores/app-settings-store").store;

const migration = {
  version: "1.24.0",
  description: "Ensure that every node serializes a `combineMethod` value",
  date: "2018-10-15",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }
    // This migration explicitly sets the `combineMethod` for nodes without them.
    // Previously it was permitted to leave this value unspecified. However, this
    // caused confusion because the UI was not connected to simulation behavior.
    //
    // A combine method is by default 'average' unless the node is
    // linked to a collector node (aka `target.isAccumulator` is true)

    const { nodes } = data;
    const { links } = data;
    const accumulatorNodes = _.select(nodes, n => n.data.isAccumulator === true);
    const accumulatorNodesNames = _.map(accumulatorNodes, n => n.key);
    const linksToAccumulators = _.select(links, l => _.includes(accumulatorNodesNames, l.targetNode));
    const productNodeNames = _.uniq(_.map(linksToAccumulators, l => l.sourceNode));
    return _.each(nodes, function(n) {
      if (n.data.combineMethod === undefined) {
        if (_.include(productNodeNames, n.key)) {
          return n.data.combineMethod = "product";
        } else {
          return n.data.combineMethod = "average";
        }
      }
    });
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));