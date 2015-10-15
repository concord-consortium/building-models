{div, span, i, br} = React.DOM

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
    # if @state.codapHasLoaded and not @props.diagramOnly
    #   (SimulationPanel {})

  render: ->
    buttonClass = (enabled) -> if not enabled then 'disabled' else ''
    (div {className: 'document-actions'},
      unless @state.hideUndoRedo
        (div {className: 'misc-actions'},
          (i {className: "icon-codap-arrow-undo #{buttonClass @state.canUndo}", onClick: @undoClicked, disabled: not @state.canUndo})
          (i {className: "icon-codap-arrow-redo #{buttonClass @state.canRedo}", onClick: @redoClicked, disabled: not @state.canRedo})
        )

      (div {className: "misc-actions"},
        @renderRunLink()
      )
    )
