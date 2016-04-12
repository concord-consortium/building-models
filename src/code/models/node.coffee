GraphPrimitive = require './graph-primitive'
Colors = require '../utils/colors'

tr = require '../utils/translate'

SEMIQUANT_MIN = 0
SEMIQUANT_MAX = 100

# Enable ES5 getters and setters
Function::property = (prop, desc) ->
  Object.defineProperty @prototype, prop, desc

module.exports = class Node extends GraphPrimitive
  # Properties that can be changed.
  @fields: [
    'title', 'image', 'color', 'paletteItem',
    'initialValue', 'min', 'max',
    'isAccumulator', 'valueDefinedSemiQuantitatively'
    'frames']

  constructor: (nodeSpec={}, key) ->
    super()
    if key
      @key = key
    @links = []

    {
      @x=0
      @y=0
      @title="untitled"
      @image
      @isAccumulator=false
      @valueDefinedSemiQuantitatively=true,
      @paletteItem
      @frames=[]
    } = nodeSpec

    # Save internal values of min, max and initialValues. Actual values retreived
    # using @min or node.min will depend on whether we are in quantitative or
    # semi-quantitative mode. (See getters and setters below).
    @_min = nodeSpec.min ? SEMIQUANT_MIN
    @_max = nodeSpec.max ? SEMIQUANT_MAX
    @_initialValue = nodeSpec.initialValue ? 50

    @color ?= Colors[0].value

    @isInCycle = false      # we always initalize with no links, so we can't be in cycle

  # Scale the value of initialValue such that, if we are in semi-quantitative mode,
  # we always return a value between 0 and 100. Likewise, if we try to set a value while
  # we are in SQ mode, we set the actual internal value to the same proportion between
  # the internal min and max
  @property 'initialValue',
    get: ->
      if not @valueDefinedSemiQuantitatively
        @_initialValue
      else
        @mapQuantToSemiquant(@_initialValue)
    set: (val) ->
      if not @valueDefinedSemiQuantitatively
        @_initialValue = val
      else
        @_initialValue = @mapSemiquantToQuant(val)

  @property 'min',
    get: ->
      if not @valueDefinedSemiQuantitatively
        @_min
      else
        SEMIQUANT_MIN
    set: (val) ->
      if not @valueDefinedSemiQuantitatively then @_min = val

  @property 'max',
    get: ->
      if not @valueDefinedSemiQuantitatively
        @_max
      else
        SEMIQUANT_MAX
    set: (val) ->
      if not @valueDefinedSemiQuantitatively then @_max = val

  type: 'Node'
  addLink: (link) ->
    if link.sourceNode is @ or link.targetNode is @
      if _.contains @links, link
        throw new Error "Duplicate link for Node:#{@.id}"
      else
        @links.push link
    else
      throw new Error "Bad link for Node:#{@.id}"

  removeLink: (link) ->
    if link.sourceNode is @ or link.targetNode is @
      _.remove @links, (testLink) ->
        return testLink is link
    else
      throw new Error "Bad link for Node:#{@.id}"

  outLinks: ->
    _.filter @links, (link) => link.sourceNode is @

  inLinks: ->
    _.filter @links, (link) => link.targetNode is @

  inNodes: ->
    _.map @inLinks(), (link) -> link.sourceNode

  isDependent: ->
    @inLinks()?.length > 0

  checkIsInCycle: ->
    visitedNodes = []
    original = this

    visit = (node) ->
      visitedNodes.push node
      for link in node.outLinks()
        downstreamNode = link.targetNode
        return true if downstreamNode is original
        unless _.contains visitedNodes, downstreamNode
          if visit downstreamNode
            return true

    @isInCycle = visit(@) or false

  infoString: ->
    linkNamer = (link) ->
      " --#{link.title}-->[#{link.targetNode.title}]"
    outs = (linkNamer link for link in @outLinks())
    "#{@title} #{outs}"

  downstreamNodes: ->
    visitedNodes = []

    visit = (node) ->
      log.info("visiting node: #{node.id}")
      visitedNodes.push node
      _.each node.outLinks(), (link) ->
        downstreamNode = link.targetNode
        unless _.contains visitedNodes, downstreamNode
          visit downstreamNode
    visit @
    _.without visitedNodes, @ # remove ourself from the results.

  # ensures min, max and initialValue are all consistent.
  # @keys (optional) currently changed keys, so we can prioritize a user setting min or max
  normalizeValues: (keys) ->
    if isNaN(@min) then @min = 0
    if isNaN(@max) then @max = 0
    if _.contains keys, "max"
      @min = Math.min @min, @max
    else
      @max = Math.max @max, @min
    @initialValue = Math.max @min, Math.min @max, @initialValue

  # Given a value between _min and _max, calculate the SQ proportion
  mapQuantToSemiquant: (val) ->
    SEMIQUANT_MIN + (val - @_min) / (@_max - @_min) * (SEMIQUANT_MAX - SEMIQUANT_MIN)

  # Given an SQ value (i.e. between 0 and 100), calculate quantatative value
  # (i.e. between _min and _max)
  mapSemiquantToQuant: (val) ->
    @_min + (val - SEMIQUANT_MIN) / (SEMIQUANT_MAX - SEMIQUANT_MIN) * (@_max - @_min)

  toExport: ->
    data:
      title: @title
      x: @x
      y: @y
      paletteItem: @paletteItem
      initialValue: @initialValue
      min: @_min
      max: @_max
      isAccumulator: @isAccumulator
      valueDefinedSemiQuantitatively: @valueDefinedSemiQuantitatively
      frames: @frames
    key: @key

  canEditInitialValue: ->
    @inLinks().length is 0 or @isAccumulator or @isInCycle

  canEditValueWhileRunning: ->
    @inLinks().length is 0

  paletteItemIs: (paletteItem) ->
    paletteItem.uuid is @paletteItem
