Importer            = require '../utils/importer'
Link                = require './link'
DiagramNode         = require './node'
UndoRedo            = require '../utils/undo-redo'
SelectionManager    = require './selection-manager'
PaletteStore        = require "../stores/palette-store"
tr                  = require "../utils/translate"
Migrations          = require "../data/migrations/migrations"

NodesStore          = require "../stores/nodes-store"
PaletteDeleteStore  = require "../stores/palette-delete-dialog-store"

LinkManager  = (context) ->
  Reflux.createStore

    init: (context) ->
      @linkKeys           = {}
      @nodeKeys           = {}
      @loadListeners      = []
      @filename           = null
      @filenameListeners  = []

      @undoRedoManager    = UndoRedo.instance debug:true, context:context
      @selectionManager   = new SelectionManager()
      PaletteDeleteStore.store.listen @paletteDelete.bind(@)


    paletteDelete: (status) ->
      {deleted,paletteItem,replacement} = status
      if deleted and paletteItem and replacement
        for node in @getNodes()
          if node.paletteItemIs paletteItem
            @changeNode({image: replacement.image},node)

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

    addChangeListener: (listener) ->
      log.info("adding change listener")
      @undoRedoManager.addChangeListener listener

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
        @updateListeners()
        return true

    removeLink: (link) ->
      @undoRedoManager.createAndExecuteCommand 'removeLink',
        execute: => @_removeLink link
        undo: => @_addLink link

    _removeLink: (link) ->
      delete @linkKeys[link.terminalKey()]
      @nodeKeys[link.sourceNode.key]?.removeLink(link)
      @nodeKeys[link.targetNode.key]?.removeLink(link)
      @updateListeners()

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
        NodesStore.actions.nodesChanged(@getNodes())
        @updateListeners()
        return true
      return false

    _removeNode: (node) ->
      delete @nodeKeys[node.key]
      NodesStore.actions.nodesChanged(@getNodes())
      @updateListeners()

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
      @updateListeners()

    selectedNode: ->
      @selectionManager.selection(SelectionManager.NodeInpsection)[0] or null

    editingNode: ->
      @selectionManager.selection(SelectionManager.NodeTitleEditing)[0] or null

    editNode: (nodeKey) ->
      @selectionManager.selectForTitleEditing(@nodeKeys[nodeKey])

    selectNode: (nodeKey) ->
      @selectionManager.selectForInspection(@nodeKeys[nodeKey])


    _notifyNodeChanged: (node) ->
      NodesStore.actions.nodesChanged(@getNodes())
      @_maybeChangeSelectedItem node
      @updateListeners()

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
      @updateListeners()

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
      PaletteStore.actions.loadData(data)
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

      data =
        version: Migrations.latestVersion()
        filename: @filename
        palette: palette
        nodes: nodeExports
        links: linkExports
      return data

    toJsonString: (palette) ->
      JSON.stringify @serialize palette

    updateListeners: ->
      data =
        nodes: @getNodes()
        links: @getLinks()
      @trigger(data)

defaultContextName = 'building-models'
instances = []
instance = (contextName=defaultContextName) ->
  instances[contextName] ||= new LinkManager(contextName)

mixin =
  getInitialState: ->
    @linkManager ||= instance()
    nodes: @linkManager.nodes
    links: @linkManager.links

  componentDidMount: ->
    @linkManager ||= instance()
    @linkManager.listen @onLinksChange

  onLinksChange: (status) ->
    @setState
      nodes: status.nodes
      links: status.links
    # TODO: not this:
    @diagramToolkit?.repaint()

module.exports =
  instance: instance
  mixin: mixin
