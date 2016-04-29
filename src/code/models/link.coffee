GraphPrimitive = require './graph-primitive'
Relation       = require "./relationship"
LinkColors     = require "../utils/link-colors"

module.exports = class Link extends GraphPrimitive

  @defaultColor = LinkColors.default
  @defaultRelation = new Relation
    formula: "1 * in"

  constructor: (@options={}) ->
    @options.color ?= Link.defaultColor
    @options.title ?= ''

    {
      @sourceNode, @sourceTerminal, @targetNode, @targetTerminal,
      @color, @title
    } = @options
    @relation = @_makeRelation @options.relation
    super()

  type: 'Link'

  _makeRelation: (relationObj) ->
    unless (relationObj instanceof Relation)
      relation = new Relation (relationObj or {})
    else
      relation = relationObj
    return relation

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
    "sourceNode": @sourceNode.key
    "sourceTerminal": @sourceTerminal
    "targetNode": @targetNode.key
    "targetTerminal": @targetTerminal
    "relation": @relation.toExport()
