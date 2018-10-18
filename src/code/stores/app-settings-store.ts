/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const HashParams      = require("../utils/hash-parameters");
const ImportActions   = require("../actions/import-actions");
const urlParams       = require("../utils/url-params");

const AppSettingsActions = Reflux.createActions(
  [
    "setComplexity",
    "setSimulationType",
    "showMinigraphs",
    "relationshipSymbols",
    "setTouchDevice"
  ]
);

const Complexity = {
  basic: 0,
  expanded: 1,
  DEFAULT: 1
};

const SimulationType = {
  diagramOnly: 0,
  static: 1,
  time: 2,
  DEFAULT: 1
};

const AppSettingsStore   = Reflux.createStore({
  listenables: [AppSettingsActions, ImportActions],

  init() {
    const simulationType = HashParams.getParam("simplified") || urlParams["simplified"] ?
      SimulationType.diagramOnly
      :
      SimulationType.DEFAULT;

    const uiElements = {
      globalNav: true,
      actionBar: true,
      inspectorPanel: true,
      nodePalette: true
    };
    const uiParams = HashParams.getParam("hide") || urlParams["hide"];
    // For situations where some ui elements need to be hidden, this parameter can be specified.
    // If this parameter is present, Any specified elements are disabled or hidden.
    // Example usage: hide=globalNav,inspectorPanel
    if (uiParams) {
      uiElements.globalNav = uiParams.indexOf("globalNav") === -1;
      uiElements.actionBar = uiParams.indexOf("actionBar") === -1;
      uiElements.inspectorPanel = uiParams.indexOf("inspectorPanel") === -1;
      uiElements.nodePalette = uiParams.indexOf("nodePalette") === -1;
    }

    const lockdown = (HashParams.getParam("lockdown") === "true") || urlParams["lockdown"];

    return this.settings = {
      showingSettingsDialog: false,
      complexity: Complexity.DEFAULT,
      simulationType,
      showingMinigraphs: false,
      relationshipSymbols: false,
      uiElements,
      lockdown,
      touchDevice: false
    };
  },

  onShowMinigraphs(show) {
    this.settings.showingMinigraphs = show;
    return this.notifyChange();
  },

  onSetComplexity(val) {
    this.settings.complexity = val;
    if (val === 0) {
      this.settings.showingMinigraphs = false;
    }
    return this.notifyChange();
  },

  onSetTouchDevice(val) {
    this.settings.touchDevice = val;
    return this.notifyChange();
  },

  onSetSimulationType(val) {
    this.settings.simulationType = val;
    return this.notifyChange();
  },

  onRelationshipSymbols(show) {
    this.settings.relationshipSymbols = show;
    return this.notifyChange();
  },

  notifyChange() {
    return this.trigger(_.clone(this.settings));
  },

  onImport(data) {
    _.merge(this.settings, data.settings);
    return this.notifyChange();
  },

  serialize() {
    return {
      complexity: this.settings.complexity,
      simulationType: this.settings.simulationType,
      showingMinigraphs: this.settings.showingMinigraphs,
      relationshipSymbols: this.settings.relationshipSymbols
    };
  }
});

AppSettingsStore.Complexity = Complexity;
AppSettingsStore.SimulationType = SimulationType;

const mixin = {
  getInitialState() {
    return _.clone(AppSettingsStore.settings);
  },

  componentDidMount() {
    return this.unsubscribe = AppSettingsStore.listen(this.onAppSettingsChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onAppSettingsChange(newData) {
    return this.setState(_.clone(newData));
  }
};

module.exports = {
  actions: AppSettingsActions,
  store: AppSettingsStore,
  mixin
};
