Dropdown        = React.createFactory require './dropdown-view'
ValueSlider     = React.createFactory require './value-slider-view'
SimulationStore = require '../stores/simulation-store'
tr              = require '../utils/translate'
{div, span, i, input, label}  = React.DOM

module.exports = React.createClass

  displayName: 'SimulationPanel'

  mixins: [ SimulationStore.mixin ]

  toggle: ->
    if @state.simulationPanelExpanded
      SimulationStore.actions.collapseSimulationPanel()
    else
      SimulationStore.actions.expandSimulationPanel()

  stepsRangeChanged: (r) ->
    SimulationStore.actions.setPeriod r.max

  setStepSize: (e) ->
    SimulationStore.actions.setStepSize parseInt e.target.value

  render: ->
    expanded = if @state.simulationPanelExpanded then "expanded" else "collapsed"
    runButtonClasses = "button"
    if not @state.modelIsRunnable then runButtonClasses += " disabled error"
    (div {className: 'simulation-panel-wrapper'},
      (div {className: "top-button #{expanded}", onClick: @toggle},
        (div {},
          (i {className: "icon-codap-simulateTool"})
        )
        (div {style: {marginTop: -9}}, tr "~DOCUMENT.ACTIONS.SIMULATE")
      )
      (div {className: "simulation-panel #{expanded}"},
        (div {className: "run-panel"},
          (div {className: "row short"},
            (Dropdown {
              isActionMenu: false
              onSelect: SimulationStore.actions.setPeriodUnits
              anchor: @state.periodUnitsName
              items: @state.timeUnitOptions
            })
          )
          (div {className: "row short"},
            (ValueSlider {
              min: 0
              max: @state.period
              value: 0
              width: 180
              maxEditable: true
              onRangeChange: @stepsRangeChanged}
            )
          )
          (div {className: "row"},
            (div {className: runButtonClasses, onClick: SimulationStore.actions.runSimulation},
              tr "~DOCUMENT.ACTIONS.RUN"
              (i {className: "icon-codap-play"})
            )
            (div {className: "button disabled"},
              (i {className: "icon-codap-controlsReset"})
            )
            (div {className: "button disabled"},
              (i {className: "icon-codap-controlsBackward"})
            )
            (div {className: "button disabled"},
              (i {className: "icon-codap-controlsForward"})
            )
          )
          (div {className: "row left"},
            (div {className: "button small disabled"},
              (i {className: "icon-codap-saveGraph"})
              tr "~DOCUMENT.ACTIONS.SAVE_TO_GRAPHS"
            )
          )
        )
        (div {className: "options-panel"},
          (div {className: "row left short"},
            (input {type: 'checkbox', value: 'show-mini', checked: @props.showMiniGraphs})
            (label {}, tr '~DOCUMENT.ACTIONS.SHOW_MINI_GRAPHS')
          )
          (div {className: "row left short"},
            (input {type: 'checkbox', value: 'quick-test', checked: @props.quickTest})
            (label {}, tr '~DOCUMENT.ACTIONS.QUICK_TEST')
          )
          (div {className: "row left", style: {margin: "6px 0 -19px 0"}},
            (span {style: {marginTop: 2}}, "Speed")
            (div {style: {margin: "-11px 0 3px 7px"}},
              (ValueSlider {
                min: 0
                max: 1
                value: @state.speed
                width: 140
                stepSize: 0.05
                minLabel: (i {className: "icon-codap-speedSlow", style: {fontSize: 15, marginLeft: -5}})
                maxLabel: (i {className: "icon-codap-speedFast", style: {fontSize: 15, marginRight: -10}})
                renderValueTooltip: false
                onValueChange: SimulationStore.actions.setSpeed
              })
            )
          )
          (div {className: "row left"},
            "Step"
            (input {
              className: 'left'
              type: "number"
              style: {width: "#{Math.max 3, (@state.stepSize.toString().length+1)}em"}
              value: @state.stepSize
              min: "0"
              onChange: @setStepSize
            })
            (Dropdown {
              isActionMenu: false
              onSelect: SimulationStore.actions.setStepUnits
              anchor: @state.stepUnitsName
              items: @state.timeUnitOptions
            })
          )
        )
      )
    )
