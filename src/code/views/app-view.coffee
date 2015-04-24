Placeholder = React.createFactory require './placeholder-view'
GlobalNav = React.createFactory require './global-nav-view'
LinkView    = React.createFactory require './link-view'
NodeWell    = React.createFactory require './node-well-view'
NodeEditView= React.createFactory require './node-edit-view'
LinkEditView= React.createFactory require './link-edit-view'
StatusMenu  = React.createFactory require './status-menu-view'
InspectorPanel = React.createFactory require './inspector-panel-view'

{div} = React.DOM

module.exports = React.createClass

  displayName: 'WirefameApp'

  mixins: [require '../mixins/app-view']

  getInitialState: ->

    try
      iframed = window.self isnt window.top
    catch
      iframed = true

    @getInitialAppViewState
      iframed: iframed
      username: 'Jane Doe'
      filename: 'Untitled Model'

  render: ->
    (div {className: 'app'},
      (div {className: if @state.iframed then 'iframed-workspace' else 'workspace'},
        if not @state.iframed
          (GlobalNav
            filename: @state.filename
            username: @state.username
            linkManager: @props.linkManager
            getData: @getData
          )
        (div {className: 'action-bar'},
          (NodeWell {protoNodes: @state.protoNodes})
          (Placeholder {label: 'Document Actions', className: 'document-actions'})
        )
        (div {className: 'canvas'},
          (LinkView {linkManager: @props.linkManager, selectedLink: @state.selectedConnection})
        )
        (InspectorPanel
          node: @state.selectedNode
          link: @state.selectedConnection
          onNodeChanged: @onNodeChanged
          onLinkChanged: @onLinkChanged
          protoNodes: @state.protoNodes
        )
      )
    )
