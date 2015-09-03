GraphPrimitive = require './graph-primitive'
Colors = require '../utils/colors'

tr = require '../utils/translate'

module.exports = class Node extends GraphPrimitive

  constructor: (nodeSpec={x:0,y:0,title:"untitled",image:null,initialValue:50,min:0,max:100,isAccumulator:false, valueDefinedSemiQuantitatively:false}, key) ->
    super()
    if key
      @key = key
    @links = []
    {@x, @y, @title, @image, @initialValue, @isAccumulator, @valueDefinedSemiQuantitatively} = nodeSpec
    @initialValue  ?= 50
    @min ?= 0
    @max ?= 100
    @isAccumulator ?= false
    @color ?= Colors[0].value
    @valueDefinedSemiQuantitatively ?= true

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

  toExport: ->
    data:
      title: @title
      x: @x
      y: @y
      image: @image
      initialValue: @initialValue
      min: @min
      max: @max
      isAccumulator: @isAccumulator
      valueDefinedSemiQuantitatively: @valueDefinedSemiQuantitatively
    key: @key

  paletteItemIs: (paletteItem) ->
    paletteItem.image is @image
