GraphPrimitive = require('./graph-primitive')

class Link extends GraphPrimitive
  constructor: (@options={}) ->
    @options.color ||= "red"
    @options.title ||= "untitled"
    { @sourceNode, @sourceTerminal ,@targetNode, @targetTerminal, @color, @title} = @options
    super()

  type: () ->
    "Link"
  terminalKey: () ->
    "#{@sourceNode.key}[#{@sourceTerminal}] ---#{@title}---> #{@targetNode.key}[#{@targetTerminal}]"
  nodeKey: () ->
    "#{@sourceNode} ---#{@title}---> #{@targetNode}"
  outs: () ->
    [@targetNode]
  ins: () ->
    [@sourceNode]

module.exports = Link