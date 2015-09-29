{div, span, i, br} = React.DOM

ModalAppSettings = React.createFactory require './modal-app-settings-view'
SimulationPanel  = React.createFactory require './simulation-panel-view'
AppSettingsStore = require '../stores/app-settings-store'
CodapStore       = require "../stores/codap-store"
tr               = require '../utils/translate'

module.exports = React.createClass

  mixins: [ CodapStore.mixin, AppSettingsStore.mixin ]

  displayName: 'DocumentActions'

  getInitialState: ->
    canRedo: false
    canUndo: false

  componentDidMount: ->
    @props.graphStore.addChangeListener @modelChanged

  modelChanged: (status) ->
    @setState
      canRedo: status.canRedo
      canUndo: status.canUndo

  undoClicked: ->
    @props.graphStore.undo()

  redoClicked: ->
    @props.graphStore.redo()

  renderRunLink: ->
    if @state.codapHasLoaded and not @props.diagramOnly
      (SimulationPanel {})

  renderSettingsLink: ->
    (span {},
      (i {className: "ivy-icon-options", onClick: AppSettingsStore.actions.showSettingsDialog})
    )

  render: ->
    buttonClass = (enabled) -> if not enabled then 'disabled' else ''
    (div {className: 'document-actions'},
      unless @state.hideUndoRedo
        (div {className: 'misc-actions'},
          (i {className: "ivy-icon-arrow-undo #{buttonClass @state.canUndo}", onClick: @undoClicked, disabled: not @state.canUndo})
          (i {className: "ivy-icon-arrow-redo #{buttonClass @state.canRedo}", onClick: @redoClicked, disabled: not @state.canRedo})
        )

      (div {className: "misc-actions"},
        @renderRunLink()
      )

      if @props.iframed
        (div {className: "misc-actions"},
          @renderSettingsLink()
        )
      (ModalAppSettings {
        showing: @state.showingSettingsDialog
        capNodeValues: @state.capNodeValues
        diagramOnly: @state.diagramOnly
        onClose: ->
          AppSettingsStore.actions.close()
      })
    )
