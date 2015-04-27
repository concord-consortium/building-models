module.exports =

  getInitialAppViewState: (subState) ->
    mixinState =
      selectedNode: null
      selectedConnection: null
      protoNodes: require '../views/proto-nodes'
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
      if not _.find @state.protoNodes, {image: node.image}
        protoNodes = @state.protoNodes.slice 0
        protoNodes.push
          title: node.title or ''
          image: node.image
        @setState protoNodes: protoNodes

  componentDidMount: ->
    @addDeleteKeyHandler true

    @props.linkManager.addSelectionListener (selections) =>
      @setState
        selectedNode: selections.node
        selectedConnection: selections.connection
      @addToPalette selections.node
      log.info 'updated selections: + selections'

    @props.linkManager.addLoadListener (data) =>
      # reload the palette
      if data.palette
        @setState protoNodes: data.palette
      else
        @setState protoNodes: (require '../views/proto-nodes')
        for node in data.nodes
          @addToPalette node

    @props.linkManager.addFilenameListener (filename) =>
      @setState filename: filename

    if @props.data?.length > 0
      @props.linkManager.loadData JSON.parse @props.data
    else
      @props.linkManager.loadDataFromUrl @props.url

  componentDidUnmount: ->
    @addDeleteKeyHandler false

  getData: ->
    @props.linkManager.toJsonString @state.protoNodes

  onNodeChanged: (node,title,image) ->
    @props.linkManager.changeNode title, image

  onLinkChanged: (link, title, color, deleted) ->
    @props.linkManager.changeLink title,color, deleted
