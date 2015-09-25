Dropdown        = React.createFactory require './dropdown-view'
ValueSlider     = React.createFactory require './value-slider-view'
SimulationStore = require '../stores/simulation-store'
tr              = require '../utils/translate'
{div, span, i, input, label}  = React.DOM

module.exports = React.createClass

  displayName: 'SimulationPanel'

  mixins: [ SimulationStore.mixin ]

  toggle: ->
    if @state.expanded
      SimulationStore.actions.collapseSimulationPanel()
    else
      SimulationStore.actions.expandSimulationPanel()

  render: ->
    expanded = if @state.expanded then "expanded" else "collapsed"
    (div {className: 'simulation-panel-wrapper'},
      (div {className: "top-button #{expanded}", onClick: @toggle},
        (div {},
          (i {className: "ivy-icon-simulateTool"})
        )
        (div {}, tr "~DOCUMENT.ACTIONS.SIMULATE")
      )
      (div {className: "simulation-panel #{expanded}"},
        (div {className: "run-panel"},
          (div {className: "row"},
            (Dropdown {anchor: "Years", items: []})
          )
          (div {className: "row tall"},
            (ValueSlider {
              min: "0"
              max: "10"
              value: "0"
              width: "180"}
            )
          )
          (div {className: "row"},
            (div {className: "button", onClick: @props.runSimulation},
              tr "~DOCUMENT.ACTIONS.RUN"
              (i {className: "ivy-icon-play"})
            )
            (div {className: "button disabled"},
              (i {className: "ivy-icon-controlsReset"})
            )
            (div {className: "button disabled"},
              (i {className: "ivy-icon-controlsBackward"})
            )
            (div {className: "button disabled"},
              (i {className: "ivy-icon-controlsForward"})
            )
          )
          (div {className: "row left"},
            (div {className: "button small disabled"},
              (i {className: "ivy-icon-saveGraph"})
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
          (div {className: "row left"},
            "Speed"
            (div {style: {margin: "-3px 0 3px 7px"}},
              (ValueSlider {
                min: "0"
                max: "10"
                value: "10"
                width: "140"}
              )
            )
          )
          (div {className: "row left"},
            "Step"
            (input {
              className: 'left'
              type: "number"
              size: "3"
              value: 1
              min: "0"}
            )
            (Dropdown {anchor: "Year", items: []})
          )
        )
      )
    )
