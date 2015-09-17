AppSettingsActions = Reflux.createActions(
  [
    "showSettingsDialog"
    "close"
    "capNodeValues"
  ]
)

AppSettingsStore   = Reflux.createStore
  listenables: [AppSettingsActions]

  init: ->
    @settings =
      showingSettingsDialog: false
      capNodeValues: false

  onShowSettingsDialog: ->
    @settings.showingSettingsDialog = true
    @notifyChange()

  onClose: ->
    @settings.showingSettingsDialog = false
    @notifyChange()

  onCapNodeValues: (cap) ->
    @settings.capNodeValues = cap
    @notifyChange()

  notifyChange: ->
    @trigger _.clone @settings

  importSettings: (data) ->
    _.merge @settings, data

  serialize: ->
    capNodeValues: @settings.capNodeValues

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
