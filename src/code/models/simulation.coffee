
IntegrationFunction = (t, timeStep) ->
  links = @inLinks()
  count = links.length
  nextValue = 0

  if count < 1
    return @currentValue

  if not @isAccumulator
    @currentValue = 0

  _.each links, (link) =>
    sourceNode = link.sourceNode
    inV = sourceNode.previousValue
    outV = @previousValue
    nextValue = link.relation.evaluate(inV, outV) * timeStep
    if @isAccumulator
      @currentValue = @currentValue + nextValue
    else
      @currentValue = @currentValue + (nextValue / count)

  @currentValue

module.exports = class Simulation

  @defaultInitialValue = 50

  @defaultReportFunc = (report) ->
    log.info report


  constructor: (@opts={}) ->
    @nodes       = @opts.nodes      or []
    @duration    = @opts.duration   or 10.0
    @timeStep    = @opts.timeStep   or 0.1
    @reportFunc  = @opts.reportFunc   or Simulation.defaultReportFunc

    @decorateNodes() # extend nodes with integration methods


  decorateNodes: ->
    _.each @nodes, (node) =>
      @initiaLizeValues node
      @addIntegrateMethodTo node

  initiaLizeValues: (node) ->
    node.initialValue  ?= Simulation.defaultInitialValue
    node.currentValue  = node.initialValue

  nextStep: (node) ->
    node.previousValue = node.currentValue or node.initialValue

  addIntegrateMethodTo: (node)->
    # Create a bound method on this node.
    # Put the functionality here rather than in the class "Node".
    # Keep all the logic for integration here in one file for clarity.
    node.integrate = IntegrationFunction.bind(node)


  # for some integrators, timeIndex might matter
  evaluateNode: (node, t) ->
    node.currentValue = node.integrate(t, @timeStep)

  # create an object representation of the current timeStep
  addReportFrame: (time) ->
    nodes = _.map @nodes, (node) ->
      time:  time
      title: node.title
      value: node.currentValue
      initialValue: node.initialValue
    @reportFrames.push
      time: time
      nodes: nodes

  # create envelope deata for the report
  report: ->
    steps = @duration / @timeStep
    data =
      steps: steps
      duration: @duration
      timeStep: @timeStep
      nodeNames: _.pluck @nodes, 'title'
      frames: @reportFrames
      endState: _.map @nodes, (n) ->
        title: n.title
        initialValue: n.initialValue
        value: n.currentValue

    @reportFunc(data)

  run: ->
    time = 0
    @reportFrames = []
    _.each @nodes, (node) => @initiaLizeValues node
    while time < @duration
      _.each @nodes, (node) => @nextStep node  # toggles previous / current val.
      _.each @nodes, (node) => @evaluateNode node, time
      time = time + @timeStep
      @addReportFrame(time)
