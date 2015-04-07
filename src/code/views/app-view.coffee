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

    @props.linkManager.addSelectionListener (selections) =>
      @setState
        selectedNode: selections.node
        selectedConnection: selections.connection
      log.info 'updated selections: + selections'

    if @props.data?.length > 0
      @props.linkManager.loadData JSON.parse @props.data
    else
      @props.linkManager.loadDataFromUrl @props.url

  componentDidUnmount: ->
    @addDeleteKeyHandler false

  getData: ->
    @props.linkManager.toJsonString()

  onNodeChanged: (node,title,image) ->
    @props.linkManager.changeNode title, image

  onLinkChanged: (link, title, color, deleted) ->
    @props.linkManager.changeLink title,color, deleted

  onAddRemoteImage: (image) ->
    # make sure this is a new image
    if not _.find @state.protoNodes, {image: image}
      # add the image before the empty image
      protoNodes = @state.protoNodes.slice 0
      emptyPos = _.findIndex protoNodes, {image: ''}
      protoNodes.splice (if emptyPos is -1 then protoNodes.length else emptyPos), 0,
        type: 'remote'
        title: ''
        image: image
      @setState protoNodes: protoNodes

  onNodeWellClicked: (image) ->
    if @state.selectedNode
      @props.linkManager.changeNode @state.selectedNode.title, image

  render: ->
    (div {className: 'app'},
      (StatusMenu {linkManager: @props.linkManager, getData: @getData})
      (LinkView {linkManager: @props.linkManager})
      (div {className: 'bottomTools'},
        (NodeWell {protoNodes: @state.protoNodes, onNodeClicked: @onNodeWellClicked })
        (NodeEditView {node: @state.selectedNode, onNodeChanged: @onNodeChanged, protoNodes: @state.protoNodes, onAddRemoteImage: @onAddRemoteImage})
        (LinkEditView {link: @state.selectedConnection, onLinkChanged: @onLinkChanged})
      )
    )
