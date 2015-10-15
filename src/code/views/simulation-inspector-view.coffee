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

  render: ->
    runButtonClasses = "button"
    if not @state.modelIsRunnable then runButtonClasses += " disabled error"
    (div {className: "simulation-panel"},
      (div {className: "title"}, tr "~SIMULATION.SIMULATION_SETTINGS")
      (div {className: "run-panel"},
        (div {className: "row"},
          tr "~SIMULATION.STEP_UNIT"
          (Dropdown {
            isActionMenu: false
            onSelect: SimulationStore.actions.setStepUnits
            anchor: @state.stepUnitsName
            items: @state.timeUnitOptions
          })
        )
        (div {className: "row"},
          tr "~SIMULATION.DURATION"
          (input {
            type: "number"
            style: {width: "#{Math.max 4, (@state.duration.toString().length+1)}em"}
            value: @state.duration
            min: "0"
            onChange: @setDuration
          })
        )
        (div {className: "row", style: {margin: "6px 0 -19px 0"}},
          (span {style: {marginTop: 2}}, "Speed")
          (div {style: {margin: "-11px 0 3px 7px"}},
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
      )
      (div {className: "row"},
        (input {type: 'checkbox', value: 'show-mini', checked: @props.showMiniGraphs})
        (label {}, tr '~DOCUMENT.ACTIONS.SHOW_MINI_GRAPHS')
      )
      (div {className: "row"},
        (input {type: 'checkbox', value: 'cap-values', checked: @state.capNodeValues, onChange: @setCapNodeValues})
        (label {}, tr '~SIMULATION.CAP_VALUES')
      )
      (div {className: "title"}, tr "~SIMULATION.MODEL_SETTINGS")
      (div {className: "row"},
        (input {type: 'checkbox', value: 'diagram-only', checked: @state.diagramOnly, onChange: @setDiagramOnly})
        (label {}, tr '~SIMULATION.DIAGRAM_ONLY')
      )
    )
