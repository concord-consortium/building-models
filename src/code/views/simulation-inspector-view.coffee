{RadioGroup, Radio}  = require 'react-radio-group'
RadioGroupF     = React.createFactory RadioGroup
RadioF          = React.createFactory Radio
Dropdown        = React.createFactory require './dropdown-view'
SimulationStore = require '../stores/simulation-store'
AppSettingsStore = require '../stores/app-settings-store'
GraphStore      = require('../stores/graph-store').store
tr              = require '../utils/translate'
{div, span, i, input, label}  = React.DOM

SimulationType = AppSettingsStore.store.SimulationType
Complexity = AppSettingsStore.store.Complexity

module.exports = React.createClass

  displayName: 'SimulationInspector'

  mixins: [ SimulationStore.mixin, AppSettingsStore.mixin ]

  setDuration: (e) ->
    SimulationStore.actions.setDuration parseInt e.target.value

  setCapNodeValues: (e) ->
    SimulationStore.actions.capNodeValues e.target.checked

  setShowingMinigraphs: (e) ->
    AppSettingsStore.actions.showMinigraphs e.target.checked

  setRelationshipSymbols: (e) ->
    AppSettingsStore.actions.relationshipSymbols e.target.checked

  setSimulationType: (val) ->
    AppSettingsStore.actions.setSimulationType val

  setComplexity: (val) ->
    AppSettingsStore.actions.setComplexity val

  render: ->
    runPanelClasses = "run-panel"
    diagramOnly = @state.simulationType is SimulationType.diagramOnly
    if diagramOnly then runPanelClasses += " collapsed"

    minSimulationType = GraphStore.getMinimumSimulationType()
    minComplexity = GraphStore.getMinimumComplexity()
    diagramOnlyDisabled = minSimulationType > SimulationType.diagramOnly
    staticDisabled = minSimulationType > SimulationType.static
    basicDisabled = minComplexity > Complexity.basic

    complexityRadioButtons = (
      (RadioGroupF {
        name: "complexity"
        selectedValue: @state.complexity
        onChange: @setComplexity
        className: "radio-group"
      }, [
        (label {key: 'complexity-basic'},
          (RadioF {value: Complexity.basic, disabled: basicDisabled})
          (span {className: if basicDisabled then "disabled"}, tr '~SIMULATION.COMPLEXITY.BASIC')
        )
        (label {key: 'complexity-expanded'},
          (RadioF {value: Complexity.expanded})
          (span {}, tr '~SIMULATION.COMPLEXITY.EXPANDED')
        )
      ])
    )

    (div {className: "simulation-panel"},
      (div {className: "title"}, tr "~SIMULATION.SIMULATION_SETTINGS")
      (RadioGroupF {
        name: "simulationType"
        selectedValue: @state.simulationType
        onChange: @setSimulationType
        className: "radio-group simulation-radio-buttons"
      }, [
        (label {key: 'simulation-type-diagram-only'},
          (RadioF {value: SimulationType.diagramOnly, disabled: diagramOnlyDisabled})
          (span {className: if diagramOnlyDisabled then "disabled"}, tr '~SIMULATION.COMPLEXITY.DIAGRAM_ONLY')
        )
        (div {key: 'simulation-static-options'},
          (label {key: 'simulation-type-static'},
            (RadioF {value: SimulationType.static, disabled: staticDisabled})
            (span {className: if staticDisabled then "disabled"}, tr '~SIMULATION.COMPLEXITY.STATIC')
          )
          (div {key: 'static-complexity', className: "expanding-submenu" + if @state.simulationType == SimulationType.static then " expanded" else ""},
            if @state.simulationType == SimulationType.static
              complexityRadioButtons
          )
        )
        (div {key: 'simulation-complexity-options'},
          (label {key: 'simulation-type-time'},
            (RadioF {value: SimulationType.time})
            (span {}, tr '~SIMULATION.COMPLEXITY.TIME')
          )
          (div {key: 'time-complexity',className: "expanding-submenu" + if @state.simulationType == SimulationType.time then " expanded" else ""},
            if @state.simulationType == SimulationType.time
              complexityRadioButtons
          )
        )
      ])

      (div {className: "row "+runPanelClasses},
          (label {key: 'cap-label'}, [
            input {
              key: 'cap-checkbox'
              type: 'checkbox'
              value: 'cap-values'
              checked: @state.capNodeValues
              onChange: @setCapNodeValues
            }
            tr '~SIMULATION.CAP_VALUES'
          ])
        )

      (div {className: runPanelClasses},
        (div {className: "title"}, tr "~SIMULATION.VIEW_SETTINGS")
        (div {className: "row"},
          (label {key: 'minigraphs-label'}, [
            input {
              key: 'minigraphs-checkbox'
              type: 'checkbox'
              value: 'show-mini'
              checked: @state.showingMinigraphs
              onChange: @setShowingMinigraphs
            }
            tr '~DOCUMENT.ACTIONS.SHOW_MINI_GRAPHS'
          ])
        )
        (div {className: "row"},
          (label {key: 'symbols-label'}, [
            input {
              key: 'symbols-checkbox'
              type: 'checkbox'
              value: 'relationship-symbols'
              checked: @state.relationshipSymbols
              onChange: @setRelationshipSymbols
            }
            tr '~SIMULATION.RELATIONSHIP_SYMBOLS'
          ])
        )
      )

    )
