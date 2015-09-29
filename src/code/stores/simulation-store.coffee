GraphStore   = require('./graph-store').store
Simulation   = require "../models/simulation"
CodapConnect = require '../models/codap-connect'
tr           = require '../utils/translate'

SimulationActions = Reflux.createActions(
  [
    "expandSimulationPanel"
    "collapseSimulationPanel"
    "runSimulation"
    "setRunSteps"
  ]
)

SimulationStore   = Reflux.createStore
  listenables: [SimulationActions]

  init: ->
    @settings =
      expanded: false
      graphIsValid: true
      runSteps: 10
    @codapConnect = CodapConnect.instance 'building-models'


  onExpandSimulationPanel: ->
    @settings.expanded = true
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.expanded = false
    @notifyChange()

  onModelChanged: ->
    simulator = new Simulation
      nodes: GraphStore.getNodes()
    @settings.graphIsValid = simulator.graphIsValid()
    @notifyChange()

  onSetRunSteps: (n) ->
    @settings.runSteps = n
    @notifyChange()

  onRunSimulation: ->
    if @settings.graphIsValid
      steps = @settings.runSteps
      steps = Math.min steps, 5000
      simulator = new Simulation
        nodes: GraphStore.getNodes()
        duration: steps
        timeStep: 1
        reportFunc: (report) =>
          log.info report
          nodeInfo = (
            _.map report.endState, (n) ->
              "#{n.title} #{n.initialValue} → #{n.value}"
          ).join("\n")
          log.info "Run for #{report.steps} steps\n#{nodeInfo}:"
          @codapConnect.sendSimulationData(report)

      simulator.run()
      simulator.report()
    else
      alert tr "~DOCUMENT.ACTIONS.GRAPH_INVALID"

  notifyChange: ->
    @trigger _.clone @settings

mixin =
  getInitialState: ->
    _.clone SimulationStore.settings

  componentDidMount: ->
    SimulationStore.listen @onSimulationStoreChange
    GraphStore.addChangeListener SimulationStore.onModelChanged

  onSimulationStoreChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: SimulationActions
  store: SimulationStore
  mixin: mixin
