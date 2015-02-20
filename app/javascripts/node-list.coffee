_ = require('lodash')
class GraphPrimitive
  @counters = {}
  @.reset_counters = () ->
    @counters = {}

  @.nextID  = (type) ->
    counter = @counters[type] || 0
    counter++
    "#{type}-#{counter}"

  type: () ->
    "GraphPrimitive"

  constructor: () ->
    @id = GraphPrimitive.nextID(@type())


class Link extends GraphPrimitive
  constructor: (@options={}) ->
    @options.color ||= "red"
    @options.title ||= "untitled"
    { @sourceNode, @sourceTerminal ,@targetNode, @targetTerminal} = @options
    super()
    @valid = false
    # @sourceNode.addLink(@)
    # @terminalNode.addLink(@)

  type: () ->
    "Link"
  terminalKey: () ->
    "{@sourceNode.id}[{@sourceTerminal}] ---{@title}---> {@targetNode}[{@targetTerminal}]"
  nodeKey: () ->
    "{@sourceNode.id} ---{@title}---> {@targetNode}"
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
    _.without(visitedNodes,@) # remove ourself from the results.
          

class NodeList
  constructor: () ->
  getName: () ->
  addLink: (sourceNode, sourceTerminal, targetNode, targetTerminal) ->


module.exports = {
  NodeList:NodeList
  GraphPrimitive:GraphPrimitive
  Link:Link
  Node:Node
}