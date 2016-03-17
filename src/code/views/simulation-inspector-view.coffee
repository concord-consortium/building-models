Dropdown        = React.createFactory require './dropdown-view'
ValueSlider     = React.createFactory require './value-slider-view'
SimulationStore = require '../stores/simulation-store'
AppSettingsStore = require '../stores/app-settings-store'
tr              = require '../utils/translate'
{div, span, i, input, label}  = React.DOM

module.exports = React.createClass

  displayName: 'SimulationInspector'

  mixins: [ SimulationStore.mixin, AppSettingsStore.mixin ]

  setDuration: (e) ->
    SimulationStore.actions.setDuration parseInt e.target.value

  setCapNodeValues: (e) ->
    SimulationStore.actions.capNodeValues e.target.checked

  setDiagramOnly: (e) ->
    AppSettingsStore.actions.diagramOnly e.target.checked

  setShowingMinigraphs: (e) ->
    AppSettingsStore.actions.showMinigraphs e.target.checked

  render: ->
    runPanelClasses = "run-panel"
    if not @state.diagramOnly then runPanelClasses += " expanded"
    minigraphsCheckboxClass = "row"
    if @state.diagramOnly then minigraphsCheckboxClass += " disabled"

    (div {className: "simulation-panel"},
      (div {className: runPanelClasses},
        (div {className: "title"}, tr "~SIMULATION.SIMULATION_SETTINGS")
        (div {className: "row tall"},
          tr "~SIMULATION.STEP_UNIT"
          (Dropdown {
            isActionMenu: false
            onSelect: SimulationStore.actions.setStepUnits
            anchor: @state.stepUnitsName
            items: @state.timeUnitOptions
          })
        )
        (div {className: "row tall"},
          tr "~SIMULATION.DURATION"
          (input {
            type: "number"
            style: {width: "#{Math.max 4, (@state.duration.toString().length+1)}em"}
            value: @state.duration
            onChange: @setDuration
          })
        )
        (div {className: "row"},
          (span {}, "Speed")
          (div {},
            (ValueSlider {
              min: 0
              max: 4
              value: @state.speed
              width: 100
              stepSize: 1
              showTicks: true
              snapToSteps: true
              minLabel: (i {className: "icon-codap-speedSlow", style: {fontSize: 15, marginLeft: -5}})
              maxLabel: (i {className: "icon-codap-speedFast", style: {fontSize: 15, marginRight: -10}})
              renderValueTooltip: false
              onValueChange: SimulationStore.actions.setSpeed
            })
          )
        )
        (div {className: "row"},
          (input {type: 'checkbox', value: 'cap-values', checked: @state.capNodeValues, onChange: @setCapNodeValues})
          (label {}, tr '~SIMULATION.CAP_VALUES')
        )
      )
      (div {className: "title"}, tr "~SIMULATION.DIAGRAM_SETTINGS")
      (div {className: minigraphsCheckboxClass},
        (input {type: 'checkbox', value: 'show-mini', checked: @state.showingMinigraphs, disabled: @state.diagramOnly, onChange: @setShowingMinigraphs})
        (label {}, tr '~DOCUMENT.ACTIONS.SHOW_MINI_GRAPHS')
      )
      (div {className: "row"},
        (input {type: 'checkbox', value: 'diagram-only', checked: @state.diagramOnly, onChange: @setDiagramOnly})
        (label {}, tr '~SIMULATION.DIAGRAM_ONLY')
      )
    )
