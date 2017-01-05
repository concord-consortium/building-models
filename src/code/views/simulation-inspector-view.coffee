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
      (div {className: "row"},
        (input {type: 'checkbox', value: 'relationship-symbols', checked: @state.relationshipSymbols, onChange: @setRelationshipSymbols})
        (label {}, tr '~SIMULATION.RELATIONSHIP_SYMBOLS')
      )

    )
