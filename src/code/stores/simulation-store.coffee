AppSettingsStore   = require './app-settings-store'
ImportActions      = require '../actions/import-actions'
GraphActions       = require '../actions/graph-actions'
Simulation         = require "../models/simulation"
TimeUnits          = require '../utils/time-units'
tr                 = require '../utils/translate'

DEFAULT_SIMULATION_STEPS = 20
SimulationActions = Reflux.createActions(
  [
    "expandSimulationPanel"
    "collapseSimulationPanel"
    "runSimulation"
    "setDuration"
    "setStepUnits"
    "simulationStarted"
    "simulationFramesCreated"
    "recordingFramesCreated"
    "simulationEnded"
    "capNodeValues"
    "recordStream"
    "recordOne"
    "recordPeriod"
    "stopRecording"
    "recordingDidStart"
    "recordingDidEnd"
    "createExperiment"
    "toggledCollectorTo"
    "setExperimentNumber"
  ]
)
SimulationActions.runSimulation = Reflux.createAction({sync: true})

SimulationStore   = Reflux.createStore
  listenables: [
    SimulationActions, AppSettingsStore.actions,
    ImportActions, GraphActions]

  init: ->
    @defaultUnit = TimeUnits.defaultUnit
    @unitName    = TimeUnits.toString(@defaultUnit,true)
    @defaultCollectorUnit = TimeUnits.defaultCollectorUnit
    timeUnitOptions = ({name: TimeUnits.toString(unit, true), unit: unit} for unit in TimeUnits.units)

    @nodes = []
    @currentSimulation = null

    @settings =
      simulationPanelExpanded: false
      duration: DEFAULT_SIMULATION_STEPS
      experimentNumber: 1
      experimentFrame: 0
      stepUnits: @defaultUnit
      stepUnitsName: @unitName
      timeUnitOptions: timeUnitOptions
      capNodeValues: false
      modelIsRunning: false
      modelIsRunnable: false
      isTimeBased: false
      isRecording: false            # sending data to codap?
      isRecordingOne: false         # record-1 pressed?
      isRecordingStream: false      # record stream pressed?
      isRecordingPeriod: false      # record n units' pressed?

    @_updateModelIsRunnable()

  onSetExperimentNumber: (nextExperimentNumber) ->
    @settings.experimentNumber = nextExperimentNumber
    @notifyChange()

  onSetSimulationType: (simulationType) ->
    GraphActions.resetSimulation.trigger()

    @settings.isTimeBased = simulationType is AppSettingsStore.store.SimulationType.time

    if @settings.isTimeBased
      @_runSimulation()

    if simulationType is AppSettingsStore.store.SimulationType.diagramOnly
      SimulationActions.collapseSimulationPanel()

  onExpandSimulationPanel: ->
    @settings.simulationPanelExpanded = true
    @settings.modelIsRunning = true
    @_updateModelIsRunnable()
    if @settings.isTimeBased
      @_runSimulation()
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.simulationPanelExpanded = false
    @settings.modelIsRunning = false
    @_stopRecording()
    GraphActions.resetSimulation.trigger()
    @notifyChange()

  onGraphChanged: (data)->
    @nodes = data.nodes
    @_updateModelIsRunnable()
    @notifyChange()

  _updateUnitNames: ->
    pluralize = @settings.duration isnt 1
    @settings.timeUnitOptions = ({name: TimeUnits.toString(unit, pluralize), unit: unit} for unit in TimeUnits.units)
    @settings.stepUnitsName = TimeUnits.toString(@settings.stepUnits, pluralize)


  onSetDuration: (n) ->
    @settings.duration = Math.max 1, Math.min n, 5000
    @_updateUnitNames()
    @notifyChange()

  onSetStepUnits: (unit, hasCollectors=false) ->
    @settings.stepUnits = unit.unit
    @defaultCollectorUnit = unit.unit if hasCollectors or @_hasCollectors()
    @_updateUnitNames()
    @notifyChange()

  onImport: (data) ->
    _.merge @settings, data.settings.simulation
    hasCollectors = _.filter(data.nodes, (node) -> node.data.isAccumulator).length > 0
    @onSetStepUnits(unit: data.settings.simulation.stepUnits, hasCollectors)
    @notifyChange()


  onCapNodeValues: (cap) ->
    @settings.capNodeValues = cap
    @notifyChange()

  onRunSimulation: ->
    @_runSimulation()

  stepUnits: ->
    if @settings.isTimeBased
      @settings.stepUnits
    else
      @defaultUnit

  simulationDuration: ->
    @settings.duration + (if @settings.isTimeBased then 1 else 0)

  simulationStepCount: ->
    return @settings.duration + 1 if @settings.isTimeBased
    return @settings.duration if @settings.isRecordingPeriod
    1

  _runSimulation: ->
    if @settings.modelIsRunnable
      # graph-store listens and will reset the simulation when
      # it is run to clear pre-saved data after first load
      @settings.modelIsRunning = true
      @notifyChange()
      @currentSimulation = new Simulation
        nodes: @nodes
        duration: @simulationStepCount()
        capNodeValues: @settings.capNodeValues

        # Simulation events get triggered as Actions here, and are
        # available to anyone who listens to this store
        onFrames: (frames) =>
          SimulationActions.simulationFramesCreated(frames)
          if @settings.isRecording
            framesNoTime = _.map frames, (frame) =>
              frame.time = @settings.experimentFrame++
              # without collectors, start steps at 1
              ++frame.time unless @settings.isTimeBased
              return frame
            SimulationActions.recordingFramesCreated(framesNoTime)

        onStart: (nodeNames) =>
          SimulationActions.simulationStarted(nodeNames)
          if @settings.isRecording
            SimulationActions.recordingDidStart(nodeNames)

        onEnd: ->
          SimulationActions.simulationEnded()

      @currentSimulation.run()


  onSimulationStarted: ->
    @notifyChange()

  onSimulationEnded: ->
    @settings.modelIsRunning = false
    @notifyChange()

  _startRecording: ->
    @settings.isRecording = true

  _stopRecording: ->
    @settings.isRecording = false
    @settings.isRecordingOne = false
    @settings.isRecordingStream = false
    @settings.isRecordingPeriod = false
    SimulationActions.recordingDidEnd()

  onCreateExperiment: ->
    @settings.experimentNumber++
    @settings.experimentFrame = 0
    @notifyChange()

  onStopRecording: ->
    @_stopRecording()
    @notifyChange()

  onRecordOne: ->
    @_startRecording()
    @settings.isRecordingOne = true
    @_runSimulation()
    stopRecording = ->
      SimulationActions.stopRecording()
    @timeout = setTimeout(stopRecording, 500)
    @notifyChange()

  onRecordStream: ->
    @_startRecording()
    @settings.isRecordingStream = true
    @notifyChange()

  onRecordPeriod: ->
    @_startRecording()
    @settings.isRecordingPeriod = true
    @_runSimulation()
    stopRecording = ->
      SimulationActions.stopRecording()
    @timeout = setTimeout(stopRecording, 500)
    @notifyChange()

  onToggledCollectorTo: (checked) ->
    # only change the units automatically when we transition from 0 to 1 or 1 to 0 collector nodes
    numCollectors = (node for node in @nodes when node.isAccumulator).length
    if checked and numCollectors is 1
      @onSetStepUnits unit: @defaultCollectorUnit
    else if not checked and numCollectors is 0
      @onSetStepUnits unit: @defaultUnit

  _isModelRunnable: ->
    return false unless @settings.simulationPanelExpanded
    for node in @nodes
      for link in node.links
        return true if link.relation.isDefined
    return false

  _updateModelIsRunnable: ->
    @settings.modelIsRunnable = @_isModelRunnable()

  _hasCollectors: (nodes) ->
    for node in @nodes
      if node.isAccumulator then return true
    return false

  _getErrorMessage: ->
    # we just have the one error state right now
    tr "~DOCUMENT.ACTIONS.NO_DEFINED_LINKS"

  notifyChange: ->
    @trigger _.clone @settings

  importSettings: (data) ->
    _.merge @settings, data
    @notifyChange()

  serialize: ->
    duration:         @settings.duration
    stepUnits:        @settings.stepUnits
    capNodeValues:    @settings.capNodeValues

mixin =
  getInitialState: ->
    _.clone SimulationStore.settings

  componentDidMount: ->
    @simulationUnsubscribe = SimulationStore.listen @onSimulationStoreChange

  componentWillUnmount: ->
    # this one named explicitly as we have views that mixin both simulationStore
    # and appSettingsStore
    @simulationUnsubscribe()

  onSimulationStoreChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: SimulationActions
  store: SimulationStore
  mixin: mixin
