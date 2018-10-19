/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const undoRedoUIActions = Reflux.createActions(
  [
    "setCanUndoRedo"
  ]
);

const undoRedoUIStore = Reflux.createStore({
  listenables: [undoRedoUIActions],

  init(context) {
    this.canUndo = false;
    return this.canRedo = false;
  },

  onSetCanUndoRedo(canUndo, canRedo) {
    this.canUndo = canUndo;
    this.canRedo = canRedo;
    return this.notifyChange();
  },

  notifyChange() {
    const data = {
      canUndo: this.canUndo,
      canRedo: this.canRedo
    };
    return this.trigger(data);
  }
});

const undoRedoUIMixin = {
  getInitialState() {
    return {
      canUndo: undoRedoUIStore.canUndo,
      canRedo: undoRedoUIStore.canRedo
    };
  },

  componentDidMount() {
    this.unsubscribe = undoRedoUIStore.listen(this.onUndoRedoUIStateChange);
    // can't add listener in init due to order-of-initialization issues
    const GraphStore = require("./graph-store");
    return __guard__(__guard__(GraphStore != null ? GraphStore.store : undefined, x1 => x1.undoRedoManager), x => x.addChangeListener(this.onUndoRedoUIStateChange));
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onUndoRedoUIStateChange(state) {
    return this.setState({
      canUndo: state.canUndo,
      canRedo: state.canRedo
    });
  }
};

module.exports = {
  actions: undoRedoUIActions,
  store: undoRedoUIStore,
  mixin: undoRedoUIMixin
};

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
