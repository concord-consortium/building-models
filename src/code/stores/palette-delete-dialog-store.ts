/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { PaletteStore, PaletteActions } from "./palette-store";
import { UndoRedo } from "../utils/undo-redo";
import { NodesStore } from "./nodes-store";

export const PaletteDeleteDialogActions = Reflux.createActions([
  "open", "close", "delete", "cancel", "select"
]);

export const PaletteDeleteDialogStore = Reflux.createStore({
  listenables: [ PaletteDeleteDialogActions ],

  init() {
    this.initValues();
    return this.undoManger = UndoRedo.instance({debug: false});
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
    this.paletteItem     = PaletteStore.selectedPaletteItem;
    this.options         = _.without(PaletteStore.palette, this.paletteItem);
    this.showReplacement = false;
    this.deleted         = false;
    this.replacement     = null;

    _.each(NodesStore.nodes, node => {
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
    PaletteActions.delete(item);
    return this.close();
  },

  close() {
    this.showing = false;
    this._notifyChanges();
    this.undoManger.endCommandBatch();
    if (this.replacement && this.deleted) {
      return PaletteActions.selectPaletteItem(this.replacement);
    } else if (!this.deleted) {
      this.undoManger.undo(true);
      return PaletteActions.restoreSelection();
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

export const PaletteDeleteDialogMixin = {

  actions: PaletteDeleteDialogActions,

  getInitialState() {
    return {
      showing:         PaletteDeleteDialogStore.showing,
      paletteItem:     PaletteDeleteDialogStore.paletteItem,
      options:         PaletteDeleteDialogStore.options,
      replacement:     PaletteDeleteDialogStore.replacement,
      deleted:         PaletteDeleteDialogStore.deleted,
      showReplacement: PaletteDeleteDialogStore.showReplacement
    };
  },

  componentDidMount() {
    return this.unsubscribe = PaletteDeleteDialogStore.listen(this.onChange);
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
