/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { CodapConnect } from "../models/codap-connect";
import { CodapActions } from "../actions/codap-actions";

export const CodapStore = Reflux.createStore({
  listenables: [CodapActions],

  init() {
    const codapConnect = CodapConnect.instance("building-models");
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

export const CodapMixin = {
  getInitialState() {
    return {
      codapHasLoaded: CodapStore.codapHasLoaded,
      hideUndoRedo:   CodapStore.hideUndoRedo
    };
  },

  componentDidMount() {
    return this.unsubscribe = CodapStore.listen(this.onCodapStateChange);
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
