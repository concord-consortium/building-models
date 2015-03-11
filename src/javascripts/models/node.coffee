_              = require('lodash')
log            = require('loglevel')
GraphPrimitive = require('./graph-primitive')

class Node extends GraphPrimitive
  constructor: (nodeSpec={x:0,y:0,title:"untitled",image:null},key) ->
    super()
    if key
      @key = key
    @links = []
    @x = nodeSpec.x
    @y = nodeSpec.y
    @title = nodeSpec.title
    @image = nodeSpec.image

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

  infoString: () ->
    linkNamer = (link) =>
      " --#{link.title}-->[#{link.targetNode.title}]"
    outs = (linkNamer link for link in @outLinks())
    "#{@title} #{outs}"

  downstreamNodes: () ->
    visitedNodes = []
    
    visit = (node) ->
      log.info("visiting node: #{node.id}")
      visitedNodes.push node
      _.each node.outLinks(), (link) ->
        downstreamNode = link.targetNode
        unless _.contains(visitedNodes, downstreamNode)
          visit(downstreamNode)
    visit(@)
    _.without(visitedNodes, @) # remove ourself from the results.

  toExport: () ->
    {   
      title: @title,
      x: @x,
      y: @y,
      image: @image,
      key: @key
    }
module.exports = Node