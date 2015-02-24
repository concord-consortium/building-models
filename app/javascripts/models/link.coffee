GraphPrimitive = require('./graph-primitive')

class Link extends GraphPrimitive
  constructor: (@options={}) ->
    @options.color ||= "red"
    @options.title ||= "untitled"
    { @sourceNode, @sourceTerminal ,@targetNode, @targetTerminal, @color, @title} = @options
    super()
    @valid = false

  type: () ->
    "Link"
  terminalKey: () ->
    "#{@sourceNode}[#{@sourceTerminal}] ---#{@title}---> #{@targetNode}[#{@targetTerminal}]"
  nodeKey: () ->
    "#{@sourceNode} ---#{@title}---> #{@targetNode}"
  outs: () ->
    [@targetNode]
  ins: () ->
    [@sourceNode]

module.exports = Link