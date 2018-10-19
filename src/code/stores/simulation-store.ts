/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const AppSettingsStore   = require("./app-settings-store");
const ImportActions      = require("../actions/import-actions");
const GraphActions       = require("../actions/graph-actions");
const Simulation         = require("../models/simulation");
const TimeUnits          = require("../utils/time-units");
const tr                 = require("../utils/translate");

const DEFAULT_SIMULATION_STEPS = 20;
const SimulationActions = Reflux.createActions(
  [
    "expandSimulationPanel",
    "collapseSimulationPanel",
    "runSimulation",
    "setDuration",
    "setStepUnits",
    "simulationStarted",
    "simulationFramesCreated",
    "recordingFramesCreated",
    "simulationEnded",
    "capNodeValues",
    "recordStream",
    "recordOne",
    "recordPeriod",
    "stopRecording",
    "recordingDidStart",
    "recordingDidEnd",
    "createExperiment",
    "toggledCollectorTo",
    "setExperimentNumber"
  ]
);
SimulationActions.runSimulation = Reflux.createAction({sync: true});

const SimulationStore   = Reflux.createStore({
  listenables: [
    SimulationActions, AppSettingsStore.actions,
    ImportActions, GraphActions],

  init() {
    this.defaultUnit = TimeUnits.defaultUnit;
    this.unitName    = TimeUnits.toString(this.defaultUnit, true);
    this.defaultCollectorUnit = TimeUnits.defaultCollectorUnit;
    const timeUnitOptions = TimeUnits.units.map((unit) => ({name: TimeUnits.toString(unit, true), unit}));

    this.nodes = [];
    this.currentSimulation = null;

    this.settings = {
      simulationPanelExpanded: false,
      duration: DEFAULT_SIMULATION_STEPS,
      experimentNumber: 1,
      experimentFrame: 0,
      stepUnits: this.defaultUnit,
      stepUnitsName: this.unitName,
      timeUnitOptions,
      capNodeValues: false,
      modelIsRunning: false,
      modelIsRunnable: false,
      isTimeBased: false,
      isRecording: false,            // sending data to codap?
      isRecordingOne: false,         // record-1 pressed?
      isRecordingStream: false,      // record stream pressed?
      isRecordingPeriod: false      // record n units' pressed?
    };

    return this._updateModelIsRunnable();
  },

  onSetExperimentNumber(nextExperimentNumber) {
    this.settings.experimentNumber = nextExperimentNumber;
    return this.notifyChange();
  },

  onSetSimulationType(simulationType) {
    GraphActions.resetSimulation.trigger();

    this.settings.isTimeBased = simulationType === AppSettingsStore.store.SimulationType.time;

    this._runSimulation();

    if (simulationType === AppSettingsStore.store.SimulationType.diagramOnly) {
      return SimulationActions.collapseSimulationPanel();
    }
  },

  onExpandSimulationPanel() {
    this.settings.simulationPanelExpanded = true;
    this.settings.modelIsRunning = true;
    this._updateModelIsRunnable();
    this._runSimulation();
    return this.notifyChange();
  },

  onCollapseSimulationPanel() {
    this.settings.simulationPanelExpanded = false;
    this.settings.modelIsRunning = false;
    this._stopRecording();
    GraphActions.resetSimulation.trigger();
    return this.notifyChange();
  },

  onGraphChanged(data) {
    this.nodes = data.nodes;
    this._updateModelIsRunnable();
    return this.notifyChange();
  },

  _updateUnitNames() {
    const pluralize = this.settings.duration !== 1;
    this.settings.timeUnitOptions = TimeUnits.units.map((unit) => ({name: TimeUnits.toString(unit, pluralize), unit}));
    return this.settings.stepUnitsName = TimeUnits.toString(this.settings.stepUnits, pluralize);
  },


  onSetDuration(n) {
    this.settings.duration = Math.max(1, Math.min(n, 5000));
    this._updateUnitNames();
    return this.notifyChange();
  },

  onSetStepUnits(unit, hasCollectors) {
    if (hasCollectors == null) { hasCollectors = false; }
    this.settings.stepUnits = unit.unit;
    if (hasCollectors || this._hasCollectors()) { this.defaultCollectorUnit = unit.unit; }
    this._updateUnitNames();
    return this.notifyChange();
  },

  onImport(data) {
    _.merge(this.settings, data.settings.simulation);
    this.settings.isTimeBased = data.settings.simulationType === AppSettingsStore.store.SimulationType.time;
    const hasCollectors = _.filter(data.nodes, node => node.data.isAccumulator).length > 0;
    this.onSetStepUnits({unit: data.settings.simulation.stepUnits}, hasCollectors);
    return this.notifyChange();
  },


  onCapNodeValues(cap) {
    this.settings.capNodeValues = cap;
    return this.notifyChange();
  },

  onRunSimulation() {
    return this._runSimulation();
  },

  stepUnits() {
    if (this.settings.isTimeBased) {
      return this.settings.stepUnits;
    } else {
      return this.defaultUnit;
    }
  },

  simulationDuration() {
    return this.settings.duration + (this.settings.isTimeBased ? 1 : 0);
  },

  simulationStepCount() {
    if (this.settings.isTimeBased) { return this.settings.duration + 1; }
    if (this.settings.isRecordingPeriod) { return this.settings.duration; }
    return 1;
  },

  _runSimulation() {
    if (this.settings.modelIsRunnable) {
      // graph-store listens and will reset the simulation when
      // it is run to clear pre-saved data after first load
      this.settings.modelIsRunning = true;
      this.notifyChange();
      this.currentSimulation = new Simulation({
        nodes: this.nodes,
        duration: this.simulationStepCount(),
        capNodeValues: this.settings.capNodeValues,

        // Simulation events get triggered as Actions here, and are
        // available to anyone who listens to this store
        onFrames: frames => {
          SimulationActions.simulationFramesCreated(frames);
          if (this.settings.isRecording) {
            const framesNoTime = _.map(frames, frame => {
              frame.time = this.settings.experimentFrame++;
              // without collectors, start steps at 1
              if (!this.settings.isTimeBased) { ++frame.time; }
              return frame;
            });
            return SimulationActions.recordingFramesCreated(framesNoTime);
          }
        },

        onStart: nodeNames => {
          SimulationActions.simulationStarted(nodeNames);
          if (this.settings.isRecording) {
            return SimulationActions.recordingDidStart(nodeNames);
          }
        },

        onEnd() {
          return SimulationActions.simulationEnded();
        }
      });

      return this.currentSimulation.run();
    }
  },


  onSimulationStarted() {
    return this.notifyChange();
  },

  onSimulationEnded() {
    this.settings.modelIsRunning = false;
    return this.notifyChange();
  },

  _startRecording() {
    return this.settings.isRecording = true;
  },

  _stopRecording() {
    this.settings.isRecording = false;
    this.settings.isRecordingOne = false;
    this.settings.isRecordingStream = false;
    this.settings.isRecordingPeriod = false;
    return SimulationActions.recordingDidEnd();
  },

  onCreateExperiment() {
    this.settings.experimentNumber++;
    this.settings.experimentFrame = 0;
    return this.notifyChange();
  },

  onStopRecording() {
    this._stopRecording();
    return this.notifyChange();
  },

  onRecordOne() {
    this._startRecording();
    this.settings.isRecordingOne = true;
    this._runSimulation();
    const stopRecording = () => SimulationActions.stopRecording();
    this.timeout = setTimeout(stopRecording, 500);
    return this.notifyChange();
  },

  onRecordStream() {
    this._startRecording();
    this.settings.isRecordingStream = true;
    return this.notifyChange();
  },

  onRecordPeriod() {
    this._startRecording();
    this.settings.isRecordingPeriod = true;
    this._runSimulation();
    const stopRecording = () => SimulationActions.stopRecording();
    this.timeout = setTimeout(stopRecording, 500);
    return this.notifyChange();
  },

  onToggledCollectorTo(checked) {
    // only change the units automatically when we transition from 0 to 1 or 1 to 0 collector nodes
    const numCollectors = (this.nodes.filter((node) => node.isAccumulator)).length;
    if (checked && (numCollectors === 1)) {
      return this.onSetStepUnits({unit: this.defaultCollectorUnit});
    } else if (!checked && (numCollectors === 0)) {
      return this.onSetStepUnits({unit: this.defaultUnit});
    }
  },

  _isModelRunnable() {
    if (!this.settings.simulationPanelExpanded) { return false; }
    for (const node of this.nodes) {
      for (const link of node.links) {
        if (link.relation.isDefined) { return true; }
      }
    }
    return false;
  },

  _updateModelIsRunnable() {
    return this.settings.modelIsRunnable = this._isModelRunnable();
  },

  _hasCollectors(nodes) {
    for (const node of this.nodes) {
      if (node.isAccumulator) { return true; }
    }
    return false;
  },

  _getErrorMessage() {
    // we just have the one error state right now
    return tr("~DOCUMENT.ACTIONS.NO_DEFINED_LINKS");
  },

  notifyChange() {
    return this.trigger(_.clone(this.settings));
  },

  importSettings(data) {
    _.merge(this.settings, data);
    return this.notifyChange();
  },

  serialize() {
    return {
      duration:         this.settings.duration,
      stepUnits:        this.settings.stepUnits,
      capNodeValues:    this.settings.capNodeValues
    };
  }
});

const mixin = {
  getInitialState() {
    return _.clone(SimulationStore.settings);
  },

  componentDidMount() {
    return this.simulationUnsubscribe = SimulationStore.listen(this.onSimulationStoreChange);
  },

  componentWillUnmount() {
    // this one named explicitly as we have views that mixin both simulationStore
    // and appSettingsStore
    return this.simulationUnsubscribe();
  },

  onSimulationStoreChange(newData) {
    return this.setState(_.clone(newData));
  }
};

module.exports = {
  actions: SimulationActions,
  store: SimulationStore,
  mixin
};
