/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const PaletteStore = require("./palette-store");
const UndoRedo     = require("../utils/undo-redo");

const paletteDialogActions = Reflux.createActions([
  "open", "close", "delete", "cancel", "select"
]);


const store = Reflux.createStore({
  listenables: [ paletteDialogActions ],

  init() {
    this.initValues();
    return this.undoManger = UndoRedo.instance({debug:false});
  },

  initValues() {
    this.showing         = false;
    this.deleted         = false;
    this.showReplacement = false;
    this.replacement     = null;
    return this._notifyChanges();
  },

  onOpen() {
    this.showing         = true;
    this.paletteItem     = PaletteStore.store.selectedPaletteItem;
    this.options         = _.without(PaletteStore.store.palette, this.paletteItem);
    this.showReplacement = false;
    this.deleted         = false;
    this.replacement     = null;

    _.each((require("./nodes-store")).store.nodes, node => {
      if (node.paletteItemIs(this.paletteItem)) {
        return this.showReplacement = true;
      }
    });

    if (this.showReplacement) {
      this.replacement = this.options[0];
    }
    this.undoManger.startCommandBatch();
    return this._notifyChanges();
  },

  onClose() {
    return this.close();
  },

  onSelect(replacement) {
    if (replacement) {
      this.replacement = replacement;
      return this._notifyChanges();
    }
  },

  onCancel() {
    return this.close();
  },

  onDelete(item) {
    this.deleted = true;
    PaletteStore.actions.delete(item);
    return this.close();
  },

  close() {
    this.showing = false;
    this._notifyChanges();
    this.undoManger.endCommandBatch();
    if (this.replacement && this.deleted) {
      return PaletteStore.actions.selectPaletteItem(this.replacement);
    } else if (!this.deleted) {
      this.undoManger.undo(true);
      return PaletteStore.actions.restoreSelection();
    }
  },



  _notifyChanges() {
    const data = {
      showing:         this.showing,
      paletteItem:     this.paletteItem,
      options:         this.options,
      replacement:     this.replacement,
      deleted:         this.deleted,
      showReplacement: this.showReplacement
    };
    return this.trigger(data);
  }
});


const listenerMixin = {
  actions: paletteDialogActions,

  getInitialState() {
    return {
      showing:         store.showing,
      paletteItem:     store.paletteItem,
      options:         store.options,
      replacement:     store.replacement,
      deleted:         store.deleted,
      showReplacement: store.showReplacement
    };
  },

  componentDidMount() {
    return this.unsubscribe = store.listen(this.onChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onChange(status) {
    return this.setState({
      showing:         status.showing,
      paletteItem:     status.paletteItem,
      options:         status.options,
      replacement:     status.replacement,
      deleted:         status.deleted,
      showReplacement: status.showReplacement
    });
  }
};

module.exports = {
  store,
  actions: paletteDialogActions,
  mixin: listenerMixin
};
