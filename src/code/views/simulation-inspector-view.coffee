Dropdown        = React.createFactory require './dropdown-view'
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

  setRelationshipSymbols: (e) ->
    AppSettingsStore.actions.relationshipSymbols e.target.checked

  render: ->
    runPanelClasses = "run-panel"
    if not @state.diagramOnly then runPanelClasses += " expanded"
    minigraphsCheckboxClass = "row"
    if @state.diagramOnly then minigraphsCheckboxClass += " disabled"

    (div {className: "simulation-panel"},
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
      (div {className: "title"}, tr "~SIMULATION.DIAGRAM_SETTINGS")
      (div {className: minigraphsCheckboxClass},
        (label {key: 'minigraphs-label'}, [
          input {
            key: 'minigraphs-checkbox'
            type: 'checkbox'
            value: 'show-mini'
            checked: @state.showingMinigraphs
            disabled: @state.diagramOnly
            onChange: @setShowingMinigraphs
          }
          tr '~DOCUMENT.ACTIONS.SHOW_MINI_GRAPHS'
        ])
      )
      (div {className: "row"},
        (label {key: 'diagram-label'}, [
          input {
            key: 'diagram-checkbox'
            type: 'checkbox'
            value: 'diagram-only'
            checked: @state.diagramOnly
            onChange: @setDiagramOnly
          }
          tr '~SIMULATION.DIAGRAM_ONLY'
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
