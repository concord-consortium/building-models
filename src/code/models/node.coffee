GraphPrimitive = require './graph-primitive'
Colors = require '../utils/colors'

tr = require '../utils/translate'

module.exports = class Node extends GraphPrimitive
  # Properties that can be changed.
  @fields: [
    'title', 'image', 'color', 'paletteItem',
    'initialValue', 'min', 'max',
    'isAccumulator', 'valueDefinedSemiQuantitatively']

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
      @initialValue=50
      @min=0
      @max=100
      @isAccumulator=false
      @valueDefinedSemiQuantitatively=true,
      @paletteItem
    } = nodeSpec
    @color ?= Colors[0].value

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

  toExport: ->
    data:
      title: @title
      x: @x
      y: @y
      paletteItem: @paletteItem
      initialValue: @initialValue
      min: @min
      max: @max
      isAccumulator: @isAccumulator
      valueDefinedSemiQuantitatively: @valueDefinedSemiQuantitatively
    key: @key

  canEditValueWhileRunning: ->
    @inLinks().length is 0 or @isAccumulator

  paletteItemIs: (paletteItem) ->
    paletteItem.uuid is @paletteItem
