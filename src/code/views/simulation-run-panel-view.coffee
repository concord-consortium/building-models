SimulationStore = require '../stores/simulation-store'
tr              = require '../utils/translate'
RecordButton    = React.createFactory require './record-button-view'

{div, span, i}  = React.DOM

module.exports = React.createClass

  displayName: 'SimulationRunPanel'

  mixins: [ SimulationStore.mixin ]

  toggle: ->
    if @state.simulationPanelExpanded
      SimulationStore.actions.collapseSimulationPanel()
    else
      SimulationStore.actions.expandSimulationPanel()

  renderToggleButton: ->
    iconClass = if @state.simulationPanelExpanded then "inspectorArrow-collapse" else "inspectorArrow-expand"
    (div {className: "flow", onClick: @toggle},
      (div {className: "toggle-title"}, tr "~DOCUMENT.ACTIONS.SIMULATE")
      (i {className: "icon-codap-#{iconClass}"})
    )

  renderControls: ->
    wrapperClasses = "buttons flow"
    if @state.simulationPanelExpanded then wrapperClasses += " expanded"

    (div {className: wrapperClasses},
      (RecordButton
        onClick: SimulationStore.actions.recordOne
        disabled: @state.isRecording || !@state.modelIsRunnable
        ,
        (div {className: "horizontal"},
          (span {}, tr "~DOCUMENT.ACTIONS.DATA.RECORD-1")
          (i className: "icon-codap-camera")
        )
        (div {className: "horizontal"},
          (span {}, tr "~DOCUMENT.ACTIONS.DATA.POINT")
        )
      )
      @renderRecordStreamButton()
    )

  renderRecordStreamButton: ->
    recordStreamAction = SimulationStore.actions.recordStream

    if @state.isRecording
      recordStreamAction = SimulationStore.actions.stopRecording

    props =
      onClick: recordStreamAction
      includeLight: true
      recording: @state.isRecording
      disabled: !@state.modelIsRunnable

    if @state.isRecording
      (RecordButton props,
        (div {className: 'horizontal'},
          (span {}, tr "~DOCUMENT.ACTIONS.DATA.STOP")
          (i {className: "icon-codap-video-camera"})
        )
        (div {className: 'horizontal'},
          (span {}, tr "~DOCUMENT.ACTIONS.DATA.RECORDING")
        )
      )
    else
      (RecordButton props,
        (div {className: 'horizontal'},
          (span {}, tr "~DOCUMENT.ACTIONS.DATA.RECORD")
          (i {className: "icon-codap-video-camera"})
        )
        (div {className: 'horizontal'},
          (span {}, tr "~DOCUMENT.ACTIONS.DATA.STREAM")
        )
      )

  render: ->
    (div {className: "simulation-run-panel"},
      @renderToggleButton()
      @renderControls()
    )
