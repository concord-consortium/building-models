SimulationActions = Reflux.createActions(
  [
    "expandSimulationPanel"
    "collapseSimulationPanel"
  ]
)

SimulationStore   = Reflux.createStore
  listenables: [SimulationActions]

  init: ->
    @settings =
      expanded: false

  onExpandSimulationPanel: ->
    @settings.expanded = true
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.expanded = false
    @notifyChange()

  notifyChange: ->
    @trigger _.clone @settings

mixin =
  getInitialState: ->
    _.clone SimulationStore.settings

  componentDidMount: ->
    SimulationStore.listen @onSimulationStoreChange

  onSimulationStoreChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: SimulationActions
  store: SimulationStore
  mixin: mixin
