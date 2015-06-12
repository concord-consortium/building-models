GraphPrimitive = require './graph-primitive'

module.exports = class Link extends GraphPrimitive

  @defaultColor: "#777"

  constructor: (@options={}) ->
    @options.color ?= Link.defaultColor
    @options.title ?= ''
    {
      @sourceNode, @sourceTerminal, @targetNode, @targetTerminal,
      @color, @title, @relation
    } = @options
    super()

  type: 'Link'

  terminalKey: ->
    "#{@sourceNode.key} ------> #{@targetNode.key}"

  nodeKey: ->
    "#{@sourceNode} ---#{@key}---> #{@targetNode}"

  outs: ->
    [@targetNode]

  ins: ->
    [@sourceNode]

  toExport: ->
    "title": @title
    "color": @color
    "sourceNodeKey": @sourceNode.key
    "sourceTerminal": @sourceTerminal
    "targetNodeKey": @targetNode.key
    "targetTerminal": @targetTerminal
