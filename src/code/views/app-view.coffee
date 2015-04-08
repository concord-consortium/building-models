LinkView    = React.createFactory require './link-view'
NodeWell    = React.createFactory require './node-well-view'
NodeEditView= React.createFactory require './node-edit-view'
LinkEditView= React.createFactory require './link-edit-view'
StatusMenu  = React.createFactory require './status-menu-view'

{div} = React.DOM

log.setLevel log.levels.TRACE

module.exports = React.createClass

  displayName: 'App'

  getInitialState: ->
    selectedNode: null
    selectedConnection: null
    protoNodes: require './proto-nodes'
    filename: null

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

  componentDidMount: ->
    @addDeleteKeyHandler true
    
    updatePalette = (node) =>
      if node?.image.match /^https?:/
        # make sure this is a new image
        if not _.find @state.protoNodes, {image: node.image}
          # add the image before the empty image
          protoNodes = @state.protoNodes.slice 0
          emptyPos = _.findIndex protoNodes, {image: ''}
          protoNodes.splice (if emptyPos is -1 then protoNodes.length else emptyPos), 0,
            title: ''
            image: node.image
          @setState protoNodes: protoNodes

    @props.linkManager.addSelectionListener (selections) =>
      @setState
        selectedNode: selections.node
        selectedConnection: selections.connection
      updatePalette selections.node
      log.info 'updated selections: + selections'
      
    @props.linkManager.addLoadListener (data) =>
      # reload the palette
      if data.palette
        @setState protoNodes: data.palette
      else
        @setState protoNodes: (require './proto-nodes')
        for node in data.nodes
          updatePalette node
          
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

  render: ->
    (div {className: 'app'},
      (StatusMenu {linkManager: @props.linkManager, getData: @getData, filename: @state.filename})
      (LinkView {linkManager: @props.linkManager})
      (div {className: 'bottomTools'},
        (NodeWell {protoNodes: @state.protoNodes})
        (NodeEditView {node: @state.selectedNode, onNodeChanged: @onNodeChanged, protoNodes: @state.protoNodes})
        (LinkEditView {link: @state.selectedConnection, onLinkChanged: @onLinkChanged})
      )
    )
