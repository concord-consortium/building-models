
# GraphPrimitive is the basis for the Node and Link classes.
# They share a common ID generation mechanism mostly.
module.exports = class GraphPrimitive
  @counters: {}
  @reset_counters: ->
    GraphPrimitive.counters = {}

  @nextID: (type) ->
    if not GraphPrimitive.counters[type]
      GraphPrimitive.counters[type] = 0
    GraphPrimitive.counters[type]++
    "#{type}-#{GraphPrimitive.counters[type]}"

  type: 'GraphPrimitive'

  constructor: ->
    @id = GraphPrimitive.nextID @type
    @key= @id
