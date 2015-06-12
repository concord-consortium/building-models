
IntegrationFunction = (t) ->
  links = @inLinks()
  count = links.length
  factor = 1 / count
  nextValue = 0
  _.each links, (link) =>
    sourceNode = link.sourceNode
    inV = sourceNode.previousValue
    outV = @previousValue
    nextValue = link.relation.evaluate(inV, outV)
    @currentValue = nextValue * factor
  @currentValue

module.exports = class Simulation

  constructor: (@opts={}) ->
    @nodes       = @opts.nodes      or []
    @duration    = @opts.duration   or 10.0
    @timeStep    = @opts.timeStep   or 0.1
    @errHandler  = @opts.errHandler or Simulation.defaultErrHandler

    @decorateNodes() # extend nodes with integration methods


  decorateNodes: ->
    _.each @nodes, (node) =>
      @initiaLizeValues node
      @addIntegrateMethodTo node

  initiaLizeValues: (node) ->
    node.initialValue  ?= 50
    node.currentValue  ?= node.initialValue

  nextStep: (node) ->
    node.previousValue = node.currentValue or node.initialValue

  addIntegrateMethodTo: (node)->
    # Create a bound method on this node.
    # Put the functionality here rather than in the class "Node".
    # Keep all the logic for integration here in one file for clarity.
    node.integrate = IntegrationFunction.bind(node)


  # for some integrators, timeIndex might matter
  evaluateNode: (node, t) ->
    node.currentValue = node.integrate(t)

  run: ->
    time = 0
    while time < @duration
      _.each @nodes, (node) => @nextStep node  # toggles previous / current val.
      _.each @nodes, (node) => @evaluateNode node, time
      time = time + @timeStep
