
# GraphPrimitive is the basis for the Node and Link classes.
# They share a common ID generation mechanism mostly.
module.exports = class GraphPrimitive
  @counters: {}

  @resetCounters: ->
    GraphPrimitive.counters = {}

  @initCounters: (options) ->
    {links, nodes} = options
    # transfer nodes are in the node list so first pull them out
    transferNodes = _.filter(nodes, (node) -> /^Transfer-/.test(node.id))
    diagramNodes = _.filter(nodes, (node) -> /^Node-/.test(node.id))
    GraphPrimitive.counters =
      Link: GraphPrimitive.findMaxID(links) + 1,
      Transfer: GraphPrimitive.findMaxID(transferNodes) + 1
      Node: GraphPrimitive.findMaxID(diagramNodes) + 1

  @findMaxID: (list) ->
    maxID = 0
    for item in list
      id = item.id.split("-").pop()
      maxID = Math.max(maxID, parseInt(id, 10))
    maxID

  @nextID: (type) ->
    if not GraphPrimitive.counters[type]
      GraphPrimitive.counters[type] = 0
    GraphPrimitive.counters[type]++
    "#{type}-#{GraphPrimitive.counters[type]}"

  type: 'GraphPrimitive'

  constructor: ->
    @id = GraphPrimitive.nextID @type
    @key= @id
