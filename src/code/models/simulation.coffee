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
      # TODO: Map input range (in.min –> in.max) to domain (out.min -> out.max)
      nextValue = link.relation.evaluate(inV, outV, sourceNode.max)
      value += nextValue
  else
    # include the nodes current value in the average
    if @newIntegration
      count  = count + 1
      outV   = @previousValue or @initialValue
      value += outV


    _.each links, (link) =>
      sourceNode = link.sourceNode
      if @newIntegration
        inV = sourceNode.previousValue || sourceNode.initialValue
      else
        inV = sourceNode.getCurrentValue(t)     # recursively ask incoming node for current value.
      outV = @previousValue or @initialValue
      nextValue = link.relation.evaluate(inV, outV)
      value += nextValue
    value = value / count

  # if we need to cap, do it at end of all calculations
  if @capNodeValues
    value = Math.max @min, Math.min @max, value

  value

module.exports = class Simulation

  constructor: (@opts={}) ->
    @nodes          = @opts.nodes      or []
    @duration       = @opts.duration   or 10
    @capNodeValues  = @opts.capNodeValues or false
    @newIntegration = @opts.newIntegration or false
    @decorateNodes() # extend nodes with integration methods

    @onStart     = @opts.onStart or (nodeNames) ->
      log.info "simulation stated: #{nodeNames}"

    @onFrames    = @opts.onFrames or (frames) ->
      log.info "simulation frames: #{frames}"

    @onEnd       = @opts.onEnd or ->
      log.info "simulation end"

    speed            = if @opts.speed? then @opts.speed else 4
    @bundleAllFrames = speed is 4               # bundle all frames when at max speed
    @stepInterval = @_calculateInterval speed   # otherwise calc step interval

    @recalculateDesiredSteps = false
    @stopRun = false

  _calculateInterval: (speed) ->
    switch speed
      when 0 then 1000  # Speed 0: 1 step/second
      when 1            # Speed 1: 3 steps/second, at least 5 seconds and at most 100 seconds
        switch
          when @duration <= 15  then Math.min 900, 5000 / @duration
          when @duration <= 300 then 330
          else 1e5 / @duration
      when 2            # Speed 2: 10 steps/second, at least 2.5 seconds and at most 50 seconds
        switch
          when @duration <= 25  then Math.min 700, 2500 / @duration
          when @duration <= 500 then 100
          else 5e4 / @duration
      when 3            # Speed 3: 20 steps/second, at least 1 second and at most 10 seconds
        switch
          when @duration <= 20  then Math.min 500, 1000 / @duration
          when @duration <= 200 then 50
          else 1e4 / @duration
      when 4            #
        0.1

  setSpeed: (speed) ->
    # @bundleAllFrames = speed is 4
    @stepInterval = @_calculateInterval speed
    @recalculateDesiredSteps = true

  decorateNodes: ->
    _.each @nodes, (node) =>
      # make this a local node property (it may eventually be different per node)
      node.capNodeValues = @capNodeValues
      node.newIntegration = @newIntegration
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
    return true if @newIntegration
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

  stop: ->
    @stopRun = true


  run: ->
    @stopRun = false
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
      steps = 0
      subtract = 0
      animationFrameLoop = =>
        if time < @duration and not @stopRun
          requestAnimationFrame animationFrameLoop
        else if time is @duration then return

        if @recalculateDesiredSteps
          startTime = window.performance.now()
          steps = 0
          subtract = time
          @recalculateDesiredSteps = false

        elapsedTime = window.performance.now() - startTime
        desiredStepsTilNow = Math.floor elapsedTime / @stepInterval
        desiredStepsTilNow = Math.min desiredStepsTilNow, (@duration - subtract)

        while steps < desiredStepsTilNow
          steps++
          step()

        @onFrames(@framesBundle)  # send steps til now
        @framesBundle = []

        if time is @duration or @stopRun then @onEnd()
      animationFrameLoop()
