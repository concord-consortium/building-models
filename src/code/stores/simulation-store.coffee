GraphStore   = require('./graph-store').store
Simulation   = require "../models/simulation"
CodapConnect = require '../models/codap-connect'
TimeUnits    = require '../utils/time-units'
tr           = require '../utils/translate'

SimulationActions = Reflux.createActions(
  [
    "expandSimulationPanel"
    "collapseSimulationPanel"
    "runSimulation"
    "setPeriod"
    "setPeriodUnits"
    "setStepSize"
    "setStepUnits"
  ]
)

SimulationStore   = Reflux.createStore
  listenables: [SimulationActions]

  init: ->
    defaultUnit = TimeUnits.defaultUnit
    unitName    = TimeUnits.toString defaultUnit
    unitNamePl  = TimeUnits.toString defaultUnit, true
    options = ({name: TimeUnits.toString(unit, true), unit: unit} for unit in TimeUnits.units)

    @settings =
      simulationPanelExpanded: false
      graphIsValid: true
      period: 10
      periodUnits: defaultUnit
      periodUnitsName: unitNamePl
      stepSize: 1
      stepUnits: defaultUnit
      stepUnitsName: unitName
      timeUnitOptions: options
    @codapConnect = CodapConnect.instance 'building-models'


  onExpandSimulationPanel: ->
    @settings.simulationPanelExpanded = true
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.simulationPanelExpanded = false
    @notifyChange()

  onModelChanged: ->
    simulator = new Simulation
      nodes: GraphStore.getNodes()
    @settings.graphIsValid = simulator.graphIsValid()
    @notifyChange()

  onSetPeriod: (n) ->
    @settings.period = n
    @notifyChange()

  onSetPeriodUnits: (unit) ->
    @settings.periodUnits = unit.unit
    @settings.periodUnitsName = TimeUnits.toString unit.unit, true
    @notifyChange()

  onSetStepSize: (n) ->
    @settings.stepSize = n
    @_setStepUnitName()
    @notifyChange()

  onSetStepUnits: (unit) ->
    @settings.stepUnits = unit.unit
    @_setStepUnitName()
    @notifyChange()

  _setStepUnitName: ->
    pluralize = @settings.stepSize != 1
    @settings.stepUnitsName = TimeUnits.toString @settings.stepUnits, pluralize

  onRunSimulation: ->
    if @settings.graphIsValid
      steps = @settings.period
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
