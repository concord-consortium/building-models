Importer         = require '../utils/importer'
Link             = require './link'
DiagramNode      = require './node'
UndoRedo         = require '../utils/undo-redo'
SelectionManager = require './selection-manager'
tr               = require "../utils/translate"

# LinkManager is the logical manager of Nodes and Links.
module.exports   = class LinkManager
  @instances: {} # map of context -> instance

  @instance: (context) ->
    LinkManager.instances[context] ?= new LinkManager context
    LinkManager.instances[context]

  constructor: (context) ->
    @linkKeys           = {}
    @nodeKeys           = {}
    @linkListeners      = []
    @nodeListeners      = []
    @loadListeners      = []
    @filename           = null
    @filenameListeners  = []
    @imageMetadataCache = {}

    @undoRedoManager    = new UndoRedo.Manager debug: true
    @selectionManager   = new SelectionManager()

  undo: ->
    @undoRedoManager.undo()

  redo: ->
    @undoRedoManager.redo()

  setSaved: ->
    @undoRedoManager.save()

  revertToOriginal: ->
    @undoRedoManager.revertToOriginal()

  revertToLastSave: ->
    @undoRedoManager.revertToLastSave()

  hideUndoRedo: (hide) ->
    @undoRedoManager.hideUndoRedo(hide)

  undoRedoIsVisible: ->
    @undoRedoManager.showUndoRedo

  addChangeListener: (listener) ->
    log.info("adding change listener")
    @undoRedoManager.addChangeListener listener

  addLinkListener: (listener) ->
    log.info("adding link listener")
    @linkListeners.push listener

  addNodeListener: (listener) ->
    log.info("adding node listener")
    @nodeListeners.push listener

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
    if link.sourceNode is link.targetNode
      return false
    if @hasLink link
      return false
    else
      @linkKeys[link.terminalKey()] = link
      @nodeKeys[link.sourceNode.key].addLink(link)
      @nodeKeys[link.targetNode.key].addLink(link)
      for listener in @linkListeners
        log.info "notifying of new link: #{link.terminalKey()}"
        listener.handleLinkAdd(link)
      return true

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
    node

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
      return true
    return false

  _removeNode: (node) ->
    delete @nodeKeys[node.key]
    for listener in @nodeListeners
      log.info("notifying of deleted Node")
      listener.handleNodeRm(node)

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

  selectedNode: ->
    @selectionManager.selection(SelectionManager.NodeInpsection)[0] or null

  editingNode: ->
    @selectionManager.selection(SelectionManager.NodeTitleEditing)[0] or null

  editNode: (nodeKey) ->
    @selectionManager.selectForTitleEditing(@nodeKeys[nodeKey])

  selectNode: (nodeKey) ->
    @selectionManager.selectForInspection(@nodeKeys[nodeKey])


  _notifyNodeChanged: (node) ->
    for listener in @nodeListeners
      listener.handleNodeChange(node)
    @_maybeChangeSelectedItem node

  changeNode: (data, node) ->
    node = node or @selectedNode()
    if node
      originalData =
        title: node.title
        image: node.image
        color: node.color
        initialValue: node.initialValue
        isAccumulator: node.isAccumulator

      @undoRedoManager.createAndExecuteCommand 'changeNode',
        execute: => @_changeNode node, data
        undo: => @_changeNode node, originalData

  _changeNode: (node, data) ->
    log.info "Change for #{node.title}"
    for key in ['title','image','color', 'initialValue', 'isAccumulator']
      if data.hasOwnProperty key
        log.info "Change #{key} for #{node.title}"
        node[key] = data[key]
    @_notifyNodeChanged(node)


  changeNodeWithKey: (key, data) ->
    node = @nodeKeys[ key ]
    if node
      @changeNode(data,node)

  selectLink: (link) ->
    @selectionManager.selectLink(link)

  changeLink: (link, changes={}) ->
    if changes.deleted
      @removeSelectedLink()
    else if link
      originalData =
        title: link.title
        color: link.color
        relation: link.relation
      @undoRedoManager.createAndExecuteCommand 'changeLink',
        execute: => @_changeLink link,  changes
        undo: => @_changeLink link, originalData

  _maybeChangeSelectedItem: (item) ->
    # TODO: This is kind of hacky:
    if @selectionManager.isSelected(item)
      @selectionManager._notifySelectionChange()

  _changeLink: (link, changes) ->
    log.info "Change  for #{link.title}"
    for key in ['title','color', 'relation']
      if changes[key]
        log.info "Change #{key} for #{link.title}"
        link[key] = changes[key]
    @_maybeChangeSelectedItem link

    for listener in @linkListeners
      log.info "link changed: #{link.terminalKey()}"
      listener.changeLink? link

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
    nodeKey = @selectedNode()?.key
    if nodeKey
      @removeNode nodeKey
      @selectionManager.clearSelection()

  removeSelectedLink: ->
    selectedLink = @selectionManager.getLinkSelection()[0] or null
    if selectedLink
      @removeLink(selectedLink)
      @selectionManager.clearLinkSelection()


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
