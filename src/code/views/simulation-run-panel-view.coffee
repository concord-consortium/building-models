SimulationStore = require '../stores/simulation-store'
tr              = require '../utils/translate'
RecordButton    = React.createFactory require './record-button-view'
Dropdown        = React.createFactory require './dropdown-view'

{div, span, i, input}  = React.DOM

module.exports = React.createClass

  displayName: 'SimulationRunPanel'

  mixins: [ SimulationStore.mixin ]


  setDuration: (e) ->
    SimulationStore.actions.setDuration parseInt e.target.value

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

    if @state.graphHasCollector
      (div {className: wrapperClasses},
        @renderRecordForCollectors()
      )
    else
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

  renderRecordForCollectors: ->
    recordAction = SimulationStore.actions.recordPeriod
    if @state.isRecording
      recordAction = ->

    props =
      onClick: recordAction
      includeLight: false
      recording: @state.isRecording
      disabled: !@state.modelIsRunnable
    (div {className:'horizontal'},
      (RecordButton props,
        (div {className: 'horizontal'},
          (span {}, tr "~DOCUMENT.ACTIONS.DATA.RECORD")
          (i {className: "icon-codap-video-camera"})
        )
      )
      (input {
        type: "number"
        min: 1
        max: 1000
        style:
          width: "#{Math.max 3, (@state.duration.toString().length+1)}em"
        value: @state.duration
        onChange: @setDuration
      })
      (Dropdown
        isActionMenu: false
        onSelect: SimulationStore.actions.setStepUnits
        anchor: @state.stepUnitsName + "s"
        items: @state.timeUnitOptions
      )
    )


  renderRecordStreamButton: ->
    recordAction = SimulationStore.actions.recordStream
    if @state.isRecording
      recordAction = SimulationStore.actions.stopRecording

    props =
      onClick: recordAction
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
