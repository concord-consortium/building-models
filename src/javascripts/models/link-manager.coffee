_        = require 'lodash'
log      = require 'loglevel'
$        = require 'jquery'
Importer = require '../importer'
Link     = require './link'
DiagramNode = require './Node'

# LinkManager is the logical manager of Nodes and Links.
class LinkManager
  @instances = {} # map of context -> instance
  
  @.instance  = (context) ->
    @instances[context] ||= new @(context)
    @instances[context]

  constructor: (context) ->
    @linkKeys  = {}
    @nodeKeys  = {}
    @linkListeners = []
    @nodeListeners = []
    
  addLinkListener: (listener) ->
    log.info("adding link listener")
    @linkListeners.push listener

  addNodeListener: (listener) ->
    log.info("adding node listener")
    @nodeListeners.push listener

  getLinks: () ->
    return (value for key, value of @linkKeys)

  getNodes: () ->
    return (value for key, value of @nodeKeys)

  hasLink: (link) ->
    @linkKeys[link.terminalKey()]?

  hasNode: (node) ->
    return @nodeKeys[node.key]

  importLink: (linkSpec) ->
    sourceNode = @nodeKeys[linkSpec.sourceNode]
    targetNode = @nodeKeys[linkSpec.targetNode]
    linkSpec.sourceNode = sourceNode
    linkSpec.targetNode = targetNode
    link = new Link(linkSpec)
    @addLink(link)

  addLink: (link) ->
    unless @hasLink(link)
      @linkKeys[link.terminalKey()] = link
      @nodeKeys[link.sourceNode.key].addLink(link)
      @nodeKeys[link.targetNode.key].addLink(link)
      for listener in @linkListeners
        log.info "notifying of new link: #{link.terminalKey()}"
        listener.handleLinkAdd(link)
      return true
    return false

  importNode: (nodeSpec) ->
    node = new DiagramNode(nodeSpec.data, nodeSpec.key)
    @addNode(node)

  addNode: (node) ->
    unless @hasNode(node)
      @nodeKeys[node.key] = node
      for listener in @nodeListeners
        log.info("notifying of new Node")
        listener.handleNodeAdd(node)
      return true
    return false
  
  moveNode: (nodeKey, x,y ) ->
    node = @nodeKeys[nodeKey]
    return unless node
    node.x = x
    node.y = y
    for listener in @nodeListeners
      log.info("notifying of NodeMove")
      listener.handleNodeMove(node)
    
  selectNode: (nodeKey) ->
    @selectedNode = @nodeKeys[nodeKey]
    log.info "Selection happened for #{nodeKey} -- #{@selectedNode.title}"

  _nameForNode: (node) ->
    @nodeKeys[node]


  newLinkFromEvent: (info) ->
    newLink = {}
    startKey = $(info.source).data('node-key') || 'undefined'
    endKey   = $(info.target).data('node-key') || 'undefined'
    startTerminal = if info.connection.endpoints[0].anchor.type == "Top" then "a" else "b"
    endTerminal   = if info.connection.endpoints[1].anchor.type == "Top" then "a" else "b"
    color = info.color || '#fea'
    title = info.title || 'untitled'
    @importLink
      sourceNode:startKey,
      targetNode:endKey,
      sourceTerminal: startTerminal,
      targetTerminal: endTerminal,
      color: color,
      title: title
    return true

  removeLinksForNode: (nodeKey) ->
    links = @getLinks()
    newLinks = links.filter (link) =>
      if (nodeKey == link.sourceNode || nodeKey == link.targetNode)
        return false
      return true


  removeNode: (nodeKey) ->
    node = @nodeKeys[nodeKey]
    delete @nodeKeys[nodeKey]
    this.removeLinksForNode(nodeKey)
    for listener in @nodeListeners
      log.info("notifying of deleted Node")
      listener.handleNodeRm(node)
  
  loadData: (url) =>
    log.info("loading local data")
    log.info("url " + url)
    $.ajax {
      url: url,
      dataType: 'json',
      success: (data) =>
        log.info "json success"
        log.info data
        importer = new Importer(@)
        importer.importData(data)
      error: (xhr, status, err) ->
        log.error(url, status, err.toString())
      }
        

module.exports = LinkManager
