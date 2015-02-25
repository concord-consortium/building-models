
# GraphPrimitive is the basis for the Node and Link classes.
# They share a common ID generation mechanism mostly.
class GraphPrimitive
  @counters = {}
  @.reset_counters = () ->
    @counters = {}

  @.nextID  = (type) ->
    @counters[type] ||= 0
    @counters[type]++
    "#{type}-#{@counters[type]}"

  type: () ->
    "GraphPrimitive"

  constructor: () ->
    @id = GraphPrimitive.nextID(@type())

module.exports = GraphPrimitive