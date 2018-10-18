SimulationStore = require '../stores/simulation-store'
AppSettingsStore = require '../stores/app-settings-store'

tr              = require '../utils/translate'
RecordButton    = React.createFactory require './record-button-view'
Dropdown        = React.createFactory require './dropdown-view'
ExperimentPanel = React.createFactory require './experiment-panel-view'

{div, span, i, input}  = React.DOM

module.exports = React.createClass

  displayName: 'SimulationRunPanel'

  mixins: [ SimulationStore.mixin, AppSettingsStore.mixin ]


  setDuration: (e) ->
    SimulationStore.actions.setDuration parseInt e.target.value

  toggle: ->
    if @state.simulationPanelExpanded
      SimulationStore.actions.collapseSimulationPanel()
    else
      SimulationStore.actions.expandSimulationPanel()
      # -- TBD: There was discussion about automatically showing
      # -- MiniGraphs when this panel is opened  …  NP 2018-01
      # if ! @state.showingMinigraphs
      #   AppSettingsStore.actions.showMinigraphs true

  renderToggleButton: ->
    iconClass = if @state.simulationPanelExpanded then "inspectorArrow-collapse" else "inspectorArrow-expand"
    simRefFunc = (elt) => @simulateElt = elt
    simText = tr "~DOCUMENT.ACTIONS.SIMULATE"
    simTextWidth = if @simulateElt? then @simulateElt.clientWidth else simText.length * 6
    simTextLeft = simTextWidth / 2 - 6
    simStyle = { left: simTextLeft }
    (div {className: "flow", onClick: @toggle},
      (div {className: "toggle-title", ref: simRefFunc, style: simStyle }, simText)
      (i {className: "icon-codap-#{iconClass}"})
    )

  renderControls: ->
    wrapperClasses = "buttons flow"
    if !@state.simulationPanelExpanded then wrapperClasses += " closed"
    disabled = (@state.isRecording && !@state.isRecordingOne) || !@state.modelIsRunnable
    experimentDisabled = !@state.modelIsRunnable || @state.isRecordingPeriod
    (div {className: wrapperClasses},
      (div {className: "vertical" },
        (ExperimentPanel {disabled: experimentDisabled})
        if @state.isTimeBased
          @renderRecordForCollectors()
        else
          (div {className: "horizontal"},
            (RecordButton
              onClick: SimulationStore.actions.recordOne
              disabled: disabled
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
      )
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
        anchor: @state.stepUnitsName
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
      recording: @state.isRecordingStream
      disabled: !@state.modelIsRunnable || @state.isRecordingOne

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
