SimulationStore = require '../stores/simulation-store'
tr              = require '../utils/translate'
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

    recordButtonClasses = "button"
    if not @state.modelIsRunnable then recordButtonClasses += " disabled error"
    if not @state.modelReadyToRun then recordButtonClasses += " disabled"

    resetButtonClasses = "button"
    if @state.modelReadyToRun then resetButtonClasses += " disabled"

    (div {className: wrapperClasses},
      (div {className: recordButtonClasses, onClick: SimulationStore.actions.runSimulation},
        (div {className: "horizontal"},
          (span {}, tr "Record 1")
          (i className: "icon-codap-camera")
        )
        (div {className: "horizontal"},
          (span {}, tr "Data Point")
        )
      )
      (div {className: recordButtonClasses, onClick: SimulationStore.actions.runSimulation},
        (div {className: 'horizontal'},
          (div {className: 'vertical', style: {'padding-right':'0.5em'}},
            (div {className: 'horizontal'},
              (span {}, tr "Record")
              (i {className: "icon-codap-video-camera"})
            )
            (div {className: 'horizontal'},
              (span {}, tr "Data Stream")
            )
          )
          (div {className: 'recording-box vertical'},
            (div {className: 'recording-light recording'})
          )
        )
      )
    )

  render: ->
    (div {className: "simulation-run-panel"},
      @renderToggleButton()
      @renderControls()
    )
