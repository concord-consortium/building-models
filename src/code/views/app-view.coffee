LinkView    = React.createFactory require './link-view'
NodeWell    = React.createFactory require './node-well-view'
NodeEditView= React.createFactory require './node-edit-view'
LinkEditView= React.createFactory require './link-edit-view'
StatusMenu  = React.createFactory require './status-menu-view'

{div} = React.DOM

log.setLevel log.levels.TRACE

module.exports = React.createClass

  displayName: 'App'
  
  mixins: [require '../mixins/app-view']

  getInitialState: ->
    @getInitialAppViewState
      selectedNode: null
      selectedConnection: null
      protoNodes: require './proto-nodes'
      filename: null

  render: ->
    (div {className: 'app'},
      (StatusMenu {linkManager: @props.linkManager, getData: @getData, filename: @state.filename})
      (LinkView {linkManager: @props.linkManager, selectedLink: @state.selectedConnection})
      (div {className: 'bottomTools'},
        (NodeWell {protoNodes: @state.protoNodes})
        (NodeEditView {node: @state.selectedNode, onNodeChanged: @onNodeChanged, protoNodes: @state.protoNodes})
        (LinkEditView {link: @state.selectedConnection, onLinkChanged: @onLinkChanged})
      )
    )
