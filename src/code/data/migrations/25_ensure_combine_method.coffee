AppSettingsStore = require('../../stores/app-settings-store').store

migration =
  version: "1.24.0"
  description: "Ensure that every node serializes a `combineMethod` value"
  date: "2018-10-15"

  doUpdate: (data) ->
    data.settings ?= {}
    # This migration explicitly sets the `combineMethod` for nodes without them.
    # Previously it was permitted to leave this value unspecified. However, this
    # caused confusion because the UI was not connected to simulation behavior.
    #
    # A combine method is by default 'average' unless the node is
    # linked to a collector node (aka `target.isAccumulator` is true)

    nodes = data.nodes
    links = data.links
    accumulatorNodes = _.select(nodes, (n) -> n.data.isAccumulator == true)
    accumulatorNodesNames = _.map(accumulatorNodes, (n) -> n.key)
    linksToAccumulators = _.select(links, (l) -> _.includes(accumulatorNodesNames, l.targetNode))
    productNodeNames = _.uniq(_.map(linksToAccumulators, (l) -> l.sourceNode))
    _.each(nodes, (n) ->
      if n.data.combineMethod == undefined
        if _.include(productNodeNames, n.key)
          n.data.combineMethod = 'product'
        else
          n.data.combineMethod = 'average'
    )

module.exports = _.mixin migration, require './migration-mixin'