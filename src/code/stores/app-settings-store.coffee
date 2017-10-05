HashParams      = require '../utils/hash-parameters'
ImportActions   = require '../actions/import-actions'

AppSettingsActions = Reflux.createActions(
  [
    "setComplexity"
    "showMinigraphs"
    "relationshipSymbols"
  ]
)

Complexity = {
  diagramOnly: 0,
  basic: 1,
  expanded: 2,
  collectors: 3,
  DEFAULT: 3
}

AppSettingsStore   = Reflux.createStore
  listenables: [AppSettingsActions, ImportActions]

  init: ->
    complexity = if HashParams.getParam('simplified')
      Complexity.diagramOnly
    else
      Complexity.DEFAULT

    @settings =
      showingSettingsDialog: false
      complexity: complexity
      showingMinigraphs: false
      relationshipSymbols: false

  onShowMinigraphs: (show) ->
    @settings.showingMinigraphs = show
    @notifyChange()

  onSetComplexity: (val) ->
    @settings.complexity = val
    if val is 0
      @settings.showingMinigraphs = false
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
    showingMinigraphs: @settings.showingMinigraphs
    relationshipSymbols: @settings.relationshipSymbols

AppSettingsStore.Complexity = Complexity

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
