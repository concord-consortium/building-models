Reflux = require 'reflux'
tr                  = require '../utils/translate'

Placeholder        = React.createFactory require './placeholder-view'
GlobalNav          = React.createFactory require './global-nav-view'
GraphView          = React.createFactory require './graph-view'
NodeWell           = React.createFactory require './node-well-view'
InspectorPanel     = React.createFactory require './inspector-panel-view'
ImageBrowser       = React.createFactory require './image-browser-view'
DocumentActions    = React.createFactory require './document-actions-view'
ModalPaletteDelete = React.createFactory require './modal-palette-delete-view'
BuildInfoView      = React.createFactory require './build-info-view'

ImageDialogStore    = require '../stores/image-dialog-store'
AppSettingsStore    = require '../stores/app-settings-store'


{div, a} = React.DOM

module.exports = React.createClass

  displayName: 'WirefameApp'

  mixins: [ImageDialogStore.mixin, AppSettingsStore.mixin, require '../mixins/app-view']

  getInitialState: ->

    try
      iframed = window.self isnt window.top
    catch
      iframed = true

    @getInitialAppViewState
      iframed: iframed
      username: 'Jane Doe'
      filename: tr "~MENU.UNTITLED_MODEL"

  selectionUpdated: ->
    this.refs.inspectorPanel?.nodeSelectionChanged()

  toggleImageBrowser: ->
    @setState showImageBrowser: not @state.showImageBrowser

  render: ->
    (div {className: 'app'},
      (div {className: if @state.iframed then 'iframed-workspace' else 'workspace'},
        if not @state.iframed && AppSettingsStore.store.settings.uiElements.globalNav != false
          (GlobalNav
            filename: @state.filename
            username: @state.username
            graphStore: @props.graphStore
            GraphStore: @GraphStore
            display: AppSettingsStore.store.settings.uiElements.globalNav
          )
        (div {className: if AppSettingsStore.store.settings.uiElements.actionBar == false then 'action-bar hidden' else if AppSettingsStore.store.settings.uiElements.globalNav is false then 'action-bar small' else 'action-bar'},
          (NodeWell {
            palette: @state.palette
            toggleImageBrowser: @toggleImageBrowser
            graphStore: @props.graphStore
            uiElements: AppSettingsStore.store.settings.uiElements
          })
          (DocumentActions
            graphStore: @props.graphStore
            diagramOnly: @state.simulationType is AppSettingsStore.store.SimulationType.diagramOnly
            iframed: @state.iframed
          )
        )
        (div {className: if AppSettingsStore.store.settings.uiElements.globalNav is false then 'canvas full' else 'canvas'},
          (GraphView {
            graphStore: @props.graphStore,
            selectionManager: @props.graphStore.selectionManager,
            selectedLink: @state.selectedLink})
        )
        (InspectorPanel
          node: @state.selectedNode
          link: @state.selectedLink
          onNodeChanged: @onNodeChanged
          onNodeDelete: @onNodeDelete
          palette: @state.palette
          diagramOnly: @state.simulationType is AppSettingsStore.store.SimulationType.diagramOnly
          toggleImageBrowser: @toggleImageBrowser
          graphStore: @props.graphStore
          ref: "inspectorPanel"
          display: AppSettingsStore.store.settings.uiElements.inspectorPanel
        )
        if @state.showingDialog
          (ImageBrowser
            graphStore: @props.graphStore
          )
        (ModalPaletteDelete {})
      )
      if @state.iframed
        (BuildInfoView {})
    )
