Importer = require '../utils/importer'
Link     = require './link'
DiagramNode = require './node'

# LinkManager is the logical manager of Nodes and Links.
module.exports = class LinkManager
  @instances: {} # map of context -> instance

  @instance: (context) ->
    LinkManager.instances[context] ?= new LinkManager context
    LinkManager.instances[context]

  constructor: (context) ->
    @linkKeys  = {}
    @nodeKeys  = {}
    @linkListeners = []
    @nodeListeners = []
    @selectionListeners = []
    @loadListeners = []
    @filename = null
    @filenameListeners = []
    @selectedNode = {}

  addLinkListener: (listener) ->
    log.info("adding link listener")
    @linkListeners.push listener

  addNodeListener: (listener) ->
    log.info("adding node listener")
    @nodeListeners.push listener

  addSelectionListener: (listener) ->
    log.info("adding selection listener #{listener}")
    @selectionListeners.push listener

  addLoadListener: (listener) ->
    log.info("adding load listener #{listener}")
    @loadListeners.push listener

  addFilenameListener: (listener) ->
    log.info("adding filename listener #{listener}")
    @filenameListeners.push listener
    
  setFilename: (filename) ->
    @filename = filename
    for listener in @filenameListeners
      listener filename
    
  getLinks: ->
    (value for key, value of @linkKeys)

  getNodes: ->
    (value for key, value of @nodeKeys)

  hasLink: (link) ->
    @linkKeys[link.terminalKey()]?

  hasNode: (node) ->
    @nodeKeys[node.key]?

  importLink: (linkSpec) ->
    sourceNode = @nodeKeys[linkSpec.sourceNode]
    targetNode = @nodeKeys[linkSpec.targetNode]
    linkSpec.sourceNode = sourceNode
    linkSpec.targetNode = targetNode
    link = new Link(linkSpec)
    @addLink(link)

  addLink: (link) ->
    unless @hasLink link
      @linkKeys[link.terminalKey()] = link
      @nodeKeys[link.sourceNode.key].addLink(link)
      @nodeKeys[link.targetNode.key].addLink(link)
      for listener in @linkListeners
        log.info "notifying of new link: #{link.terminalKey()}"
        listener.handleLinkAdd(link)
      @selectLink(link)
      return true
    return false

  importNode: (nodeSpec) ->
    node = new DiagramNode(nodeSpec.data, nodeSpec.key)
    @addNode(node)

  addNode: (node) ->
    unless @hasNode node
      @nodeKeys[node.key] = node
      for listener in @nodeListeners
        log.info("notifying of new Node")
        listener.handleNodeAdd(node)
      @selectNode(node.key)
      return true
    return false

  moveNode: (nodeKey, x,y ) ->
    node = @nodeKeys[nodeKey]
    return unless node
    node.x = x
    node.y = y
    # @selectNode(nodeKey)
    for listener in @nodeListeners
      log.info("notifying of NodeMove")
      listener.handleNodeMove(node)

  selectNode: (nodeKey) ->
    if @selectedNode
      @selectedNode.selected = false
    # TODO: do this better:
    if @selectedLink
      @selectedLink.selected = false
      @selectedLink = null
    @selectedNode = @nodeKeys[nodeKey]
    if @selectedNode
      @selectedNode.selected = true
      log.info "Selection happened for #{nodeKey} -- #{@selectedNode.title}"
    for listener in @selectionListeners
      listener({node:@selectedNode, connection:null})

  changeNode: (title, image) ->
    if @selectedNode
      log.info "Change  for #{@selectedNode.title}"
      @selectedNode.title = title
      @selectedNode.image = image
      for listener in @selectionListeners
        listener({node:@selectedNode, connection:null})

  selectLink: (link) ->
    if @selectedLink
      @selectedLink.selected = false
    # TODO: better selection management.
    if @selectedNode
      @selectedNode.selected = false
      @selectedNode = null
    @selectedLink = link
    link?.selected = true
    for listener in @selectionListeners
      listener({node:null, connection:@selectedLink})

  changeLink: (title, color, deleted) ->
    if @selectedLink
      log.info "Change  for #{@selectedLink.title}"
      if deleted
        @removeSelectedLink()
      else
        @selectedLink.title = title
        @selectedLink.color = color
        for listener in @selectionListeners
          listener({node:null, connection:@selectedLink})

  _nameForNode: (node) ->
    @nodeKeys[node]

  newLinkFromEvent: (info) ->
    newLink = {}
    startKey = $(info.source).data('node-key') or 'undefined'
    endKey   = $(info.target).data('node-key') or 'undefined'
    startTerminal = if info.connection.endpoints[0].anchor.type is "Top" then "a" else "b"
    endTerminal   = if info.connection.endpoints[1].anchor.type is "Top" then "a" else "b"
    @importLink
      sourceNode:startKey,
      targetNode:endKey,
      sourceTerminal: startTerminal,
      targetTerminal: endTerminal,
      color: info.color,
      title: info.title
    true

  removelink: (link) ->
    key = link.terminalKey()
    delete @linkKeys[key]

  deleteAll: ->
    for node of @nodeKeys
      @removeNode node
    @setFilename 'New Model'

  deleteSelected: ->
    log.info "Deleting selected items"
    @removeSelectedLink()
    @removeSelectedNode()

  removeSelectedNode: ->
    if @selectedNode
      @removeNode(@selectedNode.key)
      for listener in @selectionListeners
        listener({node:null, connection:null})

  removeSelectedLink: ->
    if @selectedLink
      @removelink(@selectedLink)
      for listener in @linkListeners
        log.info("notifying of deleted Link")
        listener.handleLinkRm(@selectedLink)
      @selectedLink = null
      for listener in @selectionListeners
        listener({node:null, connection:null})

  removeLinksForNode: (node) ->
    @removelink(link) for link in node.links

  removeNode: (nodeKey) ->
    node = @nodeKeys[nodeKey]
    delete @nodeKeys[nodeKey]
    this.removeLinksForNode(node)
    for listener in @nodeListeners
      log.info("notifying of deleted Node")
      listener.handleNodeRm(node)
    @selectedNode = null
    for listener in @selectionListeners
      listener({node:null, connection:null})

  loadData: (data) ->
    log.info "json success"
    importer = new Importer(@)
    importer.importData(data)
    @setFilename data.filename or 'New Model'
    for listener in @loadListeners
      listener data

  loadDataFromUrl: (url) =>
    log.info("loading local data")
    log.info("url " + url)
    $.ajax
      url: url,
      dataType: 'json',
      success: (data) =>
        @loadData(data)
      error: (xhr, status, err) ->
        log.error(url, status, err.toString())

  serialize: (palette) ->
    nodeExports = for key,node of @nodeKeys
      node.toExport()
    linkExports = for key,link of @linkKeys
      link.toExport()
    return {
      version: 0.1
      filename: @filename
      palette: palette
      nodes: nodeExports
      links: linkExports
    }

  toJsonString: (palette) ->
    JSON.stringify @serialize palette
