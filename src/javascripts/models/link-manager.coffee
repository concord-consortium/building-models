_        = require 'lodash'
log      = require 'loglevel'
$        = require 'jquery'
Importer = require '../importer'
Link     = require './link'

# LinkManager is the logical manager of Nodes and Links.
class LinkManager
  @instances = {} # map of context -> instance
  
  @.instance  = (context) ->
    @instances[context] ||= new @(context)
    @instances[context]

  constructor: (context) ->
    @linkKeys  = {}
    @nodeDoms  = {}
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

  hasLink: (link) ->
    @linkKeys[link.terminalKey()]?

  hasNode: (nodeinfo) ->
    return false # for now...

  importLink: (linkSpec) ->
    link = new Link(linkSpec)
    @addLink(link)

  addLink: (link) ->
    unless @hasLink(link)
      @linkKeys[link.terminalKey()] = link
      for listener in @linkListeners
        log.info "notifying of new link: #{link.terminalKey()}"
        listener.handleLinkAdd(link)
      return true
    return false

  addNode: (node) ->
    unless @hasNode(node)
      for listener in @linkListeners
        log.info("notifying of new Node")
        listener.handleNodeAdd(node)
      return true
    return false

  _nameForNode: (node) ->
    @nodeDoms[node]


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
