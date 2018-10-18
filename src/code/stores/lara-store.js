/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const LaraConnect = require('../models/lara-connect');
const LaraActions = require('../actions/lara-actions');

const laraStore   = Reflux.createStore({
  listenables: [LaraActions],

  init() {
    const laraConnect = LaraConnect.instance('building-models');
    return this.laraHasLoaded = false;
  },

  onLaraLoaded() {
    this.laraHasLoaded = true;
    return this.notifyChange();
  },

  notifyChange() {
    const data =
      {laraHasLoaded: this.laraHasLoaded};
    return this.trigger(data);
  }
});

const mixin = {
  getInitialState() {
    return {laraHasLoaded: laraStore.laraHasLoaded};
  },

  componentDidMount() {
    return this.unsubscribe = laraStore.listen(this.onLaraStateChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onLaraStateChange(status) {
    return this.setState({
      laraHasLoaded: status.laraHasLoaded});
  }
};

module.exports = {
  actions: LaraActions,
  store: laraStore,
  mixin
};
