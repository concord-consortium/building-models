{div, span} = React.DOM

module.exports = React.createClass

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

  render: ->
    buttonClass = (enabled) -> "button-link #{if not enabled then 'disabled' else ''}"
    (div {className: 'document-actions'},
      (div {className: 'undo-redo'},
        (span {className: (buttonClass @state.canUndo), onClick: @undoClicked, disabled: not @state.canUndo}, 'Undo')
        (span {className: (buttonClass @state.canRedo), onClick: @redoClicked, disabled: not @state.canRedo}, 'Redo')
      )
    )
