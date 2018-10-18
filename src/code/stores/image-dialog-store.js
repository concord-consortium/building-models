/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// TODO:  This should be split up into and ImageDialogStore and a DialogStore…

const PaletteStore = require('./palette-store');

const imageDialogActions = Reflux.createActions([
    "open", "close", "update", "cancel"
  ]);


const store = Reflux.createStore({
  listenables: [ imageDialogActions ],

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
    return PaletteStore.store.listen(this.onPaletteSelect);
  },

  onOpen(callback){
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
    this.callback=null;
    this.close();
    return this._updateChanges();
  },

  onUpdate(data) {
    if (this.paletteItem) {
      this.paletteItem = _.merge(this.paletteItem, data);
    }
    else {}
    if (!this.paletteItem) { this.paletteItem = data; }
    return this._updateChanges();
  },

  onCancel() {
    this.resetPaletteItem();
    return this.finish();
  },

  invoke_callback() {
    if (typeof this.callback === 'function') {
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
      return imageDialogActions.close.trigger();
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


const listenerMixin = {
  actions: imageDialogActions,

  getInitialState() {
    return {
      showingDialog: store.showingDialog,
      keepShowing: store.keepShowing,
      paletteItem: store.paletteItem,
      selectedImage: store.paletteItem
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
      showingDialog: status.showingDialog,
      keepShowing: status.keepShowing,
      paletteItem: status.paletteItem,
      selectedImage: status.paletteItem
    });
  }
};

module.exports = {
  store,
  actions: imageDialogActions,
  mixin: listenerMixin
};
