Placeholder = React.createFactory require './placeholder-view'
GlobalNav = React.createFactory require './global-nav-view'
LinkView    = React.createFactory require './link-view'
NodeWell    = React.createFactory require './node-well-view'
InspectorPanel = React.createFactory require './inspector-panel-view'
ImageBrowser = React.createFactory require './image-browser-view'
DocumentActions    = React.createFactory require './document-actions-view'

{div, a} = React.DOM

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

  toggleImageBrowser: ->
    @setState showImageBrowser: not @state.showImageBrowser

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
          (NodeWell {palette: @state.palette})
          (DocumentActions {linkManager: @props.linkManager})
        )
        (div {className: 'canvas'},
          (LinkView {linkManager: @props.linkManager, selectedLink: @state.selectedConnection})
        )
        (InspectorPanel
          node: @state.selectedNode
          link: @state.selectedConnection
          onNodeChanged: @onNodeChanged
          onLinkChanged: @onLinkChanged
          onNodeDelete: @onNodeDelete
          palette: @state.palette
          toggleImageBrowser: @toggleImageBrowser
          linkManager: @props.linkManager
        )
        if @state.showImageBrowser
          (ImageBrowser
            internalLibrary: @state.internalLibrary
            palette: @state.palette
            addToPalette: @addToPalette
            inPalette: @inPalette
            close: @toggleImageBrowser
          )
      )
    )
