/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CodapConnect = require('../models/codap-connect');
const CodapActions = require('../actions/codap-actions');

const codapStore   = Reflux.createStore({
  listenables: [CodapActions],

  init() {
    const codapConnect = CodapConnect.instance('building-models');
    this.codapHasLoaded = false;
    return this.hideUndoRedo   = false;
  },

  onCodapLoaded() {
    this.codapHasLoaded = true;
    return this.notifyChange();
  },

  onHideUndoRedo() {
    this.hideUndoRedo = true;
    return this.notifyChange();
  },

  notifyChange() {
    const data = {
      codapHasLoaded: this.codapHasLoaded,
      hideUndoRedo:   this.hideUndoRedo
    };
    return this.trigger(data);
  }
});

const mixin = {
  getInitialState() {
    return {
      codapHasLoaded: codapStore.codapHasLoaded,
      hideUndoRedo:   codapStore.hideUndoRedo
    };
  },

  componentDidMount() {
    return this.unsubscribe = codapStore.listen(this.onCodapStateChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onCodapStateChange(status) {
    return this.setState({
      codapHasLoaded: status.codapHasLoaded,
      hideUndoRedo:   status.hideUndoRedo
    });
  }
};

module.exports = {
  actions: CodapActions,
  store: codapStore,
  mixin
};
