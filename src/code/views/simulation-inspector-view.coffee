{RadioGroup, Radio}  = require 'react-radio-group'
RadioGroupF     = React.createFactory RadioGroup
RadioF          = React.createFactory Radio
Dropdown        = React.createFactory require './dropdown-view'
SimulationStore = require '../stores/simulation-store'
AppSettingsStore = require '../stores/app-settings-store'
GraphStore      = require('../stores/graph-store').store
tr              = require '../utils/translate'
{div, span, i, input, label}  = React.DOM

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

  setComplexity: (val) ->
    AppSettingsStore.actions.setComplexity val

  render: ->
    runPanelClasses = "run-panel"
    diagramOnly = @state.complexity is Complexity.diagramOnly
    if diagramOnly then runPanelClasses += " collapsed"

    minComplexity = GraphStore.getMinimumComplexity()
    diagramOnlyDisabled = minComplexity > Complexity.diagramOnly
    basicDisabled = minComplexity > Complexity.basic
    expandedDisabled = minComplexity > Complexity.expanded

    (div {className: "simulation-panel"},
      (div {className: "title"}, tr "~SIMULATION.DIAGRAM_SETTINGS")
      (RadioGroupF {
        name: "complexity"
        selectedValue: @state.complexity
        onChange: @setComplexity
        className: "radio-group"
      }, [
        (label {key: 'complexity-diagram-only'},
          (RadioF {value: Complexity.diagramOnly, disabled: diagramOnlyDisabled})
          (span {className: if diagramOnlyDisabled then "disabled"}, tr '~SIMULATION.COMPLEXITY.DIAGRAM_ONLY')
        )
        (label {key: 'complexity-basic'},
          (RadioF {value: Complexity.basic, disabled: basicDisabled})
          (span {className: if basicDisabled then "disabled"}, tr '~SIMULATION.COMPLEXITY.BASIC')
        )
        (label {key: 'complexity-expanded'},
          (RadioF {value: Complexity.expanded, disabled: expandedDisabled})
          (span {className: if expandedDisabled then "disabled"}, tr '~SIMULATION.COMPLEXITY.EXPANDED')
        )
        (label {key: 'complexity-collectors'},
          (RadioF {value: Complexity.collectors})
          (span {}, tr '~SIMULATION.COMPLEXITY.COLLECTORS')
        )
      ])
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
      (div {className: runPanelClasses},
        (div {className: "title"}, tr "~SIMULATION.SIMULATION_SETTINGS")

        (div {className: "row"},
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
      )

    )
