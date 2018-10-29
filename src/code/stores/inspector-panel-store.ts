import { Mixin } from "../mixins/components";
import { StoreUnsubscriber } from "./store-class";

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

export interface InspectorPanelMixinProps {}

export type InspectorPanelMixinState = InspectorPanelSettings;

export class InspectorPanelMixin extends Mixin<InspectorPanelMixinProps, InspectorPanelMixinState> {
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

InspectorPanelMixin.InitialState = _.clone(InspectorPanelStore.settings);
