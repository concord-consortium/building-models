{div, span, i, br} = React.DOM

CodapStore = require "../stores/codap-store"
tr         = require '../utils/translate'

module.exports = React.createClass

  mixins: [ CodapStore.mixin ]

  displayName: 'DocumentActions'

  getInitialState: ->
    canRedo: false
    canUndo: false

  componentDidMount: ->
    @props.linkManager.addChangeListener @modelChanged

  modelChanged: (status) ->
    @setState
      canRedo: status.canRedo
      canUndo: status.canUndo

  undoClicked: ->
    @props.linkManager.undo()

  redoClicked: ->
    @props.linkManager.redo()

  renderRunLink: ->
    if @state.codapHasLoaded and not @props.simplified
      (span {},
        (i {className: "fa fa-play-circle", onClick: @props.runSimulation})
        tr "~DOCUMENT.ACTIONS.RUN_SIMULATION"
      )

  render: ->
    buttonClass = (enabled) -> "button-link #{if not enabled then 'disabled' else ''}"
    (div {className: 'document-actions'},
      (div {className: "misc-actions"},
        @renderRunLink()
      )
      unless @state.hideUndoRedo
        (div {className: 'undo-redo'},
          (span {className: (buttonClass @state.canUndo), onClick: @undoClicked, disabled: not @state.canUndo}, tr "~DOCUMENT.ACTIONS.UNDO")
          (span {className: (buttonClass @state.canRedo), onClick: @redoClicked, disabled: not @state.canRedo}, tr "~DOCUMENT.ACTIONS.REDO")
        )
    )
