GraphPrimitive = require './graph-primitive'
Relation = require "./relationship"
module.exports = class Link extends GraphPrimitive

  @defaultColor = "#777"
  @defaultRelation = new Relation
    formula: "out + in"

  constructor: (@options={}) ->
    @options.color ?= Link.defaultColor
    @options.title ?= ''
    @options.relation ?= Link.defaultRelation
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
