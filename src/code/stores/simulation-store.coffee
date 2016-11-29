AppSettingsActions = require('./app-settings-store').actions
ImportActions      = require '../actions/import-actions'
GraphActions       = require '../actions/graph-actions'
Simulation         = require "../models/simulation"
TimeUnits          = require '../utils/time-units'
tr                 = require '../utils/translate'

SimulationActions = Reflux.createActions(
  [
    "expandSimulationPanel"
    "collapseSimulationPanel"
    "resetSimulation"
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
  ]
)
SimulationActions.runSimulation = Reflux.createAction({sync: true})

SimulationStore   = Reflux.createStore
  listenables: [
    SimulationActions, AppSettingsActions,
    ImportActions, GraphActions]

  init: ->
    defaultUnit = TimeUnits.defaultUnit
    unitName    = TimeUnits.toString(defaultUnit,true)
    defaultDuration = 50
    timeUnitOptions = ({name: TimeUnits.toString(unit, true), unit: unit} for unit in TimeUnits.units)

    @nodes = []
    @currentSimulation = null
    @experimentFrameIndex = 0

    @settings =
      simulationPanelExpanded: false
      duration: defaultDuration
      stepUnits: defaultUnit
      stepUnitsName: unitName
      timeUnitOptions: timeUnitOptions
      capNodeValues: false
      modelIsRunning: false
      modelIsRunnable: false
      graphHasCollector: false
      isRecording: false            # sending data to codap?
      isRecordingOne: false         # record-1 pressed?
      isRecordingStream: false      # record stream pressed?
      isRecordingPeriod: false      # record n units' pressed?

    @_updateModelIsRunnable()
    @_updateGraphHasCollector()

  # From AppSettingsStore actions
  onDiagramOnly: ->
    SimulationActions.collapseSimulationPanel()

  onExpandSimulationPanel: ->
    @settings.simulationPanelExpanded = true
    @settings.modelIsRunning = true
    SimulationActions.resetSimulation.trigger()
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.simulationPanelExpanded = false
    @settings.modelIsRunning = false
    @_stopRecording()
    @notifyChange()

  onGraphChanged: (data)->
    @nodes = data.nodes
    @_updateModelIsRunnable()
    @settings.graphHasCollector = @_updateGraphHasCollector()
    @notifyChange()

  _updateUnitNames: ->
    pluralize = @settings.duration isnt 1
    @settings.timeUnitOptions = ({name: TimeUnits.toString(unit, pluralize), unit: unit} for unit in TimeUnits.units)
    @settings.stepUnitsName = TimeUnits.toString(@settings.stepUnits, pluralize)


  onSetDuration: (n) ->
    @settings.duration = Math.max 1, Math.min n, 5000
    @_updateUnitNames()
    @notifyChange()

  onSetStepUnits: (unit) ->
    @settings.stepUnits = unit.unit
    @_updateUnitNames()
    @notifyChange()

  onImport: (data) ->
    _.merge @settings, data.settings.simulation
    @notifyChange()


  onCapNodeValues: (cap) ->
    @settings.capNodeValues = cap
    @notifyChange()

  onRunSimulation: ->
    @_runSimulation()

  stepUnits: ->
    if @settings.graphHasCollector
      @settings.stepUnits
    else
      TimeUnits.defaultUnit # "STEPS" when not specified or not running time interval

  _runSimulation: (duration=1)->
    if @settings.modelIsRunnable
      # graph-store listens and will reset the simulation when
      # it is run to clear pre-saved data after first load
      @settings.modelIsRunning = true
      if @settings.graphHasCollector
        duration = @settings.duration
      @notifyChange()
      @currentSimulation = new Simulation
        nodes: @nodes
        duration: duration
        capNodeValues: @settings.capNodeValues

        # Simulation events get triggered as Actions here, and are
        # available to anyone who listens to this store
        onFrames: (frames) =>
          SimulationActions.simulationFramesCreated(frames)
          if @settings.isRecording
            framesNoTime = _.map frames, (frame) =>
              @experimentFrameIndex++
              frame.time = @experimentFrameIndex
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

  onResetSimulation: ->
    @experimentFrameIndex = 0

  onStopRecording: ->
    @_stopRecording()
    @notifyChange()

  onRecordOne: ->
    @_startRecording()
    @settings.isRecordingOne = true
    @_runSimulation(1)
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
    @_runSimulation(@settings.duration)
    stopRecording = ->
      SimulationActions.stopRecording()
    @timeout = setTimeout(stopRecording, 500)
    @notifyChange()

  _isModelRunnable: ->
    for node in @nodes
      for link in node.links
        return true if link.relation.isDefined
    return false

  _updateModelIsRunnable: ->
    @settings.modelIsRunnable = @_isModelRunnable()

  _findCollectors: ->
    for node in @nodes
      if node.isAccumulator then return true
    return false

  _updateGraphHasCollector: ->
    hasCollectors = @_findCollectors()
    @_stopRecording() if hasCollectors isnt @settings.graphHasCollector
    @settings.graphHasCollector = hasCollectors

  _getErrorMessage: ->
    # we just have the one error state right now
    tr "~DOCUMENT.ACTIONS.NO_DEFINED_LINKS"

  notifyChange: ->
    @trigger _.clone @settings

  importSettings: (data) ->
    _.merge @settings, data
    @notifyChange()

  serialize: ->
    duration:       @settings.duration
    stepUnits:      @settings.stepUnits
    capNodeValues:  @settings.capNodeValues

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
