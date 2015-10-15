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

    runButtonClasses = "button"
    if not @state.modelIsRunnable then runButtonClasses += " disabled error"
    if @state.modelIsRunning then runButtonClasses += " disabled"

    (div {className: wrapperClasses},
      (div {className: runButtonClasses, onClick: SimulationStore.actions.runSimulation},
        tr "~DOCUMENT.ACTIONS.RUN"
        (i {className: "icon-codap-play"})
      )
      (div {className: "button disabled"},
        (i {className: "icon-codap-controlsReset"})
      )
      (div {className: "button disabled"},
        (i {className: "icon-codap-controlsForward"})
      )
      (div {className: "button disabled"},
        (i {className: "icon-codap-graph"})
      )
    )

  render: ->
    (div {className: "simulation-run-panel"},
      @renderToggleButton()
      @renderControls()
    )
