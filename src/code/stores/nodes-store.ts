/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const Reflux = require("reflux");

import { PaletteStore } from "./palette-store";
import { GraphActions } from "../actions/graph-actions";
import { Mixin } from "../mixins/components";
import { StoreUnsubscriber } from "./store-class";

export const NodesActions = Reflux.createActions(
  [
    "nodesChanged"
  ]
);

export const NodesStore   = Reflux.createStore({
  listenables: [NodesActions],

  init() {
    this.nodes               = [];
    this.paletteItemHasNodes = false;
    this.selectedPaletteItem = null;

    // wait because of require order
    setTimeout(() => {
      PaletteStore.listen(this.paletteChanged);
      GraphActions.graphChanged.listen(this.graphChanged);
    }, 1);
  },

  onNodesChanged(nodes) {
    this.nodes = nodes;
    return this.internalUpdate();
  },

  graphChanged(status) {
    this.nodes = status.nodes;
    return this.internalUpdate();
  },

  paletteChanged() {
    this.selectedPaletteItem = PaletteStore.selectedPaletteItem;
    return this.internalUpdate();
  },

  internalUpdate() {
    this.paletteItemHasNodes = false;
    if (!this.selectedPaletteItem) { return; }
    _.each(this.nodes, node => {
      if (node.paletteItemIs(this.selectedPaletteItem)) {
        return this.paletteItemHasNodes = true;
      }
    });
    return this.notifyChange();
  },

  notifyChange() {
    const data = {
      nodes: this.nodes,
      paletteItemHasNodes: this.paletteItemHasNodes
    };
    return this.trigger(data);
  }
});

export const NodesMixin = {
  getInitialState() {
    return {
      nodes: NodesStore.nodes,
      paletteItemHasNodes: NodesStore.paletteItemHasNodes
    };
  },

  componentDidMount() {
    return this.unsubscribe = NodesStore.listen(this.onNodesChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onNodesChange(status) {
    return this.setState({
      // nodes: status.nodes
      paletteItemHasNodes: status.paletteItemHasNodes});
  }
};

export interface NodesMixin2Props {}

export interface NodesMixin2State {
  // nodes: any; // TODO: get concrete type
  paletteItemHasNodes: any;
}

export class NodesMixin2 extends Mixin<NodesMixin2Props, NodesMixin2State> {
  private unsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.unsubscribe = NodesStore.listen(this.handleNodesChange);
  }

  public componentWillUnmount() {
    return this.unsubscribe();
  }

  private handleNodesChange = (status) => {
    this.setState({paletteItemHasNodes: status.paletteItemHasNodes});
  }
}

NodesMixin2.InitialState = {
  // nodes: [],
  paletteItemHasNodes: false
} as NodesMixin2State;
