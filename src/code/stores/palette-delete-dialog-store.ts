/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const Reflux = require("reflux");

import { PaletteStore, PaletteActions } from "./palette-store";
import { undoRedoInstance } from "../utils/undo-redo";
import { NodesStore } from "./nodes-store";
import { Mixin } from "../mixins/components";
import { StoreUnsubscriber } from "./store-class";

export const PaletteDeleteDialogActions = Reflux.createActions([
  "open", "close", "delete", "cancel", "select"
]);

export const PaletteDeleteDialogStore = Reflux.createStore({
  listenables: [ PaletteDeleteDialogActions ],

  init() {
    this.initValues();
    // wait because of require order
    setTimeout(() => {
      this.undoManager = undoRedoInstance({debug: false});
    }, 1);
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
    this.undoManager.startCommandBatch();
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
    this.undoManager.endCommandBatch();
    if (this.replacement && this.deleted) {
      return PaletteActions.selectPaletteItem(this.replacement);
    } else if (!this.deleted) {
      this.undoManager.undo(true);
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

export interface PaletteDeleteDialogMixin2Props {}

export interface PaletteDeleteDialogMixin2State {
  showing: any; // TODO: get concrete type
  paletteItem: any; // TODO: get concrete type
  options: any; // TODO: get concrete type
  replacement: any; // TODO: get concrete type
  deleted: any; // TODO: get concrete type
  showReplacement: any; // TODO: get concrete type
}

export class PaletteDeleteDialogMixin2 extends Mixin<PaletteDeleteDialogMixin2Props, PaletteDeleteDialogMixin2State> {
  private unsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.unsubscribe = PaletteDeleteDialogStore.listen(this.handleChange);
  }

  public componentWillUnmount() {
    return this.unsubscribe();
  }

  private handleChange = (status) => {
    return this.setState({
      showing:         status.showing,
      paletteItem:     status.paletteItem,
      options:         status.options,
      replacement:     status.replacement,
      deleted:         status.deleted,
      showReplacement: status.showReplacement
    });
  }
}

PaletteDeleteDialogMixin2.InitialState = {
  showing:         PaletteDeleteDialogStore.showing,
  paletteItem:     PaletteDeleteDialogStore.paletteItem,
  options:         PaletteDeleteDialogStore.options,
  replacement:     PaletteDeleteDialogStore.replacement,
  deleted:         PaletteDeleteDialogStore.deleted,
  showReplacement: PaletteDeleteDialogStore.showReplacement
};


