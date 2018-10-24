/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { PaletteStore } from "./palette-store";
import { GraphActions } from "../actions/graph-actions";

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

    PaletteStore.listen(this.paletteChanged);
    return GraphActions.graphChanged.listen(this.graphChanged);
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
