{div, span, i, br} = React.DOM
AboutView        = React.createFactory require './about-view'
AppSettingsStore = require '../stores/app-settings-store'
CodapStore       = require '../stores/codap-store'
UndoRedoUIStore  = require '../stores/undo-redo-ui-store'
tr               = require '../utils/translate'

SimulationRunPanel = React.createFactory require './simulation-run-panel-view'

module.exports = React.createClass

  mixins: [ CodapStore.mixin, UndoRedoUIStore.mixin, AppSettingsStore.mixin ]

  displayName: 'DocumentActions'

  undoClicked: ->
    @props.graphStore.undo()

  redoClicked: ->
    @props.graphStore.redo()

  renderRunPanel: ->
    if not @props.diagramOnly
      (SimulationRunPanel {})

  render: ->
    buttonClass = (enabled) -> if not enabled then 'disabled' else ''
    (div {className: 'document-actions'},
      (div {className: "misc-actions"},
        @renderRunPanel()
      )

      unless @state.hideUndoRedo
        (div {className: 'misc-actions'},
          (i {className: "icon-codap-arrow-undo #{buttonClass @state.canUndo}", onClick: @undoClicked, disabled: not @state.canUndo})
          (i {className: "icon-codap-arrow-redo #{buttonClass @state.canRedo}", onClick: @redoClicked, disabled: not @state.canRedo})
        )

      (AboutView {})
    )
