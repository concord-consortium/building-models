Simulation = require "../models/simulation"

module.exports =

  getInitialAppViewState: (subState) ->

    # load the metadata at startup
    internalLibrary = require '../data/internal-library'
    for node in internalLibrary
      @props.linkManager.setImageMetadata node.image, node.metadata

    mixinState =
      selectedNode: null
      selectedConnection: null
      palette: require '../data/initial-palette'
      internalLibrary: internalLibrary
      filename: null
    _.extend mixinState, subState

  componentDidUpdate: ->
    log.info 'Did Update: AppView'

  addDeleteKeyHandler: (add) ->
    if add
      deleteFunction = @props.linkManager.deleteSelected.bind @props.linkManager
      $(window).on 'keydown', (e) ->
        if e.which is 8 and not $(e.target).is('input, textarea')
          e.preventDefault()
          deleteFunction()
    else
      $(window).off 'keydown'

  addToPalette: (node) ->
    if node?.image.match /^(https?|data):/
      # make sure this is a new image
      if not @inPalette node
        palette = @state.palette.slice 0
        palette.push
          title: node.title or ''
          image: node.image
          metadata: node.metadata
        if node.metadata
          @props.linkManager.setImageMetadata node.image, node.metadata
        @setState palette: palette

  _nodeInUse: (node, collection) ->
    !!((_.find collection, {image: node.image}) or (node.metadata and (_.find collection, {metadata: {link: node.metadata.link}})))

  inPalette: (node) ->
    @_nodeInUse node, @state.palette

  inLibrary: (node) ->
    @_nodeInUse node, @state.internalLibrary

  componentDidMount: ->
    @addDeleteKeyHandler true
    @props.linkManager.selectionManager.addSelectionListener (manager) =>
      selectedNode = manager.getInspection()[0] or null
      editingNode  = manager.getTitleEditing()[0] or null
      selectedLink = manager.getLinkSelection()[0] or null
      
      @setState
        selectedNode: selectedNode
        editingNode: editingNode
        selectedLink: selectedLink

      @addToPalette selectedNode
      log.info 'updated selections'

    @props.linkManager.addLoadListener (data) =>
      # reload the palette
      if data.palette
        @setState palette: data.palette
      else
        @setState palette: (require '../data/initial-palette')
        for node in data.nodes
          @addToPalette node

    @props.linkManager.addFilenameListener (filename) =>
      @setState filename: filename

    if @props.data?.length > 0
      @props.linkManager.loadData JSON.parse @props.data
    else
      @props.linkManager.loadDataFromUrl @props.url

    # cross platform undo/redo
    ($ window).on 'keydown', (e) =>
      y = (e.keyCode is 89) or (e.keyCode is 121)
      z = (e.keyCode is 90) or (e.keyCode is 122)
      return if not (y or z)
      if e.metaKey
        undo = z and not e.shiftKey
        redo = (z and e.shiftKey) or y
      else if e.ctrlKey
        undo = z
        redo = y
      else
        undo = redo = false
      if undo or redo
        e.preventDefault()
        @props.linkManager.redo() if redo
        @props.linkManager.undo() if undo

  componentDidUnmount: ->
    @addDeleteKeyHandler false

  getData: ->
    @props.linkManager.toJsonString @state.palette

  onNodeChanged: (node, data) ->
    @props.linkManager.changeNode data

  onNodeDelete: ->
    @props.linkManager.deleteSelected()

  onLinkChanged: (link, title, color, deleted) ->
    @props.linkManager.changeLink link, title,color, deleted

  runSimulation: ->
    simulator = new Simulation
      nodes: @props.linkManager.getNodes()
      duration: 10
      timeStep: 1
      reportFunc: (report) ->
        log.info report

    simulator.run()
    simulator.report()
