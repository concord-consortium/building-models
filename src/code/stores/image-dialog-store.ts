/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// TODO:  This should be split up into and ImageDialogStore and a DialogStore…


const _ = require("lodash");
const Reflux = require("reflux");

import { PaletteStore } from "./palette-store";
import { Mixin } from "../mixins/components";
import { StoreUnsubscriber } from "./store-class";

export const ImageDialogActions = Reflux.createActions([
  "open", "close", "update", "cancel"
]);

export const ImageDialogStore = Reflux.createStore({
  listenables: [ ImageDialogActions ],

  init() {
    this.enableListening();
    return this.initValues();
  },

  initValues() {
    this.showingDialog    = false;
    this.keepShowing      = false;
    this.callback         = () => undefined;

    this.resetPaletteItem();
    return this._updateChanges();
  },

  resetPaletteItem() {
    return this.paletteItem = null;
  },

  enableListening() {
    return PaletteStore.listen(this.onPaletteSelect);
  },

  onOpen(callback) {
    if (callback == null) { callback = false; }
    this.keepShowing = true;
    this.resetPaletteItem();
    this.showingDialog = true;

    this.callback = null;
    if (callback) {
      this.callback = callback;
      this.keepShowing = false;
    }
    return this._updateChanges();
  },

  onPaletteSelect(status) {
    this.paletteItem = status.selectedPaletteItem;
    return this.finish();
  },  // Incase we need to trigger window closing

  close() {
    this.showingDialog = false;
    return this.resetPaletteItem();
  },

  onClose() {
    this.callback = null;
    this.close();
    return this._updateChanges();
  },

  onUpdate(data) {
    if (this.paletteItem) {
      this.paletteItem = _.merge(this.paletteItem, data);
    } else {
      this.paletteItem = data;
    }
    return this._updateChanges();
  },

  onCancel() {
    this.resetPaletteItem();
    return this.finish();
  },

  invoke_callback() {
    if (typeof this.callback === "function") {
      this.callback(this.paletteItem);
    }
    return this.callback = null;
  }, // once only

  finish() {
    this._updateChanges();
    this.invoke_callback();
    this.callback = null;
    this.resetPaletteItem();
    this._updateChanges();
    if (!this.keepShowing) {
      return ImageDialogActions.close.trigger();
    }
  },

  _updateChanges() {
    const data = {
      showingDialog: this.showingDialog,
      keepShowing: this.keepShowing,
      paletteItem: this.paletteItem
    };

    // log.info "Sending changes to listeners: #{JSON.stringify(data)}"
    return this.trigger(data);
  }
});

export const ImageDialogMixin = {
  actions: ImageDialogActions,

  getInitialState() {
    return {
      showingDialog: ImageDialogStore.showingDialog,
      keepShowing: ImageDialogStore.keepShowing,
      paletteItem: ImageDialogStore.paletteItem,
      selectedImage: ImageDialogStore.paletteItem
    };
  },

  componentDidMount() {
    return this.unsubscribe = ImageDialogStore.listen(this.onChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onChange(status) {
    return this.setState({
      showingDialog: status.showingDialog,
      keepShowing: status.keepShowing,
      paletteItem: status.paletteItem,
      selectedImage: status.paletteItem
    });
  }
};

export interface ImageDialogMixin2Props {}
export interface ImageDialogMixin2State {
  showingDialog: boolean;
  keepShowing: boolean;
  paletteItem: boolean;
  selectedImage: boolean;
}

export class ImageDialogMixin2 extends Mixin<{}, ImageDialogMixin2State> {
  public actions = ImageDialogActions;
  private unsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.unsubscribe = ImageDialogStore.listen(this.handleOnChange);
  }

  public componentWillUnmount() {
    return this.unsubscribe();
  }

  private handleOnChange = (status) => {
    this.setState({
      showingDialog: status.showingDialog,
      keepShowing: status.keepShowing,
      paletteItem: status.paletteItem,
      selectedImage: status.paletteItem
    });
  }
}

ImageDialogMixin2.InitialState = {
  showingDialog: ImageDialogStore.showingDialog,
  keepShowing: ImageDialogStore.keepShowing,
  paletteItem: ImageDialogStore.paletteItem,
  selectedImage: ImageDialogStore.paletteItem
};
