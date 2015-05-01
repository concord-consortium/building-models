Importer = require '../utils/importer'
Link     = require './link'
DiagramNode = require './node'
UndoRedo = require '../utils/undo-redo'

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
    @imageMetadataCache = {}
    @undoRedoManager = new UndoRedo.Manager debug: true

  undo: ->
    @undoRedoManager.undo()

  redo: ->
    @undoRedoManager.redo()

  setSaved: ->
    @undoRedoManager.save()

  addChangeListener: (listener) ->
    log.info("adding change listener")
    @undoRedoManager.addChangeListener listener

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
    @undoRedoManager.createAndExecuteCommand 'addLink',
      execute: => @_addLink link
      undo: => @_removeLink link

  _addLink: (link) ->
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

  removeLink: (link) ->
    @undoRedoManager.createAndExecuteCommand 'removeLink',
      execute: => @_removeLink link
      undo: => @_addLink link

  _removeLink: (link) ->
    delete @linkKeys[link.terminalKey()]
    @nodeKeys[link.sourceNode.key]?.removeLink(link)
    @nodeKeys[link.targetNode.key]?.removeLink(link)
    for listener in @linkListeners
      log.info("notifying of deleted Link")
      listener.handleLinkRm(link)

  importNode: (nodeSpec) ->
    node = new DiagramNode(nodeSpec.data, nodeSpec.key)
    @addNode(node)

  addNode: (node) ->
    @undoRedoManager.createAndExecuteCommand 'addNode',
      execute: => @_addNode node
      undo: => @_removeNode node

  removeNode: (nodeKey) ->
    node = @nodeKeys[nodeKey]

    # create a copy of the list of links
    links = node.links.slice()

    @undoRedoManager.createAndExecuteCommand 'removeNode',
      execute: =>
        @_removeLink(link) for link in links
        @_removeNode node
      undo: =>
        @_addNode node
        @_addLink(link) for link in links

  _addNode: (node) ->
    unless @hasNode node
      @nodeKeys[node.key] = node
      for listener in @nodeListeners
        log.info("notifying of new Node")
        listener.handleNodeAdd(node)
      @selectNode(node.key)
      return true
    return false

  _removeNode: (node) ->
    delete @nodeKeys[node.key]
    for listener in @nodeListeners
      log.info("notifying of deleted Node")
      listener.handleNodeRm(node)
    @selectedNode = null
    for listener in @selectionListeners
      listener({node:null, connection:null})

  moveNodeCompleted: (nodeKey, pos, originalPos) ->
    node = @nodeKeys[nodeKey]
    return unless node
    @undoRedoManager.createAndExecuteCommand 'moveNode',
      execute: => @moveNode node.key, pos, originalPos
      undo: => @moveNode node.key, originalPos, pos

  moveNode: (nodeKey, pos, originalPos) ->
    node = @nodeKeys[nodeKey]
    return unless node
    node.x = pos.left
    node.y = pos.top
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

  changeNode: (data) ->
    if @selectedNode
      node = @selectedNode
      originalData =
        title: node.title
        image: node.image
        color: node.color

      @undoRedoManager.createAndExecuteCommand 'changeNode',
        execute: => @_changeNode node, data
        undo: => @_changeNode node, originalData

  _changeNode: (node, data) ->
    log.info "Change for #{node.title}"
    for key in ['title','image','color']
      if data[key]
        log.info "Change #{key} for #{node.title}"
        node[key] = data[key]
    for listener in @selectionListeners
      listener({node:node, connection:null})

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
    if deleted
      @removeSelectedLink()
    else if @selectedLink
      link = @selectedLink
      originalTitle = @selectedLink.title
      originalColor = @selectedLink.color
      @undoRedoManager.createAndExecuteCommand 'changeLink',
        execute: => @_changeLink link, title, color
        undo: => @_changeLink link, originalTitle, originalColor

  _changeLink: (link, title, color) ->
    log.info "Change  for #{link.title}"
    link.title = title
    link.color = color
    for listener in @selectionListeners
      listener({node:null, connection:link})

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

  deleteAll: ->
    for node of @nodeKeys
      @removeNode node
    @setFilename 'New Model'
    @undoRedoManager.clearHistory()

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
      @removeLink(@selectedLink)
      @selectedLink = null
      for listener in @selectionListeners
        listener({node:null, connection:null})

  removeLinksForNode: (node) ->
    @removeLink(link) for link in node.links

  loadData: (data) ->
    log.info "json success"
    importer = new Importer(@)
    importer.importData(data)
    @setFilename data.filename or 'New Model'

    if data.imageMetadata
      _.forEach data.imageMetadata, (metadata, image) =>
        @setImageMetadata image, metadata

    for listener in @loadListeners
      listener data
    @undoRedoManager.clearHistory()

  loadDataFromUrl: (url) =>
    log.info("loading local data")
    log.info("url " + url)
    $.ajax
      url: url,
      dataType: 'json',
      success: (data) =>
        @loadData data
      error: (xhr, status, err) ->
        log.error(url, status, err.toString())

  serialize: (palette) ->
    nodeExports = for key,node of @nodeKeys
      node.toExport()
    linkExports = for key,link of @linkKeys
      link.toExport()
    imageMetadata = {}
    _.forEach palette, (node) =>
      if @imageMetadataCache[node.image]
        imageMetadata[node.image] = @imageMetadataCache[node.image]
    return {
      version: 0.1
      filename: @filename
      palette: palette
      nodes: nodeExports
      links: linkExports
      imageMetadata: imageMetadata
    }

  toJsonString: (palette) ->
    JSON.stringify @serialize palette

  setImageMetadata: (image, metadata) ->
    @imageMetadataCache[image] = metadata

  getImageMetadata: (image) ->
    @imageMetadataCache[image]
