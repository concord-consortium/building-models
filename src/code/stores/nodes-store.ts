/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const PaletteStore       = require("./palette-store");
const GraphActions       = require("../actions/graph-actions");

const nodeActions = Reflux.createActions(
  [
    "nodesChanged"
  ]
);

const nodeStore   = Reflux.createStore({
  listenables: [nodeActions],

  init() {
    this.nodes               = [];
    this.paletteItemHasNodes = false;
    this.selectedPaletteItem = null;

    PaletteStore.store.listen(this.paletteChanged);
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
    this.selectedPaletteItem = PaletteStore.store.selectedPaletteItem;
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

const mixin = {
  getInitialState() {
    return {
      nodes: nodeStore.nodes,
      paletteItemHasNodes: nodeStore.paletteItemHasNodes
    };
  },

  componentDidMount() {
    return this.unsubscribe = nodeStore.listen(this.onNodesChange);
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

module.exports = {
  actions: nodeActions,
  store: nodeStore,
  mixin
};
