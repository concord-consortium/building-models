Placeholder = React.createFactory require './placeholder-view'
GlobalNav = React.createFactory require './global-nav-view'
LinkView    = React.createFactory require '../link-view'
NodeWell    = React.createFactory require '../node-well-view'
NodeEditView= React.createFactory require '../node-edit-view'
LinkEditView= React.createFactory require '../link-edit-view'
StatusMenu  = React.createFactory require '../status-menu-view'

{div} = React.DOM

module.exports = React.createClass

  displayName: 'WirefameApp'

  mixins: [require '../../mixins/app-view']

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
    (div {className: 'wireframe-app'},
      (if not @state.iframed then (GlobalNav {filename: @state.filename, username: @state.username}) else null)
      (div {className: if @state.iframed then 'wireframe-iframed-workspace' else 'wireframe-workspace'},
        (div {className: 'wireframe-component-palette'},
          (NodeWell {protoNodes: @state.protoNodes})
        )
        (Placeholder {label: 'Document Actions', className: 'wireframe-document-actions'})
        (div {className: 'wireframe-canvas'},
          (LinkView {linkManager: @props.linkManager, selectedLink: @state.selectedConnection})
        )
        (div {className: 'wireframe-inspector-panel'},
          (div {style: {margin: 10}},
            (NodeEditView {node: @state.selectedNode, onNodeChanged: @onNodeChanged, protoNodes: @state.protoNodes})
            (LinkEditView {link: @state.selectedConnection, onLinkChanged: @onLinkChanged})
          )
        )
      )
    )
