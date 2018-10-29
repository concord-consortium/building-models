import { Mixin } from "../mixins/components";
import { StoreUnsubscriber } from "./store-class";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const Reflux = require("reflux");

interface InspectorPanelSettings {
  nowShowing: any; // TODO: get concrete type
  selectedLink: any; // TODO: get concrete type
}

export const InspectorPanelActions = Reflux.createActions(
  [
    "openInspectorPanel",
    "closeInspectorPanel"
  ]
);

export const InspectorPanelStore = Reflux.createStore({
  listenables: [InspectorPanelActions],

  init() {
    return this.settings = {
      nowShowing: null,
      selectedLink: null
    };
  },

  onOpenInspectorPanel(nowShowing, options) {
    this.settings.nowShowing = nowShowing;
    if ((options != null ? options.link : undefined) != null) { this.settings.selectedLink = options.link; }
    return this.notifyChange();
  },

  onCloseInspectorPanel() {
    this.settings.nowShowing = null;
    return this.notifyChange();
  },

  notifyChange() {
    return this.trigger(_.clone(this.settings));
  }
});

export const InspectorPanelMixin = {
  getInitialState() {
    return _.clone(InspectorPanelStore.settings);
  },

  componentDidMount() {
    return this.inspectorPanelUnsubscribe = InspectorPanelStore.listen(this.onInspectorPanelStoreChange);
  },

  componentWillUnmount() {
    return this.inspectorPanelUnsubscribe();
  },

  onInspectorPanelStoreChange(newData) {
    return this.setState(_.clone(newData));
  }
};

export interface InspectorPanelMixin2Props {}

export type InspectorPanelMixin2State = InspectorPanelSettings;

export class InspectorPanelMixin2 extends Mixin<InspectorPanelMixin2Props, InspectorPanelMixin2State> {
  private inspectorPanelUnsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.inspectorPanelUnsubscribe = InspectorPanelStore.listen(this.handleInspectorPanelStoreChange);
  }

  public componentWillUnmount() {
    return this.inspectorPanelUnsubscribe();
  }

  public handleInspectorPanelStoreChange = (newData) => {
    return this.setState(_.clone(newData));
  }
}

InspectorPanelMixin2.InitialState = _.clone(InspectorPanelStore.settings);
