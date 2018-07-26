HashParams      = require '../utils/hash-parameters'
ImportActions   = require '../actions/import-actions'

AppSettingsActions = Reflux.createActions(
  [
    "setComplexity"
    "setSimulationType"
    "showMinigraphs"
    "relationshipSymbols"
  ]
)

Complexity = {
  basic: 0
  expanded: 1
  DEFAULT: 1
}

SimulationType = {
  diagramOnly: 0
  static: 1
  time: 2
  DEFAULT: 1
}

AppSettingsStore   = Reflux.createStore
  listenables: [AppSettingsActions, ImportActions]

  init: ->
    simulationType = if HashParams.getParam('simplified')
      SimulationType.diagramOnly
    else
      SimulationType.DEFAULT

    uiElements = {
      globalNav: true,
      actionBar: true,
      inspectorPanel: true,
      nodePalette: true
    }
    uiParams = HashParams.getParam('hide')
    # For situations where some ui elements need to be hidden, this parameter can be specified.
    # If this parameter is present, Any specified elements are disabled or hidden.
    # Example usage: hide=globalNav,inspectorPanel
    if uiParams
      uiElements.globalNav = uiParams.indexOf("globalNav") == -1
      uiElements.actionBar = uiParams.indexOf("actionBar") == -1
      uiElements.inspectorPanel = uiParams.indexOf("inspectorPanel") == -1
      uiElements.nodePalette = uiParams.indexOf("nodePalette") == -1

    lockdown = HashParams.getParam('lockdown') == "true"

    @settings =
      showingSettingsDialog: false
      complexity: Complexity.DEFAULT
      simulationType: simulationType
      showingMinigraphs: false
      relationshipSymbols: false
      uiElements: uiElements
      lockdown: lockdown

  onShowMinigraphs: (show) ->
    @settings.showingMinigraphs = show
    @notifyChange()

  onSetComplexity: (val) ->
    @settings.complexity = val
    if val is 0
      @settings.showingMinigraphs = false
    @notifyChange()

  onSetSimulationType: (val) ->
    @settings.simulationType = val
    @notifyChange()

  onRelationshipSymbols: (show) ->
    @settings.relationshipSymbols = show
    @notifyChange()

  notifyChange: ->
    @trigger _.clone @settings

  onImport: (data) ->
    _.merge @settings, data.settings
    @notifyChange()

  serialize: ->
    complexity: @settings.complexity
    simulationType: @settings.simulationType
    showingMinigraphs: @settings.showingMinigraphs
    relationshipSymbols: @settings.relationshipSymbols

AppSettingsStore.Complexity = Complexity
AppSettingsStore.SimulationType = SimulationType

mixin =
  getInitialState: ->
    _.clone AppSettingsStore.settings

  componentDidMount: ->
    @unsubscribe = AppSettingsStore.listen @onAppSettingsChange

  componentWillUnmount: ->
    @unsubscribe()

  onAppSettingsChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: AppSettingsActions
  store: AppSettingsStore
  mixin: mixin
