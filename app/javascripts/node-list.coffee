# _ = require('lodash')
# log = require('loglevel');

# GraphPrimitive is the basis for the Node and Link classes.
# They share a common ID generation mechanism mostly.
class GraphPrimitive
  @counters = {}
  @.reset_counters = () ->
    @counters = {}

  @.nextID  = (type) ->
    @counters[type] ||= 0
    @counters[type]++
    "#{type}-#{@counters[type]}"

  type: () ->
    "GraphPrimitive"

  constructor: () ->
    @id = GraphPrimitive.nextID(@type())



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


class Node extends GraphPrimitive
  constructor: () ->
    super()
    @links = []
    
  type: () ->
    "Node"

  addLink: (link) ->
    if link.sourceNode == @ || link.targetNode == @
      if _.contains(@links, link)
        throw new Error "Duplicate link for Node:#{@.id}"
      @links.push(link)
    else
      throw new Error "Bad link for Node:#{@.id}"

  outLinks: () ->
    _.filter @links, (link) =>
      if (link.sourceNode == @)
        return true
      return false

  inLinks: () ->
    _.filter @links, (link) =>
      if (link.targetNode == @)
        return true
      return false

  downstreamNodes: () ->
    visitedNodes = []
    
    visit = (node) ->
      console.log("visiting node: #{node.id}")
      visitedNodes.push node
      _.each node.outLinks(), (link) ->
        downstreamNode = link.targetNode
        unless _.contains(visitedNodes, downstreamNode)
          visit(downstreamNode)
    visit(@)
    _.without(visitedNodes, @) # remove ourself from the results.
          

# NodeList is the logical manager of Nodes and Links.
# It implements 
#
class NodeList
  constructor: () ->
    @linkKeys = {}

  hasLink: (link) ->
    @linkKeys[link.terminalKey()]?

  addLink: (link) ->
    unless @hasLink(link)
      @linkKeys[link.terminalKey()] = link
      return true
    return false


module.exports =
  NodeList:NodeList
  GraphPrimitive:GraphPrimitive
  Link:Link
  Node:Node
