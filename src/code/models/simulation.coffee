AppSettingsStore  = require('../stores/app-settings-store').store

IntegrationFunction = (t) ->

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
      nextValue = link.relation.evaluate(inV, outV)
      value += nextValue
  else
    _.each links, (link) =>
      sourceNode = link.sourceNode
      inV = sourceNode.getCurrentValue(t)     # recursively ask incoming node for current value.
      outV = @previousValue or @initialValue
      nextValue = link.relation.evaluate(inV, outV)
      value += (nextValue / count)

  # if we need to cap, do it at end of all calculations
  if AppSettingsStore.settings.capNodeValues
    value = Math.max @min, Math.min @max, value

  value

module.exports = class Simulation

  constructor: (@opts={}) ->
    @nodes       = @opts.nodes      or []
    @duration    = @opts.duration   or 10.0
    @decorateNodes() # extend nodes with integration methods

    @onStart     = @opts.onStart or (nodeNames) ->
      log.info "simulation stated: #{nodeNames}"

    @onFrames    = @opts.onFrames or (frames) ->
      log.info "simulation frames: #{frames}"

    @onEnd       = @opts.onEnd or ->
      log.info "simulation end"

    speed            = if @opts.speed? then @opts.speed else 1
    @bundleAllFrames = speed is 1       # bundle all frames when at max speed
    @stepInterval    = Math.pow(470, 1-speed) + 30   # exponential, 500ms at speed=0, 31ms at speed=1
                                                     # (but note at exactly 1 we switch to bundling)

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
    node.currentValue = node.getCurrentValue(t)

  # create an object representation of the current timeStep and add
  # it to the current bundle of frames.
  generateFrame: (time) ->
    nodes = _.map @nodes, (node) ->
      title: node.title
      value: node.currentValue
    frame =
      time: time
      nodes: nodes

    @framesBundle.push frame

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
    @framesBundle = []
    _.each @nodes, (node) => @initializeValues node
    if not @graphIsValid()
      # We should normally not get here, as callers ought to check graphIsValid themselves first
      throw new Error("Graph not valid")

    nodeNames = _.pluck @nodes, 'title'
    @onStart(nodeNames)

    step = =>
      _.each @nodes, (node) => @nextStep node  # toggles previous / current val.
      _.each @nodes, (node) => @evaluateNode node, time
      time++
      @generateFrame(time)

    if @bundleAllFrames
      while time < @duration
        step()
      @onFrames(@framesBundle)    # send all at once
      @onEnd()
    else
      # use animationFrame and calculate how much time has passed since the last step, and
      # generate and send the appropriate number of frames. This is better when we send
      # intermediate values to CODAP, as this can take > 100ms and would tie up setInterval.
      startTime = window.performance.now()
      animationFrameLoop = =>
        if time < @duration
          requestAnimationFrame animationFrameLoop
        else if time is @duration then return

        elapsedTime = window.performance.now() - startTime
        desiredStepsTilNow = Math.floor elapsedTime / @stepInterval
        desiredStepsTilNow = Math.min desiredStepsTilNow, @duration

        while time < desiredStepsTilNow
          step()

        @onFrames(@framesBundle)  # send steps til now
        @framesBundle = []

        if time is @duration then @onEnd()
      animationFrameLoop()
