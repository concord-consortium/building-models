/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const Reflux = require("reflux");

import { HashParams } from "../utils/hash-parameters";
import { ImportActions } from "../actions/import-actions";
import { urlParams } from "../utils/url-params";
import { StoreClass, StoreUnsubscriber } from "./store-class";
import { Mixin } from "../mixins/components";

export declare class AppSettingsActionsClass {
  public setComplexity(val: any): void;  // TODO: get concrete class
  public setSimulationType(val: any): void;  // TODO: get concrete class
  public relationshipSymbols(show: boolean): void;
  public guide(show: boolean): void;
  public setTouchDevice(val: any): void;  // TODO: get concrete class
  public setGuideItems(items: GuideItem[]): void;
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
    "relationshipSymbols",
    "guide",
    "setTouchDevice",
    "setGuideItems"
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
export const SimulationType: SimulationTypeType = {
  diagramOnly: 0,
  static: 1,
  time: 2,
  DEFAULT: 1
};

export interface GuideItem {
  itemTitle: string;
  url: string;
}

interface AppSettingsSettings {
  showingSettingsDialog: boolean;
  complexity: number;
  simulationType: number;
  relationshipSymbols: boolean;
  guide: boolean;
  guideItems: GuideItem[];
  uiElements: UIElements;
  lockdown: boolean;
  touchDevice: boolean;
}

export interface UIElements {
  globalNav: boolean;
  actionBar: boolean;
  inspectorPanel: boolean;
  nodePalette: boolean;
}

export const AppSettingsStore: AppSettingsStoreClass = Reflux.createStore({
  listenables: [AppSettingsActions, ImportActions],

  init() {
    const simulationType = HashParams.getParam("simplified") || urlParams.simplified ?
      SimulationType.diagramOnly
      :
      SimulationType.DEFAULT;

    const uiElements: UIElements = {
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

    const lockdown = (HashParams.getParam("lockdown") === "true") || (urlParams.lockdown === "true");

    return this.settings = {
      showingSettingsDialog: false,
      complexity: Complexity.DEFAULT,
      simulationType,
      relationshipSymbols: false,
      guide: false,
      guideItems: [],
      uiElements,
      lockdown,
      touchDevice: false
    } as AppSettingsSettings;
  },

  onSetComplexity(val) {
    this.settings.complexity = val;
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

  onGuide(show) {
    this.settings.guide = show;
    return this.notifyChange();
  },

  onSetGuideItems(items) {
    this.settings.guideItems = items;
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
      relationshipSymbols: this.settings.relationshipSymbols,
      guide: this.settings.guide
    };
  }
});

AppSettingsStore.Complexity = Complexity;
AppSettingsStore.SimulationType = SimulationType;

export interface AppSettingsMixinProps {}

export type AppSettingsMixinState = AppSettingsSettings;

export class AppSettingsMixin extends Mixin<AppSettingsMixinProps, AppSettingsMixinState> {
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
AppSettingsMixin.InitialState = () => _.clone(AppSettingsStore.settings);
