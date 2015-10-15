HashParams      = require '../utils/hash-parameters'
ImportActions   = require '../actions/import-actions'

AppSettingsActions = Reflux.createActions(
  [
    "diagramOnly"
  ]
)

AppSettingsStore   = Reflux.createStore
  listenables: [AppSettingsActions, ImportActions]

  init: ->
    @settings =
      showingSettingsDialog: false
      diagramOnly: HashParams.getParam('simplified')

  onDiagramOnly: (diagramOnly) ->
    @settings.diagramOnly = diagramOnly
    @notifyChange()

  notifyChange: ->
    @trigger _.clone @settings
    if @settings.diagramOnly
      HashParams.setParam('simplified','true')
    else
      HashParams.clearParam('simplified')

  onImport: (data) ->
    _.merge @settings, data.settings
    @notifyChange()

  serialize: ->
    diagramOnly: @settings.diagramOnly

mixin =
  getInitialState: ->
    _.clone AppSettingsStore.settings

  componentDidMount: ->
    AppSettingsStore.listen @onAppSettingsChange

  onAppSettingsChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: AppSettingsActions
  store: AppSettingsStore
  mixin: mixin
