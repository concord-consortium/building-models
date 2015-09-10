
IntegrationFunction = (t, timeStep) ->

  # if we've already calculated a currentValue for ourselves this step, return it
  if @currentValue
    return @currentValue

  links = @inLinks()
  count = links.length
  nextValue = 0
  value = 0

  # if we have no incoming links, we always remain our initial value
  if count < 1
    return @initialValue

  if @isAccumulator
    value = if @previousValue? then @previousValue else @initialValue            # start from our last value
    _.each links, (link) =>
      sourceNode = link.sourceNode
      inV = sourceNode.previousValue
      return unless inV               # we simply ignore nodes with no previous value
      outV = @previousValue or @initialValue
      nextValue = link.relation.evaluate(inV, outV) * timeStep
      value += nextValue
  else
    _.each links, (link) =>
      sourceNode = link.sourceNode
      inV = sourceNode.getCurrentValue(t, timeStep)     # recursively ask incoming node for current value.
      outV = @previousValue or @initialValue
      nextValue = link.relation.evaluate(inV, outV) * timeStep
      value += (nextValue / count)

  value

module.exports = class Simulation

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
      @addIntegrateMethodTo node

  initializeValues: (node) ->
    node.currentValue = null
    node.previousValue = null

  nextStep: (node) ->
    node.previousValue = node.currentValue
    node.currentValue = null

  addIntegrateMethodTo: (node)->
    # Create a bound method on this node.
    # Put the functionality here rather than in the class "Node".
    # Keep all the logic for integration here in one file for clarity.
    node.getCurrentValue = IntegrationFunction.bind(node)


  # for some integrators, timeIndex might matter
  evaluateNode: (node, t) ->
    node.currentValue = node.getCurrentValue(t, @timeStep)

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

  # Tests that the graph contains no loops consisting of dependent variables.
  # A graph such as A->B<->C is invalid if B and C connect to each other and
  # neither are accumulators
  graphIsValid: ->
    _.each @nodes, (node) -> node._isValid = null

    # Recursive function. We go throw a node's non-independent ancestors, and if
    # we find ourselves again, or if any of our ancestors find themselves again,
    # we have a loop.
    isInALoop = (node) ->
      linksIn = node.inLinks()
      # quick exit if we're not a dependent variable, or if we've already been checked
      return false if node._isValid or node.isAccumulator or linksIn.length is 0
      for seen in nodesSeenInSegment
        if seen is node
          return true

      nodesSeenInSegment.push node

      for link in linksIn
        return true if isInALoop link.sourceNode

      return false

    for node in @nodes
      nodesSeenInSegment = []
      return false if isInALoop node
      # if node was not in a loop, none of its ancestors were either,
      # so mark all nodes we've seen as valid for speed
      for seen in nodesSeenInSegment
        seen._isValid = true

    return true


  run: ->
    time = 0
    @reportFrames = []
    _.each @nodes, (node) => @initializeValues node
    if not @graphIsValid()
      # We should normally not get here, as callers ought to check graphIsValid themselves first
      throw new Error("Graph not valid")
    while time < @duration
      _.each @nodes, (node) => @nextStep node  # toggles previous / current val.
      _.each @nodes, (node) => @evaluateNode node, time
      time = time + @timeStep
      @addReportFrame(time)
