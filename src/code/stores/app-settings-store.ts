/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const Reflux = require("reflux");

import * as React from "react";

import { HashParams } from "../utils/hash-parameters";
import { ImportActions } from "../actions/import-actions";
import { urlParams } from "../utils/url-params";
import { StoreClass, StoreUnsubscriber } from "./store-class";
import { Mixin } from "../mixins/components";

export declare class AppSettingsActionsClass {
  public setComplexity(val: any): void;  // TODO: get concrete class
  public setSimulationType(val: any): void;  // TODO: get concrete class
  public showMinigraphs(show: boolean): void;
  public relationshipSymbols(show: boolean): void;
  public setTouchDevice(val: any): void;  // TODO: get concrete class
}

export declare class AppSettingsStoreClass extends StoreClass {
  public Complexity: ComplexityType;
  public SimulationType: SimulationTypeType;
  public settings: any;  // TODO: get concrete class
}

export const AppSettingsActions: AppSettingsActionsClass = Reflux.createActions(
  [
    "setComplexity",
    "setSimulationType",
    "showMinigraphs",
    "relationshipSymbols",
    "setTouchDevice"
  ]
);

interface ComplexityType {
  basic: number;
  expanded: number;
  DEFAULT: number;
}
const Complexity: ComplexityType = {
  basic: 0,
  expanded: 1,
  DEFAULT: 1
};

interface SimulationTypeType {
  diagramOnly: number;
  static: number;
  time: number;
  DEFAULT: number;
}
const SimulationType: SimulationTypeType = {
  diagramOnly: 0,
  static: 1,
  time: 2,
  DEFAULT: 1
};

interface AppSettingsSettings {
  showingSettingsDialog: boolean;
  complexity: number;
  simulationType: number;
  showingMinigraphs: boolean;
  relationshipSymbols: boolean;
  uiElements: any;
  lockdown: any;
  touchDevice: boolean;
}

export const AppSettingsStore: AppSettingsStoreClass = Reflux.createStore({
  listenables: [AppSettingsActions, ImportActions],

  init() {
    const simulationType = HashParams.getParam("simplified") || urlParams.simplified ?
      SimulationType.diagramOnly
      :
      SimulationType.DEFAULT;

    const uiElements = {
      globalNav: true,
      actionBar: true,
      inspectorPanel: true,
      nodePalette: true
    };
    const uiParams = HashParams.getParam("hide") || urlParams.hide;
    // For situations where some ui elements need to be hidden, this parameter can be specified.
    // If this parameter is present, Any specified elements are disabled or hidden.
    // Example usage: hide=globalNav,inspectorPanel
    if (uiParams) {
      uiElements.globalNav = uiParams.indexOf("globalNav") === -1;
      uiElements.actionBar = uiParams.indexOf("actionBar") === -1;
      uiElements.inspectorPanel = uiParams.indexOf("inspectorPanel") === -1;
      uiElements.nodePalette = uiParams.indexOf("nodePalette") === -1;
    }

    const lockdown = (HashParams.getParam("lockdown") === "true") || urlParams.lockdown;

    return this.settings = {
      showingSettingsDialog: false,
      complexity: Complexity.DEFAULT,
      simulationType,
      showingMinigraphs: false,
      relationshipSymbols: false,
      uiElements,
      lockdown,
      touchDevice: false
    } as AppSettingsSettings;
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

export const AppSettingsMixin = {
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

export interface AppSettingsMixin2Props {}

export type AppSettingsMixin2State = AppSettingsSettings;

export class AppSettingsMixin2 extends Mixin<{}, AppSettingsMixin2State> {
  private unsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.unsubscribe = AppSettingsStore.listen(this.handleAppSettingsChange);
  }

  public componentWillUnmount() {
    return this.unsubscribe();
  }

  private handleAppSettingsChange = (newData) => {
    return this.setState(_.clone(newData));
  }
}
AppSettingsMixin2.InitialState = _.clone(AppSettingsStore.settings);
